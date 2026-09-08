import { useEffect, useMemo, useState } from 'react'
import { useRunQueryResult, useWorkspaceData } from '#/hooks/useWorkspaceData'
import { applyParameters, type ParameterValues } from '#/lib/queryParameters'
import { toRedashResult } from '#/lib/redashResult'
import type { QueryDefinition } from '#/types/data'
import type { RedashQueryResult } from '#/types/visualization'

export function useVisualizationResult(
  queryId: string | null,
  paramValues: ParameterValues,
  refreshNonce: number,
): {
  result: RedashQueryResult | null
  query: QueryDefinition | null
  isLoading: boolean
  error: string | null
  lastRefreshedAt: Date | null
} {
  const { tables, queries, loading: workspaceLoading } = useWorkspaceData()

  const query = useMemo(
    () => (queryId ? (queries.find((q) => q.id === queryId) ?? null) : null),
    [queries, queryId],
  )

  const appliedQuery = useMemo(
    () => (query ? applyParameters(query, paramValues) : null),
    [query, paramValues, refreshNonce],
  )

  const { rows, isLoading: runLoading, error: runError } = useRunQueryResult(
    appliedQuery,
    refreshNonce,
  )

  const sourceColumns = useMemo(() => {
    if (!appliedQuery) return []
    return tables.find((t) => t.id === appliedQuery.tableId)?.columns ?? []
  }, [tables, appliedQuery])

  const result = useMemo(() => {
    if (!appliedQuery) return null
    return toRedashResult(rows, appliedQuery, sourceColumns)
  }, [appliedQuery, rows, sourceColumns])

  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!queryId || !query) {
      setLastRefreshedAt(null)
      return
    }
    if (runLoading) return
    setLastRefreshedAt(new Date())
  }, [queryId, query, rows, runLoading, refreshNonce])

  const missingQuery = Boolean(queryId) && !query && !workspaceLoading

  return {
    result,
    query,
    isLoading: Boolean(queryId) && (workspaceLoading || runLoading),
    error: missingQuery ? 'Query not found' : runError,
    lastRefreshedAt,
  }
}
