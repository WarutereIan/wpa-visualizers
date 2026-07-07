import { useQuery } from '@tanstack/react-query'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useDataStore } from '#/stores/dataStore'
import { runQueryOnServer, useQueries } from '#/lib/api/queries'
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

/** Query-backed data for widgets; uses Supabase when signed in. */
export function useDemoDataset(
  dataSourceId: string | undefined,
  bindings?: Record<string, string>,
  enabled = true,
) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const demoVersion = useDataStore((s) => s.version)
  const demoRunQuery = useDataStore((s) => s.runQuery)
  const { data: serverQueries } = useQueries(workspaceReady ? orgId : null)

  return useQuery({
    queryKey: [
      'dataset',
      'query',
      dataSourceId,
      bindings?.xKey,
      bindings?.yKey,
      workspaceReady ? orgId : demoVersion,
    ],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120))
      if (!dataSourceId) return [] as DemoRow[]
      let rows: DataRow[]
      if (workspaceReady && orgId) {
        const query = serverQueries?.find((q) => q.id === dataSourceId)
        if (!query) return []
        rows = await runQueryOnServer(orgId, query)
      } else {
        rows = demoRunQuery(dataSourceId)
      }
      return deriveChartRows(rows, bindings)
    },
    enabled: enabled && !!dataSourceId && (!workspaceReady || Boolean(serverQueries)),
    placeholderData: (prev) => prev,
  })
}

export function useDatasetRows(dataSourceId: string | undefined, enabled = true) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const demoVersion = useDataStore((s) => s.version)
  const demoRunQuery = useDataStore((s) => s.runQuery)
  const { data: serverQueries } = useQueries(workspaceReady ? orgId : null)

  return useQuery({
    queryKey: ['dataset', 'raw', dataSourceId, workspaceReady ? orgId : demoVersion],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 120))
      if (!dataSourceId) return [] as DataRow[]
      if (workspaceReady && orgId) {
        const query = serverQueries?.find((q) => q.id === dataSourceId)
        if (!query) return []
        return runQueryOnServer(orgId, query)
      }
      return demoRunQuery(dataSourceId)
    },
    enabled: enabled && !!dataSourceId && (!workspaceReady || Boolean(serverQueries)),
    placeholderData: (prev) => prev,
  })
}
