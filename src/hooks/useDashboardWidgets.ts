import { useCallback } from 'react'
import {
  useCreateWidget,
  useDeleteWidget,
  useUpdateWidget,
  useWidgets,
} from '#/lib/api/widgets'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useDashboardStore } from '#/stores/dashboardStore'
import type { DashboardWidget } from '#/types/visualization'

/** Unified dashboard widgets layer: Supabase when signed in, local demo store otherwise. */
export function useDashboardWidgets(dashboardId: string | null) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const demoWidgets = useDashboardStore((s) => s.widgets)
  const demoCreate = useDashboardStore((s) => s.createWidget)
  const demoUpdate = useDashboardStore((s) => s.updateWidget)
  const demoRemove = useDashboardStore((s) => s.removeWidget)

  const serverQuery = useWidgets(workspaceReady ? orgId : null, workspaceReady ? dashboardId : null)
  const createMutation = useCreateWidget(workspaceReady ? orgId : null)
  const updateMutation = useUpdateWidget(workspaceReady ? orgId : null)
  const deleteMutation = useDeleteWidget(workspaceReady ? orgId : null, dashboardId)

  const widgets = workspaceReady
    ? (serverQuery.data ?? [])
    : dashboardId
      ? demoWidgets.filter((w) => w.dashboardId === dashboardId)
      : []

  const createWidget = useCallback(
    async (input: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (workspaceReady) return createMutation.mutateAsync(input)
      return demoCreate(input)
    },
    [workspaceReady, createMutation, demoCreate],
  )

  const updateWidget = useCallback(
    async (
      id: string,
      patch: Partial<Pick<DashboardWidget, 'text' | 'options' | 'visualizationId'>>,
    ) => {
      if (workspaceReady) {
        await updateMutation.mutateAsync({ id, patch })
        return
      }
      demoUpdate(id, patch)
    },
    [workspaceReady, updateMutation, demoUpdate],
  )

  const removeWidget = useCallback(
    async (id: string) => {
      if (workspaceReady) {
        await deleteMutation.mutateAsync(id)
        return
      }
      demoRemove(id)
    },
    [workspaceReady, deleteMutation, demoRemove],
  )

  return {
    widgets,
    createWidget,
    updateWidget,
    removeWidget,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
  }
}
