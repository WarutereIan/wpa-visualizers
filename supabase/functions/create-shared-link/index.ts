import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgRole } from '../_shared/ingestCore.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const iterations = 100_000
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
  return `pbkdf2:${iterations}:${salt}:${hex}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as {
      organizationId: string
      dashboardId?: string
      snapshotId?: string
      password?: string
      expiresAt?: string
      embedAllowed?: boolean
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await assertOrgRole(admin, body.organizationId, user.id, ['owner', 'admin'])

    if (!body.dashboardId && !body.snapshotId) {
      return new Response(JSON.stringify({ error: 'dashboardId or snapshotId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.dashboardId) {
      const { data: dash, error: dashErr } = await admin
        .from('dashboards')
        .select('id')
        .eq('id', body.dashboardId)
        .eq('organization_id', body.organizationId)
        .maybeSingle()
      if (dashErr || !dash) {
        return new Response(JSON.stringify({ error: 'Dashboard not found in organization' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }
    if (body.snapshotId) {
      const { data: snap, error: snapErr } = await admin
        .from('dashboard_snapshots')
        .select('id')
        .eq('id', body.snapshotId)
        .eq('organization_id', body.organizationId)
        .maybeSingle()
      if (snapErr || !snap) {
        return new Response(JSON.stringify({ error: 'Snapshot not found in organization' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const token = crypto.randomUUID().replace(/-/g, '')
    const passwordHash = body.password?.trim() ? await hashPassword(body.password.trim()) : null

    const { data: link, error } = await admin
      .from('shared_links')
      .insert({
        organization_id: body.organizationId,
        dashboard_id: body.dashboardId ?? null,
        snapshot_id: body.snapshotId ?? null,
        token,
        password_hash: passwordHash,
        expires_at: body.expiresAt ?? null,
        embed_allowed: body.embedAllowed ?? false,
      })
      .select('id, token, expires_at, embed_allowed')
      .single()

    if (error) throw error

    return new Response(JSON.stringify(link), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message === 'Forbidden' ? 403 : 500
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
