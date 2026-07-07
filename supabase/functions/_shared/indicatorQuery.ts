import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { compileQuery } from './queryCompiler.ts'
import { runParquetCompiledQuery } from './duckdbWorker.ts'
import { runQueryDefinition } from './queryEngine.ts'
import type { QueryDefinition } from './types.ts'

/**
 * Run a `QueryDefinition` against a table using the correct backend
 * (jsonb in Postgres via the in-JS engine, or Parquet via the DuckDB worker).
 * Used by `refresh-aggregates` so indicator recomputation works for promoted
 * (Parquet) tables, not just small jsonb tables. `run-query` keeps its own
 * inline copy because it also returns the table/column metadata to the client.
 */
export async function runQueryForTable(
  admin: SupabaseClient,
  orgId: string,
  tableId: string,
  queryDef: QueryDefinition,
): Promise<Record<string, unknown>[]> {
  const { data: table, error: tableError } = await admin
    .from('data_tables')
    .select('id, storage_backend')
    .eq('id', tableId)
    .eq('organization_id', orgId)
    .maybeSingle()
  if (tableError || !table) throw new Error('Table not found')

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
      { id: table.id, organizationId: orgId, storageBackend: 'parquet', columns: columnDefs },
      queryDef,
    )
    return runParquetCompiledQuery(admin, orgId, tableId, compiled)
  }

  const { data: rawRows, error: rowError } = await admin
    .from('data_table_rows')
    .select('row_data')
    .eq('organization_id', orgId)
    .eq('data_table_id', tableId)

  if (rowError) throw rowError

  return runQueryDefinition(
    {
      id: table.id,
      name: 'Table',
      columns: columnDefs,
      rows: (rawRows ?? []).map((r) => r.row_data as Record<string, string | number | boolean | null>),
    },
    queryDef,
  )
}
