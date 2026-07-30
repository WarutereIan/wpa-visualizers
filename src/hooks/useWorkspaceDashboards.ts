import { useDashboards, useUpsertDashboard, useDeleteDashboard } from '#/lib/api/dashboards'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useDashboardStore } from '#/stores/dashboardStore'
import type { DashboardDefinition } from '#/types/dashboard'

export function useWorkspaceDashboards() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const localDashboards = useDashboardStore((s) => s.dashboards)
  const localUpsert = useDashboardStore((s) => s.upsertDashboard)
  const localRemove = useDashboardStore((s) => s.removeDashboard)
  const localAdd = useDashboardStore((s) => s.addDashboard)
  const localUpdate = useDashboardStore((s) => s.updateDashboard)
  const localGetById = useDashboardStore((s) => s.getById)

  const serverQuery = useDashboards(workspaceReady ? orgId : null)
  const upsertMutation = useUpsertDashboard(workspaceReady ? orgId : null)
  const deleteMutation = useDeleteDashboard(workspaceReady ? orgId : null)

  const dashboards = workspaceReady ? (serverQuery.data ?? []) : localDashboards

  const upsertDashboard = async (d: DashboardDefinition) => {
    if (workspaceReady) return upsertMutation.mutateAsync(d)
    localUpsert(d)
    return d
  }

  const removeDashboard = async (id: string) => {
    if (workspaceReady) return deleteMutation.mutateAsync(id)
    localRemove(id)
  }

  const addDashboard = (name: string, description?: string) => {
    if (workspaceReady) {
      const draft = localAdd(name, description)
      void upsertMutation.mutateAsync(draft)
      return draft
    }
    return localAdd(name, description)
  }

  const updateDashboard = async (
    id: string,
    patch: Partial<Pick<DashboardDefinition, 'name' | 'description' | 'layout' | 'widgets' | 'theme'>>,
  ) => {
    if (workspaceReady) {
      const existing = dashboards.find((d) => d.id === id)
      if (!existing) return
      await upsertMutation.mutateAsync({ ...existing, ...patch })
      return
    }
    localUpdate(id, patch)
  }

  const getById = (id: string) => {
    if (workspaceReady) return dashboards.find((d) => d.id === id)
    return localGetById(id)
  }

  return {
    workspaceReady,
    dashboards,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
    upsertDashboard,
    removeDashboard,
    addDashboard,
    updateDashboard,
    getById,
  }
}
