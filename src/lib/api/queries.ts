import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DataRow, QueryDefinition } from '#/types/data'
import { runQueryDefinition } from '#/lib/queryEngine'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import { invokeEdgeFunction } from '#/lib/api/invoke'
import {
  mapDbQuery,
  mapQueryToDb,
  type DbQueryDefinition,
} from '#/lib/api/mappers'
import { fetchTableRows } from '#/lib/api/tables'
import { workspaceKeys } from '#/lib/api/workspace'

async function fetchQueriesForOrg(orgId: string): Promise<QueryDefinition[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('query_definitions')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  throwIfSupabaseError(error, 'api.fetchQueries', { orgId })
  return ((data ?? []) as DbQueryDefinition[]).map(mapDbQuery)
}

async function runQueryOnServer(orgId: string, query: QueryDefinition): Promise<DataRow[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data: tableMeta, error: tableError } = await supabase
    .from('data_tables')
    .select('id, storage_backend')
    .eq('id', query.tableId)
    .eq('organization_id', orgId)
    .maybeSingle()

  throwIfSupabaseError(tableError, 'api.runQuery.loadTable', { tableId: query.tableId })

  if (!tableMeta) throw new Error(`Table not found: ${query.tableId}`)

  if (tableMeta.storage_backend === 'parquet') {
    const result = await invokeEdgeFunction<{ rows: DataRow[] }>('run-query', {
      queryId: query.id,
      tableId: query.tableId,
      organizationId: orgId,
    })
    return result.rows ?? []
  }

  // Prefer server-side run-query when deployed (same engine as client path).
  try {
    const result = await invokeEdgeFunction<{ rows: DataRow[] }>('run-query', {
      queryId: query.id,
      tableId: query.tableId,
      organizationId: orgId,
      queryDef: query,
    })
    if (result.rows) return result.rows
  } catch {
    // Edge function unavailable — fall through to client-side engine.
  }

  const { data: columns, error: colError } = await supabase
    .from('data_table_columns')
    .select('name, data_type, ordinal')
    .eq('data_table_id', query.tableId)
    .order('ordinal')

  throwIfSupabaseError(colError, 'api.runQuery.loadColumns', { tableId: query.tableId })

  const rows = await fetchTableRows(query.tableId, orgId)
  const { data: tableNameRow } = await supabase
    .from('data_tables')
    .select('name')
    .eq('id', query.tableId)
    .maybeSingle()

  return runQueryDefinition(
    {
      id: query.tableId,
      name: tableNameRow?.name ?? 'Table',
      columns: (columns ?? []).map((c) => ({
        name: c.name,
        type: c.data_type as 'string' | 'number' | 'boolean',
      })),
      rows,
    },
    query,
  )
}

export function useQueries(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.queries(orgId) : ['workspace', 'queries', 'none'],
    queryFn: () => fetchQueriesForOrg(orgId!),
    enabled: Boolean(orgId),
  })
}

export function useRunQuery(orgId: string | null, query: QueryDefinition | null) {
  return useQuery({
    queryKey:
      orgId && query
        ? workspaceKeys.queryResult(orgId, query.id)
        : ['workspace', 'query-result', 'none'],
    queryFn: () => runQueryOnServer(orgId!, query!),
    enabled: Boolean(orgId && query),
  })
}

export function useCreateQuery(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<QueryDefinition, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const id = crypto.randomUUID()
      const payload = mapQueryToDb({ ...input, id }, orgId)
      const { data, error } = await supabase
        .from('query_definitions')
        .insert(payload)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.createQuery', { orgId })
      return mapDbQuery(data as DbQueryDefinition)
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.queries(orgId) })
    },
  })
}

export function useUpdateQuery(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Omit<QueryDefinition, 'id' | 'createdAt'>>
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.name !== undefined) update.name = patch.name
      if (patch.tableId !== undefined) update.table_id = patch.tableId
      if (patch.selectedColumns !== undefined) update.selected_columns = patch.selectedColumns
      if (patch.filters !== undefined) update.filters = patch.filters
      if (patch.groupBy !== undefined) update.group_by = patch.groupBy
      if (patch.aggregations !== undefined) update.aggregations = patch.aggregations

      const { data, error } = await supabase
        .from('query_definitions')
        .update(update)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateQuery', { orgId, id })
      return mapDbQuery(data as DbQueryDefinition)
    },
    onSuccess: (_data, vars) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.queries(orgId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.queryResult(orgId, vars.id) })
    },
  })
}

export function useDeleteQuery(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('query_definitions')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteQuery', { orgId, id })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.queries(orgId) })
    },
  })
}

export { runQueryOnServer }
