import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

import { assertOrgMember } from '../_shared/orgAuth.ts'
import { executeQueryForOrg } from '../_shared/runQueryEngine.ts'
import { mapQueryDefinitionFromDb, type QueryDefinition } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const body = await req.json()
    const { queryId, tableId, organizationId } = body as {
      queryId?: string
      tableId: string
      organizationId: string
      queryDef?: QueryDefinition
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

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

    await assertOrgMember(admin, organizationId, user.id)

    let queryDef = body.queryDef as QueryDefinition | undefined
    if (!queryDef && queryId) {
      const { data: qrow, error: qerr } = await admin
        .from('query_definitions')
        .select('*')
        .eq('id', queryId)
        .eq('organization_id', organizationId)
        .maybeSingle()
      if (qerr || !qrow) throw qerr ?? new Error('Query not found')
      queryDef = mapQueryDefinitionFromDb(qrow as Record<string, unknown>)
    }

    if (!queryDef) {
      return new Response(JSON.stringify({ error: 'queryId or queryDef required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rows = await executeQueryForOrg(admin, organizationId, tableId, queryDef)
    return new Response(JSON.stringify({ rows }), {
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
