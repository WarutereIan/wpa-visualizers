import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

import { executeQueryForOrg } from '../_shared/runQueryEngine.ts'
import { mapQueryDefinitionFromDb } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Best-effort in-memory rate limiting per token (per edge instance).
// Supabase Edge Functions may run on multiple instances, so this is a soft limit;
// for hard rate limiting use Supabase Auth Rate Limits or an external gateway.
const MAX_PASSWORD_ATTEMPTS = 10
const ATTEMPT_WINDOW_MS = 10 * 60_000
const passwordAttempts = new Map<string, { count: number; firstAt: number }>()

function rateLimit(token: string): boolean {
  const now = Date.now()
  const entry = passwordAttempts.get(token)
  if (!entry || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
    passwordAttempts.set(token, { count: 1, firstAt: now })
    return true
  }
  entry.count++
  return entry.count <= MAX_PASSWORD_ATTEMPTS
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Legacy SHA-256 format: "salt:hex" (no prefix). Keep for backward compat with
  // links created before PBKDF2 migration.
  if (!stored.startsWith('pbkdf2:')) {
    const [salt, expected] = stored.split(':')
    if (!salt || !expected) return false
    const data = new TextEncoder().encode(`${salt}:${password}`)
    const hash = await crypto.subtle.digest('SHA-256', data)
    const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return hex === expected
  }
  const [, iterStr, salt, expected] = stored.split(':')
  const iterations = Number(iterStr) || 100_000
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === expected
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, password } = (await req.json()) as { token: string; password?: string }
    if (!token?.trim()) {
      return json({ error: 'token required' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: link, error } = await admin
      .from('shared_links')
      .select(
        'id, organization_id, dashboard_id, snapshot_id, password_hash, expires_at, embed_allowed, revoked',
      )
      .eq('token', token.trim())
      .maybeSingle()

    if (error || !link) {
      return json({ error: 'Link not found' }, 404)
    }

    if (link.revoked) {
      return json({ error: 'Link revoked' }, 410)
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return json({ error: 'Link expired' }, 410)
    }

    if (link.password_hash) {
      if (!password) {
        return json({ error: 'Password required' }, 401)
      }
      if (!rateLimit(token.trim())) {
        return json({ error: 'Too many attempts. Try again later.' }, 429)
      }
      if (!(await verifyPassword(password, link.password_hash))) {
        return json({ error: 'Invalid password' }, 401)
      }
    }

    if (link.snapshot_id) {
      const { data: snapshot } = await admin
        .from('dashboard_snapshots')
        .select('id, layout, data, period, created_at, organization_id')
        .eq('id', link.snapshot_id)
        .eq('organization_id', link.organization_id)
        .maybeSingle()
      if (!snapshot) {
        return json({ error: 'Snapshot not found' }, 404)
      }
      return json({
        type: 'snapshot',
        embedAllowed: link.embed_allowed,
        snapshot,
      })
    }

    if (link.dashboard_id) {
      const { data: dashboard } = await admin
        .from('dashboards')
        .select('id, name, description, layout, widgets, organization_id, updated_at')
        .eq('id', link.dashboard_id)
        .eq('organization_id', link.organization_id)
        .maybeSingle()
      if (!dashboard) {
        return json({ error: 'Dashboard not found' }, 404)
      }

      const { data: widgetRows } = await admin
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', link.dashboard_id)
        .eq('organization_id', link.organization_id)
        .order('created_at')

      const widgets = widgetRows ?? []
      if (widgets.length === 0) {
        return json({
          type: 'dashboard',
          embedAllowed: link.embed_allowed,
          dashboard,
        })
      }

      const vizIds = [
        ...new Set(
          widgets
            .map((w: { visualization_id: string | null }) => w.visualization_id)
            .filter((id: string | null): id is string => Boolean(id)),
        ),
      ]

      const { data: visualizationRows } = vizIds.length
        ? await admin
            .from('visualizations')
            .select('*')
            .in('id', vizIds)
            .eq('organization_id', link.organization_id)
        : { data: [] as Record<string, unknown>[] }

      const visualizations = visualizationRows ?? []
      const queryIds = [
        ...new Set(
          visualizations
            .map((v: { query_id: string }) => v.query_id)
            .filter((id: string | null | undefined): id is string => Boolean(id)),
        ),
      ]

      const { data: queryRows } = queryIds.length
        ? await admin
            .from('query_definitions')
            .select('*')
            .in('id', queryIds)
            .eq('organization_id', link.organization_id)
        : { data: [] as Record<string, unknown>[] }

      const queries = queryRows ?? []
      const queryResults: Record<string, Record<string, unknown>[]> = {}
      const queryErrors: Record<string, string> = {}

      for (const qrow of queries) {
        const queryDef = mapQueryDefinitionFromDb(qrow as Record<string, unknown>)
        try {
          queryResults[queryDef.id] = await executeQueryForOrg(
            admin,
            link.organization_id,
            queryDef.tableId,
            queryDef,
          )
        } catch (err) {
          queryErrors[queryDef.id] = err instanceof Error ? err.message : 'Query failed'
          queryResults[queryDef.id] = []
        }
      }

      return json({
        type: 'dashboard',
        embedAllowed: link.embed_allowed,
        dashboard,
        widgets,
        visualizations,
        queries,
        queryResults,
        queryErrors,
      })
    }

    return json({ error: 'Invalid link' }, 404)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ error: message }, 500)
  }
})
