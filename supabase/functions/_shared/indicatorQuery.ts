import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { compileQuery, type CompiledTableMeta } from './queryCompiler.ts'
import { runParquetCompiledQuery } from './duckdbWorker.ts'
import { runQueryDefinition } from './queryEngine.ts'
import { mapQueryDefinitionFromDb, type DataColumnDef, type QueryDefinition } from './types.ts'

async function loadTableBundle(
  admin: SupabaseClient,
  orgId: string,
  tableId: string,
) {
  const { data: table, error: tableError } = await admin
    .from('data_tables')
    .select('id, name, storage_backend')
    .eq('id', tableId)
    .eq('organization_id', orgId)
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
      name: table.name as string,
      storage_backend: 'parquet' as const,
      columns: columnDefs,
      rows: [] as Record<string, string | number | boolean | null>[],
    }
  }

  const { data: rawRows, error: rowError } = await admin
    .from('data_table_rows')
    .select('row_data')
    .eq('organization_id', orgId)
    .eq('data_table_id', tableId)

  if (rowError) throw rowError

  return {
    id: table.id,
    name: (table.name as string) ?? 'Table',
    storage_backend: 'jsonb' as const,
    columns: columnDefs,
    rows: (rawRows ?? []).map((r) => r.row_data as Record<string, string | number | boolean | null>),
  }
}

/**
 * Run a QueryDefinition against a table using the correct backend.
 * Supports joins, date grains, computed fields, sort, and limit —
 * same semantics as the client query engine.
 */
export async function runQueryForTable(
  admin: SupabaseClient,
  orgId: string,
  tableId: string,
  queryDef: QueryDefinition,
): Promise<Record<string, unknown>[]> {
  // Normalize in case callers pass a partial / snake_case row
  const query =
    'tableId' in queryDef && queryDef.tableId
      ? queryDef
      : mapQueryDefinitionFromDb(queryDef as unknown as Record<string, unknown>)

  const primary = await loadTableBundle(admin, orgId, tableId)
  const catalog = [primary]
  for (const join of query.joins ?? []) {
    if (catalog.some((t) => t.id === join.tableId)) continue
    catalog.push(await loadTableBundle(admin, orgId, join.tableId))
  }

  if (primary.storage_backend === 'parquet') {
    const primaryMeta: CompiledTableMeta = {
      id: primary.id,
      name: primary.name,
      organizationId: orgId,
      storageBackend: 'parquet',
      columns: primary.columns,
    }
    const joinedMeta: CompiledTableMeta[] = catalog
      .filter((t) => t.id !== primary.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        organizationId: orgId,
        storageBackend: 'parquet' as const,
        columns: t.columns,
      }))
    const compiled = compileQuery(primaryMeta, query, joinedMeta)
    return runParquetCompiledQuery(admin, orgId, tableId, compiled)
  }

  return runQueryDefinition(
    {
      id: primary.id,
      name: primary.name,
      columns: primary.columns,
      rows: primary.rows,
    },
    query,
    catalog.map((t) => ({
      id: t.id,
      name: t.name,
      columns: t.columns,
      rows: t.rows,
    })),
  )
}
