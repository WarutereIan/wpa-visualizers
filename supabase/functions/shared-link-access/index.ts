import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, password } = (await req.json()) as { token: string; password?: string }
    if (!token?.trim()) {
      return new Response(JSON.stringify({ error: 'token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: link, error } = await admin
      .from('shared_links')
      .select('id, dashboard_id, snapshot_id, password_hash, expires_at, embed_allowed')
      .eq('token', token.trim())
      .maybeSingle()

    if (error || !link) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (link.password_hash) {
      if (!password || !rateLimit(token.trim())) {
        return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!(await verifyPassword(password, link.password_hash))) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
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
        return new Response(JSON.stringify({ error: 'Snapshot not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(
        JSON.stringify({
          type: 'snapshot',
          embedAllowed: link.embed_allowed,
          snapshot,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (link.dashboard_id) {
      const { data: dashboard } = await admin
        .from('dashboards')
        .select('id, name, description, layout, widgets, organization_id')
        .eq('id', link.dashboard_id)
        .eq('organization_id', link.organization_id)
        .maybeSingle()
      if (!dashboard) {
        return new Response(JSON.stringify({ error: 'Dashboard not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(
        JSON.stringify({
          type: 'dashboard',
          embedAllowed: link.embed_allowed,
          dashboard,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ error: 'Invalid link' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
