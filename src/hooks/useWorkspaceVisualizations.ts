import { useCallback } from 'react'
import {
  useCreateVisualization,
  useDeleteVisualization,
  useUpdateVisualization,
  useVisualizations,
} from '#/lib/api/visualizations'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useDataStore } from '#/stores/dataStore'
import type { VisualizationDefinition } from '#/types/visualization'

/** Unified visualizations layer: Supabase when signed in, local demo store otherwise. */
export function useWorkspaceVisualizations() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const demoVisualizations = useDataStore((s) => s.visualizations)
  const demoListByQuery = useDataStore((s) => s.listByQuery)
  const demoCreate = useDataStore((s) => s.createVisualization)
  const demoUpdate = useDataStore((s) => s.updateVisualization)
  const demoRemove = useDataStore((s) => s.removeVisualization)

  const serverQuery = useVisualizations(workspaceReady ? orgId : null)
  const createMutation = useCreateVisualization(workspaceReady ? orgId : null)
  const updateMutation = useUpdateVisualization(workspaceReady ? orgId : null)
  const deleteMutation = useDeleteVisualization(workspaceReady ? orgId : null)

  const visualizations = workspaceReady ? (serverQuery.data ?? []) : demoVisualizations

  const listByQuery = useCallback(
    (queryId: string) => {
      if (workspaceReady) return visualizations.filter((v) => v.queryId === queryId)
      return demoListByQuery(queryId)
    },
    [workspaceReady, visualizations, demoListByQuery],
  )

  const createVisualization = useCallback(
    async (input: Omit<VisualizationDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (workspaceReady) return createMutation.mutateAsync(input)
      return demoCreate(input)
    },
    [workspaceReady, createMutation, demoCreate],
  )

  const updateVisualization = useCallback(
    async (
      id: string,
      patch: Partial<Pick<VisualizationDefinition, 'name' | 'description' | 'type' | 'options'>>,
    ) => {
      if (workspaceReady) {
        await updateMutation.mutateAsync({ id, patch })
        return
      }
      demoUpdate(id, patch)
    },
    [workspaceReady, updateMutation, demoUpdate],
  )

  const removeVisualization = useCallback(
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
    visualizations,
    listByQuery,
    createVisualization,
    updateVisualization,
    removeVisualization,
  }
}
