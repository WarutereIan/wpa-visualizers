import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

import { compileQuery } from '../_shared/queryCompiler.ts'
import { runParquetCompiledQuery } from '../_shared/duckdbWorker.ts'
import { assertOrgMember } from '../_shared/ingestCore.ts'
import { runQueryDefinition } from '../_shared/queryEngine.ts'

import type { QueryDefinition } from '../_shared/types.ts'

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

    const { data: table, error: tableError } = await admin
      .from('data_tables')
      .select('id, name, organization_id, storage_backend')
      .eq('id', tableId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (tableError || !table) {
      return new Response(JSON.stringify({ error: 'Table not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let queryDef = body.queryDef as QueryDefinition | undefined
    if (!queryDef && queryId) {
      const { data: qrow, error: qerr } = await admin
        .from('query_definitions')
        .select('*')
        .eq('id', queryId)
        .eq('organization_id', organizationId)
        .maybeSingle()
      if (qerr || !qrow) throw qerr ?? new Error('Query not found')
      queryDef = {
        id: qrow.id,
        name: qrow.name,
        tableId: qrow.table_id,
        selectedColumns: qrow.selected_columns ?? [],
        filters: qrow.filters ?? [],
        groupBy: qrow.group_by ?? [],
        aggregations: qrow.aggregations ?? [],
        createdAt: qrow.created_at,
        updatedAt: qrow.updated_at,
      }
    }

    if (!queryDef) {
      return new Response(JSON.stringify({ error: 'queryId or queryDef required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: columns } = await admin
      .from('data_table_columns')
      .select('name, data_type, ordinal')
      .eq('data_table_id', tableId)
      .order('ordinal')

    const columnDefs = (columns ?? []).map((c) => ({
      name: c.name,
      type: c.data_type as 'string' | 'number' | 'boolean',
    }))

    if (table.storage_backend === 'parquet') {
      const compiled = compileQuery(
        {
          id: table.id,
          organizationId,
          storageBackend: 'parquet',
          columns: columnDefs,
        },
        queryDef,
      )
      const rows = await runParquetCompiledQuery(admin, organizationId, tableId, compiled)
      return new Response(JSON.stringify({ rows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rawRows, error: rawError } = await admin
      .from('data_table_rows')
      .select('row_data')
      .eq('organization_id', organizationId)
      .eq('data_table_id', tableId)
      .limit(50_000)

    if (rawError) throw rawError

    const rows = runQueryDefinition(
      {
        id: table.id,
        name: table.name,
        columns: columnDefs,
        rows: (rawRows ?? []).map((r) => r.row_data as Record<string, string | number | boolean | null>),
      },
      queryDef,
    )

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
