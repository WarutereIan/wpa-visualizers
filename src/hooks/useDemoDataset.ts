import { useQuery } from '@tanstack/react-query'
import { useDataStore } from '#/stores/dataStore'
import type { DataRow } from '#/types/data'

export interface DemoRow {
  name: string
  value: number
}

function deriveChartRows(
  rows: DataRow[],
  bindings?: Record<string, string>,
): DemoRow[] {
  const first = rows[0] ?? {}
  const keys = Object.keys(first)
  const xKey = bindings?.xKey ?? keys.find((k) => typeof first[k] === 'string') ?? keys[0] ?? 'name'
  const yKey =
    bindings?.yKey ?? keys.find((k) => typeof first[k] === 'number') ?? keys[1] ?? 'value'

  return rows.map((r, idx) => ({
    name: String(r[xKey] ?? `Row ${idx + 1}`),
    value: Number(r[yKey] ?? 0),
  }))
}

/** Query-backed data for widgets; falls back to empty result when query is missing. */
export function useDemoDataset(
  dataSourceId: string | undefined,
  bindings?: Record<string, string>,
  enabled = true,
) {
  const version = useDataStore((s) => s.version)
  const runQuery = useDataStore((s) => s.runQuery)
  return useQuery({
    queryKey: ['dataset', 'query', dataSourceId, bindings?.xKey, bindings?.yKey, version],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120))
      if (!dataSourceId) return [] as DemoRow[]
      const rows = runQuery(dataSourceId)
      return deriveChartRows(rows, bindings)
    },
    enabled: enabled && !!dataSourceId,
    placeholderData: (prev) => prev,
  })
}

export function useDatasetRows(dataSourceId: string | undefined, enabled = true) {
  const version = useDataStore((s) => s.version)
  const runQuery = useDataStore((s) => s.runQuery)
  return useQuery({
    queryKey: ['dataset', 'raw', dataSourceId, version],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120))
      if (!dataSourceId) return [] as DataRow[]
      return runQuery(dataSourceId)
    },
    enabled: enabled && !!dataSourceId,
    placeholderData: (prev) => prev,
  })
}
