import { useMappings, useUpsertMapping, useDeleteMapping } from '#/lib/api/mappings'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useMappingStore } from '#/stores/mappingStore'
import type { MappingDefinition } from '#/types/mapping'

export function useWorkspaceMappings() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const localMappings = useMappingStore((s) => s.mappings)
  const localUpsert = useMappingStore((s) => s.upsertMapping)
  const localRemove = useMappingStore((s) => s.removeMapping)
  const localUpdate = useMappingStore((s) => s.updateMapping)
  const localGetById = useMappingStore((s) => s.getById)

  const serverQuery = useMappings(workspaceReady ? orgId : null)
  const upsertMutation = useUpsertMapping(workspaceReady ? orgId : null)
  const deleteMutation = useDeleteMapping(workspaceReady ? orgId : null)

  const mappings = workspaceReady ? (serverQuery.data ?? []) : localMappings

  const upsertMapping = async (m: MappingDefinition) => {
    if (workspaceReady) return upsertMutation.mutateAsync(m)
    localUpsert(m)
    return m
  }

  const removeMapping = async (id: string) => {
    if (workspaceReady) return deleteMutation.mutateAsync(id)
    localRemove(id)
  }

  const updateMapping = async (
    id: string,
    patch: Partial<Omit<MappingDefinition, 'id' | 'createdAt'>>,
  ) => {
    if (workspaceReady) {
      const existing = mappings.find((m) => m.id === id)
      if (!existing) return
      await upsertMutation.mutateAsync({ ...existing, ...patch })
      return
    }
    localUpdate(id, patch)
  }

  const getById = (id: string) => {
    if (workspaceReady) return mappings.find((m) => m.id === id)
    return localGetById(id)
  }

  return {
    workspaceReady,
    mappings,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
    upsertMapping,
    removeMapping,
    updateMapping,
    getById,
  }
}
