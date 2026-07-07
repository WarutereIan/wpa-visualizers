import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardDefinition } from '#/types/dashboard'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import {
  mapDashboardToDb,
  mapDbDashboard,
  type DbDashboard,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'

async function fetchDashboardsForOrg(orgId: string): Promise<DashboardDefinition[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  throwIfSupabaseError(error, 'api.fetchDashboards', { orgId })
  return ((data ?? []) as DbDashboard[]).map(mapDbDashboard)
}

export function useDashboards(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.dashboards(orgId) : ['workspace', 'dashboards', 'none'],
    queryFn: () => fetchDashboardsForOrg(orgId!),
    enabled: Boolean(orgId),
  })
}

export function useDashboard(orgId: string | null, dashboardId: string | null) {
  return useQuery({
    queryKey:
      orgId && dashboardId
        ? workspaceKeys.dashboard(orgId, dashboardId)
        : ['workspace', 'dashboard', 'none'],
    queryFn: async () => {
      const all = await fetchDashboardsForOrg(orgId!)
      const found = all.find((d) => d.id === dashboardId)
      if (!found) throw new Error('Dashboard not found')
      return found
    },
    enabled: Boolean(orgId && dashboardId),
  })
}

export function useUpsertDashboard(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dashboard: DashboardDefinition) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const payload = {
        ...mapDashboardToDb(dashboard, orgId),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('dashboards')
        .upsert(payload)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.upsertDashboard', { orgId, id: dashboard.id })
      return mapDbDashboard(data as DbDashboard)
    },
    onSuccess: (data) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.dashboards(orgId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.dashboard(orgId, data.id) })
    },
  })
}

export function useDeleteDashboard(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dashboardId: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', dashboardId)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteDashboard', { orgId, dashboardId })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.dashboards(orgId) })
    },
  })
}
