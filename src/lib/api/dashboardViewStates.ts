import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import { workspaceKeys } from '#/lib/api/workspace'
import type { GlobalDashboardFilters } from '#/stores/dashboardFilterStore'

type DbDashboardViewState = {
  id: string
  user_id: string
  dashboard_id: string
  filters: GlobalDashboardFilters | null
  updated_at: string
}

const EMPTY: GlobalDashboardFilters = { dateFrom: null, dateTo: null }

function normalizeFilters(
  raw: GlobalDashboardFilters | null | undefined,
): GlobalDashboardFilters {
  if (!raw) return { ...EMPTY }
  return {
    dateFrom: raw.dateFrom ?? null,
    dateTo: raw.dateTo ?? null,
  }
}

async function fetchDashboardViewState(
  userId: string,
  dashboardId: string,
): Promise<GlobalDashboardFilters> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('dashboard_view_states')
    .select('filters')
    .eq('user_id', userId)
    .eq('dashboard_id', dashboardId)
    .maybeSingle()

  throwIfSupabaseError(error, 'api.fetchDashboardViewState', { userId, dashboardId })
  return normalizeFilters((data as Pick<DbDashboardViewState, 'filters'> | null)?.filters)
}

export function useDashboardViewState(userId: string | null, dashboardId: string | null) {
  return useQuery({
    queryKey:
      userId && dashboardId
        ? workspaceKeys.dashboardViewState(userId, dashboardId)
        : ['workspace', 'dashboard-view-state', 'none'],
    queryFn: () => fetchDashboardViewState(userId!, dashboardId!),
    enabled: Boolean(userId && dashboardId),
    staleTime: 30_000,
  })
}

export function useUpsertDashboardViewState(userId: string | null, dashboardId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (filters: GlobalDashboardFilters) => {
      if (!userId || !dashboardId) throw new Error('Not signed in')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('dashboard_view_states')
        .upsert(
          {
            user_id: userId,
            dashboard_id: dashboardId,
            filters,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,dashboard_id' },
        )

      throwIfSupabaseError(error, 'api.upsertDashboardViewState', { userId, dashboardId })
    },
    onSuccess: () => {
      if (userId && dashboardId) {
        void queryClient.invalidateQueries({
          queryKey: workspaceKeys.dashboardViewState(userId, dashboardId),
        })
      }
    },
  })
}
