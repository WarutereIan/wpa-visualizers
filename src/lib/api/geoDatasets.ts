import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GeoDataset } from '#/types/geo'
import { invokeEdgeFunction } from '#/lib/api/invoke'
import {
  mapDbGeoDataset,
  mapGeoDatasetToDb,
  type DbGeoDataset,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'
import {
  fieldNamesFromKeys,
  MAX_RAW_UPLOAD_BYTES,
  pickDefaultTargetField,
  utf8ByteSize,
  validateFeatureCollection,
  type GeoJsonFeatureCollection,
} from '#/lib/geo/geojsonValidate'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export type UploadGeoDatasetInput = {
  name?: string
  defaultTargetField?: string
  file?: File
  geojson?: unknown
}

function nameFromFile(file: File): string {
  return file.name.replace(/\.(geojson|json)$/i, '').trim() || 'Custom map'
}

async function readUploadPayload(input: UploadGeoDatasetInput): Promise<{
  name: string
  defaultTargetField: string
  collection: GeoJsonFeatureCollection
  fieldNames: Record<string, string>
}> {
  let raw: unknown = input.geojson
  let byteSize: number | undefined
  if (input.file) {
    if (input.file.size > MAX_RAW_UPLOAD_BYTES) {
      throw new Error('GeoJSON exceeds the 15MB upload limit')
    }
    const text = await input.file.text()
    byteSize = utf8ByteSize(text)
    raw = text
  }
  const result = validateFeatureCollection(raw, byteSize != null ? { byteSize } : undefined)
  if (!result.ok) throw new Error(result.error)
  const name = (input.name?.trim() || (input.file ? nameFromFile(input.file) : '') || 'Custom map')
  return {
    name,
    defaultTargetField: pickDefaultTargetField(result.propertyKeys, input.defaultTargetField),
    collection: result.collection,
    fieldNames: fieldNamesFromKeys(result.propertyKeys),
  }
}

export async function fetchGeoDatasets(orgId: string): Promise<GeoDataset[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('geo_datasets')
    .select('*')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  throwIfSupabaseError(error, 'api.fetchGeoDatasets', { orgId })
  return ((data ?? []) as DbGeoDataset[]).map(mapDbGeoDataset)
}

export function useGeoDatasetsQuery(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.geoDatasets(orgId) : ['workspace', 'geo-datasets', 'none'],
    queryFn: () => fetchGeoDatasets(orgId!),
    enabled: Boolean(orgId),
  })
}

function asUploadedDataset(data: unknown): GeoDataset {
  if (data && typeof data === 'object' && 'organization_id' in data) {
    return mapDbGeoDataset(data as DbGeoDataset)
  }
  return data as GeoDataset
}

export function useUploadGeoDatasetMutation(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UploadGeoDatasetInput) => {
      if (!orgId) throw new Error('No organization')
      const payload = await readUploadPayload(input)
      const data = await invokeEdgeFunction<unknown>('upload-geo', {
        organizationId: orgId,
        name: payload.name,
        defaultTargetField: payload.defaultTargetField,
        geojson: payload.collection,
        fieldNames: payload.fieldNames,
      })
      return asUploadedDataset(data)
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.geoDatasets(orgId) })
    },
  })
}

export function useDeleteGeoDatasetMutation(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (datasetId: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { data: row, error: fetchError } = await supabase
        .from('geo_datasets')
        .select('storage_path')
        .eq('id', datasetId)
        .eq('organization_id', orgId)
        .maybeSingle()

      throwIfSupabaseError(fetchError, 'api.deleteGeoDataset.lookup', { orgId, datasetId })

      const storagePath = (row as { storage_path?: string } | null)?.storage_path
      if (storagePath) {
        await supabase.storage.from('dimes-geo').remove([storagePath])
      }

      const { error } = await supabase
        .from('geo_datasets')
        .delete()
        .eq('id', datasetId)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteGeoDataset', { orgId, datasetId })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.geoDatasets(orgId) })
    },
  })
}

/** Available for direct client inserts when the edge function is not used. */
export { mapGeoDatasetToDb }
