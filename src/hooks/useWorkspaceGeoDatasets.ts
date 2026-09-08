import { useCallback } from 'react'
import {
  useDeleteGeoDatasetMutation,
  useGeoDatasetsQuery,
  useUploadGeoDatasetMutation,
  type UploadGeoDatasetInput,
} from '#/lib/api/geoDatasets'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useGeoDatasetStore } from '#/stores/geoDatasetStore'
import type { GeoDataset } from '#/types/geo'

/** Unified geo datasets: Supabase when signed in, local demo store otherwise. */
export function useWorkspaceGeoDatasets() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()

  const localDatasets = useGeoDatasetStore((s) => s.datasets)
  const localAddFromFile = useGeoDatasetStore((s) => s.addFromFile)
  const localAddFromGeoJson = useGeoDatasetStore((s) => s.addFromGeoJson)
  const localRemove = useGeoDatasetStore((s) => s.remove)
  const localGetById = useGeoDatasetStore((s) => s.getById)

  const serverQuery = useGeoDatasetsQuery(workspaceReady ? orgId : null)
  const uploadMutation = useUploadGeoDatasetMutation(workspaceReady ? orgId : null)
  const deleteMutation = useDeleteGeoDatasetMutation(workspaceReady ? orgId : null)

  const datasets: GeoDataset[] = workspaceReady ? (serverQuery.data ?? []) : localDatasets

  const addGeoDataset = useCallback(
    async (input: UploadGeoDatasetInput) => {
      if (workspaceReady) return uploadMutation.mutateAsync(input)
      if (input.file) {
        return localAddFromFile(input.file, {
          name: input.name,
          defaultTargetField: input.defaultTargetField,
        })
      }
      if (input.geojson) {
        return localAddFromGeoJson(input.geojson, {
          name: input.name ?? 'Custom map',
          defaultTargetField: input.defaultTargetField,
        })
      }
      throw new Error('Provide a GeoJSON file or object')
    },
    [workspaceReady, uploadMutation, localAddFromFile, localAddFromGeoJson],
  )

  const removeGeoDataset = useCallback(
    async (id: string) => {
      if (workspaceReady) {
        await deleteMutation.mutateAsync(id)
        return
      }
      localRemove(id)
    },
    [workspaceReady, deleteMutation, localRemove],
  )

  const getById = useCallback(
    (id: string) => {
      if (workspaceReady) return datasets.find((d) => d.id === id)
      return localGetById(id)
    },
    [workspaceReady, datasets, localGetById],
  )

  return {
    workspaceReady,
    datasets,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
    addGeoDataset,
    removeGeoDataset,
    getById,
  }
}
