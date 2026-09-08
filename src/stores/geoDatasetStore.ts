import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured } from '#/lib/env'
import {
  fieldNamesFromKeys,
  MAX_RAW_UPLOAD_BYTES,
  pickDefaultTargetField,
  utf8ByteSize,
  validateFeatureCollection,
  type GeoJsonFeatureCollection,
} from '#/lib/geo/geojsonValidate'
import type { GeoDataset } from '#/types/geo'

const STORAGE_KEY = 'wpa-geo-datasets-v1'
const DEMO_ORG_ID = 'demo'

export type StoredGeoDataset = GeoDataset & {
  /** Inline FeatureCollection so demo blob URLs can be rebuilt after hydrate. */
  geojson?: GeoJsonFeatureCollection
}

function nowIso() {
  return new Date().toISOString()
}

function nameFromFile(file: File): string {
  return file.name.replace(/\.(geojson|json)$/i, '').trim() || 'Custom map'
}

function blobUrlFor(collection: GeoJsonFeatureCollection): { publicUrl: string; byteSize: number } {
  const json = JSON.stringify(collection)
  const blob = new Blob([json], { type: 'application/geo+json' })
  return { publicUrl: URL.createObjectURL(blob), byteSize: utf8ByteSize(json) }
}

function reviveDataset(row: StoredGeoDataset): StoredGeoDataset {
  if (!row.geojson) return row
  try {
    if (row.publicUrl?.startsWith('blob:')) URL.revokeObjectURL(row.publicUrl)
  } catch {
    /* ignore */
  }
  const { publicUrl } = blobUrlFor(row.geojson)
  return { ...row, publicUrl }
}

function toDataset(
  collection: GeoJsonFeatureCollection,
  opts: { name: string; defaultTargetField?: string },
): StoredGeoDataset {
  const result = validateFeatureCollection(collection)
  if (!result.ok) throw new Error(result.error)
  const { publicUrl, byteSize } = blobUrlFor(result.collection)
  const id = crypto.randomUUID()
  const ts = nowIso()
  const fieldNames = fieldNamesFromKeys(result.propertyKeys)
  return {
    id,
    organizationId: DEMO_ORG_ID,
    name: opts.name.trim() || 'Custom map',
    storagePath: `demo/${id}.geojson`,
    publicUrl,
    defaultTargetField: pickDefaultTargetField(result.propertyKeys, opts.defaultTargetField),
    fieldNames,
    featureCount: result.featureCount,
    byteSize,
    createdAt: ts,
    updatedAt: ts,
    geojson: result.collection,
  }
}

interface GeoDatasetState {
  datasets: StoredGeoDataset[]
  list: () => StoredGeoDataset[]
  getById: (id: string) => StoredGeoDataset | undefined
  addFromGeoJson: (
    geojson: unknown,
    opts: { name: string; defaultTargetField?: string },
  ) => StoredGeoDataset
  addFromFile: (
    file: File,
    opts?: { name?: string; defaultTargetField?: string },
  ) => Promise<StoredGeoDataset>
  remove: (id: string) => void
}

export const useGeoDatasetStore = create<GeoDatasetState>()(
  persist(
    (set, get) => ({
      datasets: [],

      list: () => get().datasets,

      getById: (id) => get().datasets.find((d) => d.id === id),

      addFromGeoJson: (geojson, opts) => {
        const row = toDataset(geojson as GeoJsonFeatureCollection, opts)
        if (get().datasets.some((d) => d.name === row.name)) {
          throw new Error(`A map named "${row.name}" already exists`)
        }
        set((s) => ({ datasets: [row, ...s.datasets] }))
        return row
      },

      addFromFile: async (file, opts) => {
        if (file.size > MAX_RAW_UPLOAD_BYTES) {
          throw new Error('GeoJSON exceeds the 15MB upload limit')
        }
        const text = await file.text()
        const result = validateFeatureCollection(text, { byteSize: utf8ByteSize(text) })
        if (!result.ok) throw new Error(result.error)
        return get().addFromGeoJson(result.collection, {
          name: opts?.name?.trim() || nameFromFile(file),
          defaultTargetField: opts?.defaultTargetField,
        })
      },

      remove: (id) => {
        const existing = get().datasets.find((d) => d.id === id)
        if (existing?.publicUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(existing.publicUrl)
        }
        set((s) => ({ datasets: s.datasets.filter((d) => d.id !== id) }))
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: isSupabaseConfigured(),
      partialize: (state) => ({ datasets: state.datasets }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { datasets?: StoredGeoDataset[] } | undefined
        const datasets = (persisted?.datasets ?? []).map(reviveDataset)
        return { ...currentState, datasets }
      },
    },
  ),
)
