import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DataRow, DataTable } from '#/types/data'
import { inferColumnsFromRows } from '#/lib/demoSeed'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import {
  mapDbColumns,
  mapDbTable,
  normalizeRowData,
  type DbDataTable,
  type DbDataTableColumn,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'
import { invokeEdgeFunction } from '#/lib/api/invoke'

const ROW_BATCH = 500

async function fetchTableColumns(tableIds: string[]): Promise<DbDataTableColumn[]> {
  const supabase = getSupabase()
  if (!supabase || tableIds.length === 0) return []

  const { data, error } = await supabase
    .from('data_table_columns')
    .select('*')
    .in('data_table_id', tableIds)
    .order('ordinal')

  throwIfSupabaseError(error, 'api.fetchTableColumns', { tableIds })
  return (data ?? []) as DbDataTableColumn[]
}

async function fetchTablesForOrg(orgId: string): Promise<DataTable[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data: tables, error } = await supabase
    .from('data_tables')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  throwIfSupabaseError(error, 'api.fetchTables', { orgId })
  const tableRows = (tables ?? []) as DbDataTable[]
  if (tableRows.length === 0) return []

  const columns = await fetchTableColumns(tableRows.map((t) => t.id))
  const columnsByTable = new Map<string, DbDataTableColumn[]>()
  for (const col of columns) {
    const list = columnsByTable.get(col.data_table_id) ?? []
    list.push(col)
    columnsByTable.set(col.data_table_id, list)
  }

  return tableRows.map((table) =>
    mapDbTable(table, columnsByTable.get(table.id) ?? [], []),
  )
}

async function fetchTableRows(tableId: string, orgId: string): Promise<DataRow[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('data_table_rows')
    .select('row_data')
    .eq('organization_id', orgId)
    .eq('data_table_id', tableId)
    .limit(50_000)

  throwIfSupabaseError(error, 'api.fetchTableRows', { tableId, orgId })
  return (data ?? []).map((r) => normalizeRowData(r.row_data as Record<string, unknown>))
}

export async function importTableToOrg(
  orgId: string,
  input: { name: string; rows: DataRow[] },
  opts?: { viaEdge?: boolean },
): Promise<DataTable> {
  if (opts?.viaEdge !== false) {
    try {
      const { tableId, rowCount } = await invokeEdgeFunction<{ tableId: string; rowCount: number }>(
        'upsert-rows',
        { organizationId: orgId, name: input.name, rows: input.rows },
      )
      const columns = inferColumnsFromRows(input.rows)
      return mapDbTable(
        {
          id: tableId,
          organization_id: orgId,
          name: input.name.trim() || 'Imported Table',
          storage_backend: 'jsonb',
          row_count: rowCount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as DbDataTable,
        columns.map((col, ordinal) => ({
          id: `col-${ordinal}`,
          data_table_id: tableId,
          name: col.name,
          display_name: null,
          data_type: col.type,
          ordinal,
        })),
        input.rows,
      )
    } catch (err) {
      // Only fall back to direct client inserts when the edge function is not
      // deployed (404 / network). Auth/RLS/validation failures must surface.
      const msg = err instanceof Error ? err.message : String(err)
      const notDeployed = /404|Failed to fetch|Could not invoke|not found/i.test(msg)
      if (!notDeployed) throw err
    }
  }

  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const name = input.name.trim() || 'Imported Table'
  const columns = inferColumnsFromRows(input.rows)

  const { data: table, error: tableError } = await supabase
    .from('data_tables')
    .insert({
      organization_id: orgId,
      name,
      storage_backend: 'jsonb',
      row_count: input.rows.length,
    })
    .select('*')
    .single()

  throwIfSupabaseError(tableError, 'api.importTable.insertTable', { orgId, name })

  const tableRow = table as DbDataTable
  const columnPayload = columns.map((col, ordinal) => ({
    data_table_id: tableRow.id,
    name: col.name,
    data_type: col.type,
    ordinal,
  }))

  const { error: colError } = await supabase.from('data_table_columns').insert(columnPayload)
  throwIfSupabaseError(colError, 'api.importTable.insertColumns', { tableId: tableRow.id })

  for (let i = 0; i < input.rows.length; i += ROW_BATCH) {
    const chunk = input.rows.slice(i, i + ROW_BATCH).map((row_data) => ({
      organization_id: orgId,
      data_table_id: tableRow.id,
      row_data,
    }))
    const { error: rowError } = await supabase.from('data_table_rows').insert(chunk)
    throwIfSupabaseError(rowError, 'api.importTable.insertRows', {
      tableId: tableRow.id,
      offset: i,
    })
  }

  return mapDbTable(
    tableRow,
    columnPayload.map((c, i) => ({
      id: `col-${i}`,
      data_table_id: tableRow.id,
      name: c.name,
      display_name: null,
      data_type: c.data_type,
      ordinal: c.ordinal,
    })),
    input.rows,
  )
}

export async function deleteTableFromOrg(orgId: string, tableId: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase
    .from('data_tables')
    .delete()
    .eq('id', tableId)
    .eq('organization_id', orgId)

  throwIfSupabaseError(error, 'api.deleteTable', { orgId, tableId })
}

export function useTables(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.tables(orgId) : ['workspace', 'tables', 'none'],
    queryFn: () => fetchTablesForOrg(orgId!),
    enabled: Boolean(orgId),
  })
}

export function useTableWithRows(orgId: string | null, tableId: string | null) {
  return useQuery({
    queryKey:
      orgId && tableId ? [...workspaceKeys.table(orgId, tableId), 'rows'] : ['workspace', 'table', 'none'],
    queryFn: async () => {
      const tables = await fetchTablesForOrg(orgId!)
      const meta = tables.find((t) => t.id === tableId)
      if (!meta) throw new Error('Table not found')
      const rows = await fetchTableRows(tableId!, orgId!)
      return { ...meta, rows }
    },
    enabled: Boolean(orgId && tableId),
  })
}

export function useImportTable(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; rows: DataRow[] }) => {
      if (!orgId) throw new Error('No organization')
      return importTableToOrg(orgId, input)
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.tables(orgId) })
    },
  })
}

export function useDeleteTable(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tableId: string) => {
      if (!orgId) throw new Error('No organization')
      return deleteTableFromOrg(orgId, tableId)
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.tables(orgId) })
    },
  })
}

export { fetchTableRows, mapDbColumns }
