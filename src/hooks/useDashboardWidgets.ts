import { useCallback } from 'react'
import {
  useAllWidgets,
  useCreateWidget,
  useDeleteWidget,
  useUpdateWidget,
  useWidgets,
  useWidgetsByVisualization,
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

/** All dashboard_widgets in the workspace (for query usage scans). */
export function useAllDashboardWidgets() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const demoWidgets = useDashboardStore((s) => s.widgets)
  const serverQuery = useAllWidgets(workspaceReady ? orgId : null)

  return {
    widgets: workspaceReady ? (serverQuery.data ?? []) : demoWidgets,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
  }
}

/** Widgets that reference a visualization — used to block viz delete (Redash behavior). */
export function useVisualizationWidgetRefs(visualizationId: string | null) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const demoWidgets = useDashboardStore((s) => s.widgets)
  const serverQuery = useWidgetsByVisualization(
    workspaceReady ? orgId : null,
    workspaceReady ? visualizationId : null,
  )

  const widgets = workspaceReady
    ? (serverQuery.data ?? [])
    : visualizationId
      ? demoWidgets.filter((w) => w.visualizationId === visualizationId)
      : []

  return {
    widgets,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
  }
}
