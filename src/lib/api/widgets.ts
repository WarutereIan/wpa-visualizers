import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardWidget } from '#/types/visualization'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import {
  mapDbDashboardWidget,
  mapWidgetToDb,
  type DbDashboardWidget,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'

export async function fetchAllWidgets(orgId: string): Promise<DashboardWidget[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  throwIfSupabaseError(error, 'api.fetchAllWidgets', { orgId })
  return ((data ?? []) as DbDashboardWidget[]).map(mapDbDashboardWidget)
}

export function useAllWidgets(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.widgetsAll(orgId) : ['workspace', 'widgets', 'none'],
    queryFn: () => fetchAllWidgets(orgId!),
    enabled: Boolean(orgId),
  })
}

export async function fetchWidgetsForDashboard(
  orgId: string,
  dashboardId: string,
): Promise<DashboardWidget[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('organization_id', orgId)
    .eq('dashboard_id', dashboardId)
    .order('created_at', { ascending: true })

  throwIfSupabaseError(error, 'api.fetchWidgets', { orgId, dashboardId })
  return ((data ?? []) as DbDashboardWidget[]).map(mapDbDashboardWidget)
}

export async function fetchWidgetsByVisualizationId(
  orgId: string,
  visualizationId: string,
): Promise<DashboardWidget[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('organization_id', orgId)
    .eq('visualization_id', visualizationId)
    .order('created_at', { ascending: true })

  throwIfSupabaseError(error, 'api.fetchWidgetsByVisualization', { orgId, visualizationId })
  return ((data ?? []) as DbDashboardWidget[]).map(mapDbDashboardWidget)
}

export function useWidgetsByVisualization(orgId: string | null, visualizationId: string | null) {
  return useQuery({
    queryKey:
      orgId && visualizationId
        ? workspaceKeys.widgetsByVisualization(orgId, visualizationId)
        : ['workspace', 'widgets-by-viz', 'none'],
    queryFn: () => fetchWidgetsByVisualizationId(orgId!, visualizationId!),
    enabled: Boolean(orgId && visualizationId),
  })
}

export function useWidgets(orgId: string | null, dashboardId: string | null) {
  return useQuery({
    queryKey:
      orgId && dashboardId
        ? workspaceKeys.widgets(orgId, dashboardId)
        : ['workspace', 'widgets', 'none'],
    queryFn: () => fetchWidgetsForDashboard(orgId!, dashboardId!),
    enabled: Boolean(orgId && dashboardId),
  })
}

export function useCreateWidget(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const id = crypto.randomUUID()
      const payload = mapWidgetToDb({ ...input, id }, orgId)
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert(payload)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.createWidget', { orgId })
      return mapDbDashboardWidget(data as DbDashboardWidget)
    },
    onSuccess: (data) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.widgets(orgId, data.dashboardId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.widgetsAll(orgId) })
    },
  })
}

export function useUpdateWidget(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Pick<DashboardWidget, 'text' | 'options' | 'visualizationId'>>
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.text !== undefined) update.text = patch.text
      if (patch.options !== undefined) update.options = patch.options
      if (patch.visualizationId !== undefined) update.visualization_id = patch.visualizationId

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .update(update)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateWidget', { orgId, id })
      return mapDbDashboardWidget(data as DbDashboardWidget)
    },
    onSuccess: (data) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.widgets(orgId, data.dashboardId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.widgetsAll(orgId) })
    },
  })
}

export function useDeleteWidget(orgId: string | null, dashboardId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteWidget', { orgId, id })
    },
    onSuccess: () => {
      if (orgId && dashboardId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.widgets(orgId, dashboardId) })
      } else if (orgId) {
        void queryClient.invalidateQueries({ queryKey: [...workspaceKeys.all, 'widgets', orgId] })
      }
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.widgetsAll(orgId) })
      }
    },
  })
}
