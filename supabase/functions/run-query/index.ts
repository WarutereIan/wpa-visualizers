import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

import { compileQuery, type CompiledTableMeta } from '../_shared/queryCompiler.ts'
import { runParquetCompiledQuery } from '../_shared/duckdbWorker.ts'
import { assertOrgMember } from '../_shared/orgAuth.ts'
import { runQueryDefinition } from '../_shared/queryEngine.ts'
import { mapQueryDefinitionFromDb, type DataColumnDef, type QueryDefinition } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function loadTableBundle(
  admin: ReturnType<typeof createClient>,
  organizationId: string,
  tableId: string,
): Promise<{
  id: string
  name: string
  storage_backend: string
  columns: DataColumnDef[]
  rows: Record<string, string | number | boolean | null>[]
}> {
  const { data: table, error: tableError } = await admin
    .from('data_tables')
    .select('id, name, organization_id, storage_backend')
    .eq('id', tableId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (tableError || !table) throw new Error('Table not found')

  const { data: columns } = await admin
    .from('data_table_columns')
    .select('name, data_type, ordinal')
    .eq('data_table_id', tableId)
    .order('ordinal')

  const columnDefs: DataColumnDef[] = (columns ?? []).map((c) => ({
    name: c.name,
    type: c.data_type as DataColumnDef['type'],
  }))

  if (table.storage_backend === 'parquet') {
    return {
      id: table.id,
      name: table.name,
      storage_backend: table.storage_backend,
      columns: columnDefs,
      rows: [],
    }
  }

  const { data: rawRows, error: rawError } = await admin
    .from('data_table_rows')
    .select('row_data')
    .eq('organization_id', organizationId)
    .eq('data_table_id', tableId)
    .limit(50_000)

  if (rawError) throw rawError

  return {
    id: table.id,
    name: table.name,
    storage_backend: table.storage_backend ?? 'jsonb',
    columns: columnDefs,
    rows: (rawRows ?? []).map((r) => r.row_data as Record<string, string | number | boolean | null>),
  }
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

    const primary = await loadTableBundle(admin, organizationId, tableId)

    // Load joined tables (metadata + rows for jsonb; metadata for parquet)
    const catalog = [primary]
    for (const join of queryDef.joins ?? []) {
      if (catalog.some((t) => t.id === join.tableId)) continue
      catalog.push(await loadTableBundle(admin, organizationId, join.tableId))
    }

    if (primary.storage_backend === 'parquet') {
      const primaryMeta: CompiledTableMeta = {
        id: primary.id,
        name: primary.name,
        organizationId,
        storageBackend: 'parquet',
        columns: primary.columns,
      }
      const joinedMeta: CompiledTableMeta[] = catalog
        .filter((t) => t.id !== primary.id)
        .map((t) => ({
          id: t.id,
          name: t.name,
          organizationId,
          storageBackend: 'parquet' as const,
          columns: t.columns,
        }))

      const compiled = compileQuery(primaryMeta, queryDef, joinedMeta)
      const rows = await runParquetCompiledQuery(admin, organizationId, tableId, compiled)
      return new Response(JSON.stringify({ rows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rows = runQueryDefinition(
      {
        id: primary.id,
        name: primary.name,
        columns: primary.columns,
        rows: primary.rows,
      },
      queryDef,
      catalog.map((t) => ({
        id: t.id,
        name: t.name,
        columns: t.columns,
        rows: t.rows,
      })),
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
