import { compileQuery, type CompiledTableMeta } from './queryCompiler.ts'
import { runParquetCompiledQuery } from './duckdbWorker.ts'
import { runQueryDefinition } from './queryEngine.ts'
import type { DataColumnDef, DataRow, QueryDefinition } from './types.ts'

// Service-role supabase-js client. Typed loosely so run-query and shared-link-access
// can pass their createClient() instances without fighting Deno generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

async function loadTableBundle(
  admin: AdminClient,
  organizationId: string,
  tableId: string,
): Promise<{
  id: string
  name: string
  storage_backend: string
  columns: DataColumnDef[]
  rows: DataRow[]
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

  const columnDefs: DataColumnDef[] = ((columns as { name: string; data_type: DataColumnDef['type'] }[] | null) ?? []).map(
    (c) => ({
      name: c.name,
      type: c.data_type,
    }),
  )

  if (table.storage_backend === 'parquet') {
    return {
      id: String(table.id),
      name: String(table.name),
      storage_backend: String(table.storage_backend),
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
    id: String(table.id),
    name: String(table.name),
    storage_backend: String(table.storage_backend ?? 'jsonb'),
    columns: columnDefs,
    rows: ((rawRows as { row_data: DataRow }[] | null) ?? []).map((r) => r.row_data),
  }
}

/**
 * Shared DSL execution used by `run-query` (authed) and `shared-link-access` (anon token).
 * Do not reimplement the compiler/engine in a new function.
 */
export async function executeQueryForOrg(
  admin: AdminClient,
  organizationId: string,
  tableId: string,
  queryDef: QueryDefinition,
): Promise<DataRow[]> {
  const primary = await loadTableBundle(admin, organizationId, tableId)

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
    return rows as DataRow[]
  }

  return runQueryDefinition(
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
}
