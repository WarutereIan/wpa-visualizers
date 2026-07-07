import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction } from '#/lib/api/invoke'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export interface DashboardSnapshot {
  id: string
  organizationId: string
  dashboardId: string | null
  period: string | null
  layout: unknown
  data: unknown
  createdAt: string
}

async function fetchSnapshots(orgId: string, dashboardId?: string): Promise<DashboardSnapshot[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  let q = supabase
    .from('dashboard_snapshots')
    .select('id, organization_id, dashboard_id, period, layout, data, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (dashboardId) q = q.eq('dashboard_id', dashboardId)

  const { data, error } = await q
  throwIfSupabaseError(error, 'api.fetchSnapshots', { orgId })
  return (data ?? []).map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    dashboardId: r.dashboard_id,
    period: r.period,
    layout: r.layout,
    data: r.data,
    createdAt: r.created_at,
  }))
}

export function useSnapshots(orgId: string | null, dashboardId?: string) {
  return useQuery({
    queryKey: orgId
      ? [...workspaceKeys.snapshots(orgId), dashboardId ?? 'all']
      : ['snapshots', 'none'],
    queryFn: () => fetchSnapshots(orgId!, dashboardId),
    enabled: Boolean(orgId),
  })
}

export function useCreateSnapshot(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { dashboardId: string; period?: string }) => {
      if (!orgId) throw new Error('No organization')
      return invokeEdgeFunction<{ snapshotId: string; createdAt: string }>('create-snapshot', {
        organizationId: orgId,
        ...input,
      })
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.snapshots(orgId) })
      }
    },
  })
}
