import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { runIngest, assertOrgMember } from '../_shared/ingestCore.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let userId: string | null = null

    const cronSecret = Deno.env.get('CRON_SECRET')
    const headerSecret = req.headers.get('X-Cron-Secret')
    const authHeader = req.headers.get('Authorization')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    let triggeredByCron = false
    if (cronSecret && headerSecret === cronSecret) {
      triggeredByCron = true
    } else if (authHeader) {
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
      userId = user.id
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const targetOrgId = (body as { organizationId?: string }).organizationId

    // Use the SQL helper as the single source of truth for "due" logic.
    const { data: dueConnections, error: dueError } = await admin.rpc('connections_due_for_sync')
    if (dueError) throw dueError

    type DueConn = {
      connection_id: string
      organization_id: string
      sync_schedule: string
      last_sync_at: string | null
    }
    let due = (dueConnections ?? []) as DueConn[]
    if (targetOrgId) due = due.filter((c) => c.organization_id === targetOrgId)

    const results: Array<{ connectionId: string; status: string; error?: string }> = []

    for (const conn of due) {
      try {
        if (!triggeredByCron && userId) {
          await assertOrgMember(admin, conn.organization_id, userId)
        }
        // Mark running before ingest so concurrent cron runs don't double-pick
        // (connections_due_for_sync excludes status='running').
        await admin
          .from('data_source_connections')
          .update({ last_sync_status: 'running', updated_at: new Date().toISOString() })
          .eq('id', conn.connection_id)

        await runIngest({
          admin,
          orgId: conn.organization_id,
          userId: 'scheduled-sync',
          connectionId: conn.connection_id,
        })

        await admin.functions
          .invoke('refresh-aggregates', {
            body: { organizationId: conn.organization_id },
            headers: cronSecret ? { 'X-Cron-Secret': cronSecret } : undefined,
          })
          .catch((err: unknown) =>
            console.error(`scheduled-sync: refresh-aggregates failed for ${conn.connection_id}`, err),
          )
        results.push({ connectionId: conn.connection_id, status: 'success' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed'
        results.push({ connectionId: conn.connection_id, status: 'failed', error: message })
      }
    }

    return new Response(JSON.stringify({ synced: results.length, results }), {
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
