import { useDashboards, useUpsertDashboard, useDeleteDashboard } from '#/lib/api/dashboards'
import { useCreateWidget, fetchWidgetsForDashboard } from '#/lib/api/widgets'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useDashboardStore } from '#/stores/dashboardStore'
import type { DashboardDefinition } from '#/types/dashboard'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { matchesProjectScope } from '#/lib/projectScope'

type DashboardUpdatePatch = Partial<
  Pick<
    DashboardDefinition,
    'name' | 'description' | 'layout' | 'widgets' | 'theme' | 'status' | 'tags' | 'projectId'
  >
>

export function useWorkspaceDashboards() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const localDashboards = useDashboardStore((s) => s.dashboards)
  const localUpsert = useDashboardStore((s) => s.upsertDashboard)
  const localRemove = useDashboardStore((s) => s.removeDashboard)
  const localAdd = useDashboardStore((s) => s.addDashboard)
  const localUpdate = useDashboardStore((s) => s.updateDashboard)
  const localDuplicate = useDashboardStore((s) => s.duplicateDashboard)
  const localGetById = useDashboardStore((s) => s.getById)

  const serverQuery = useDashboards(workspaceReady ? orgId : null)
  const upsertMutation = useUpsertDashboard(workspaceReady ? orgId : null)
  const deleteMutation = useDeleteDashboard(workspaceReady ? orgId : null)
  const createWidgetMutation = useCreateWidget(workspaceReady ? orgId : null)

  const allDashboards = workspaceReady ? (serverQuery.data ?? []) : localDashboards
  const { selectedProjectId } = useSelectedProject()
  const dashboards = allDashboards.filter(
    (d) => d.status !== 'archived' && matchesProjectScope(d.projectId, selectedProjectId),
  )

  const upsertDashboard = async (d: DashboardDefinition) => {
    if (workspaceReady) return upsertMutation.mutateAsync(d)
    localUpsert(d)
    return d
  }

  const removeDashboard = async (id: string) => {
    if (workspaceReady) return deleteMutation.mutateAsync(id)
    localRemove(id)
  }

  const addDashboard = (name: string, description?: string, projectId?: string | null) => {
    if (workspaceReady) {
      const draft = localAdd(name, description, projectId)
      void upsertMutation.mutateAsync(draft)
      return draft
    }
    return localAdd(name, description, projectId)
  }

  const updateDashboard = async (id: string, patch: DashboardUpdatePatch) => {
    if (workspaceReady) {
      const existing = allDashboards.find((d) => d.id === id)
      if (!existing) return
      await upsertMutation.mutateAsync({ ...existing, ...patch })
      return
    }
    localUpdate(id, patch)
  }

  const duplicateDashboard = async (id: string): Promise<DashboardDefinition | undefined> => {
    if (!workspaceReady) return localDuplicate(id)
    const existing = allDashboards.find((d) => d.id === id)
    if (!existing || !orgId) return undefined
    const now = new Date().toISOString()
    const copy: DashboardDefinition = {
      ...existing,
      id: crypto.randomUUID(),
      name: `Copy of: ${existing.name}`,
      status: 'draft',
      tags: existing.tags ? [...existing.tags] : undefined,
      theme: existing.theme ? { ...existing.theme } : undefined,
      createdAt: now,
      updatedAt: now,
    }
    await upsertMutation.mutateAsync(copy)
    try {
      const widgets = await fetchWidgetsForDashboard(orgId, id)
      for (const widget of widgets) {
        await createWidgetMutation.mutateAsync({
          dashboardId: copy.id,
          visualizationId: widget.visualizationId,
          text: widget.text,
          options: {
            ...widget.options,
            position: { ...widget.options.position },
            parameterMappings: widget.options.parameterMappings
              ? { ...widget.options.parameterMappings }
              : undefined,
          },
        })
      }
    } catch (err) {
      await deleteMutation.mutateAsync(copy.id).catch(() => undefined)
      throw err
    }
    return copy
  }

  const getById = (id: string) => {
    if (workspaceReady) return allDashboards.find((d) => d.id === id)
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
    duplicateDashboard,
    getById,
  }
}
