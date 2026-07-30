import { useCallback, useMemo } from 'react'
import type { DataColumnType, DataRow, QueryDefinition } from '#/types/data'
import {
  useCreateQuery,
  useDeleteQuery,
  useQueries,
  useRunQuery,
  useUpdateQuery,
} from '#/lib/api/queries'
import { useImportTable, useTables, useDeleteTable, useUpdateTableColumnType } from '#/lib/api/tables'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import {
  createDefaultAggregation,
  FILTER_OPERATORS,
  AGGREGATION_OPERATORS,
  useDataStore,
} from '#/stores/dataStore'

export { FILTER_OPERATORS, AGGREGATION_OPERATORS, createDefaultAggregation }

/** Unified data layer: Supabase when signed in, local demo store otherwise. */
export function useWorkspaceData() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const demoTablesList = useDataStore((s) => s.tables)
  const demoQueriesList = useDataStore((s) => s.queries)
  const demoCreateQuery = useDataStore((s) => s.createQuery)
  const demoUpdateQuery = useDataStore((s) => s.updateQuery)
  const demoRemoveQuery = useDataStore((s) => s.removeQuery)
  const demoImportTable = useDataStore((s) => s.importTable)
  const demoRemoveTable = useDataStore((s) => s.removeTable)
  const demoUpdateColumnType = useDataStore((s) => s.updateColumnType)

  const tablesQuery = useTables(workspaceReady ? orgId : null)
  const queriesQuery = useQueries(workspaceReady ? orgId : null)
  const createQueryMutation = useCreateQuery(workspaceReady ? orgId : null)
  const updateQueryMutation = useUpdateQuery(workspaceReady ? orgId : null)
  const deleteQueryMutation = useDeleteQuery(workspaceReady ? orgId : null)
  const importTableMutation = useImportTable(workspaceReady ? orgId : null)
  const deleteTableMutation = useDeleteTable(workspaceReady ? orgId : null)
  const updateColumnTypeMutation = useUpdateTableColumnType(workspaceReady ? orgId : null)

  const tables = workspaceReady ? (tablesQuery.data ?? []) : demoTablesList
  const queries = workspaceReady ? (queriesQuery.data ?? []) : demoQueriesList
  const loading = workspaceReady ? tablesQuery.isLoading || queriesQuery.isLoading : false

  const createQuery = useCallback(
    async (input: Omit<QueryDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (workspaceReady) return createQueryMutation.mutateAsync(input)
      return demoCreateQuery(input)
    },
    [workspaceReady, createQueryMutation, demoCreateQuery],
  )

  const updateQuery = useCallback(
    async (id: string, patch: Partial<Omit<QueryDefinition, 'id' | 'createdAt'>>) => {
      if (workspaceReady) {
        await updateQueryMutation.mutateAsync({ id, patch })
        return
      }
      demoUpdateQuery(id, patch)
    },
    [workspaceReady, updateQueryMutation, demoUpdateQuery],
  )

  const removeQuery = useCallback(
    async (id: string) => {
      if (workspaceReady) {
        await deleteQueryMutation.mutateAsync(id)
        return
      }
      demoRemoveQuery(id)
    },
    [workspaceReady, deleteQueryMutation, demoRemoveQuery],
  )

  const importTable = useCallback(
    async (input: { name: string; rows: DataRow[] }) => {
      if (workspaceReady) return importTableMutation.mutateAsync(input)
      return demoImportTable(input)
    },
    [workspaceReady, importTableMutation, demoImportTable],
  )

  const removeTable = useCallback(
    async (tableId: string) => {
      if (workspaceReady) {
        await deleteTableMutation.mutateAsync(tableId)
        return
      }
      demoRemoveTable(tableId)
    },
    [workspaceReady, deleteTableMutation, demoRemoveTable],
  )

  const updateColumnType = useCallback(
    async (tableId: string, columnName: string, type: DataColumnType) => {
      if (workspaceReady) {
        await updateColumnTypeMutation.mutateAsync({ tableId, columnName, dataType: type })
        return
      }
      demoUpdateColumnType(tableId, columnName, type)
    },
    [workspaceReady, updateColumnTypeMutation, demoUpdateColumnType],
  )

  return {
    workspaceReady,
    orgId,
    tables,
    queries,
    loading,
    createQuery,
    updateQuery,
    removeQuery,
    importTable,
    removeTable,
    updateColumnType,
    isImporting: importTableMutation.isPending,
    isSavingQuery: createQueryMutation.isPending || updateQueryMutation.isPending,
    isDeletingTable: deleteTableMutation.isPending,
  }
}

export function useRunQueryResult(query: QueryDefinition | null) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const demoRunQuery = useDataStore((s) => s.runQuery)
  const serverResult = useRunQuery(workspaceReady ? orgId : null, workspaceReady ? query : null)

  return useMemo(() => {
    if (!query) return { rows: [] as DataRow[], isLoading: false }
    if (!workspaceReady) {
      return { rows: demoRunQuery(query.id), isLoading: false }
    }
    return { rows: serverResult.data ?? [], isLoading: serverResult.isLoading }
  }, [query, workspaceReady, demoRunQuery, serverResult.data, serverResult.isLoading])
}
