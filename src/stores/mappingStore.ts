import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured } from '#/lib/env'
import type { MappingDefinition } from '#/types/mapping'

const STORAGE_KEY = 'wpa-mappings-v2'

function nowIso() {
  return new Date().toISOString()
}

export function createNewMappingDraft(): MappingDefinition {
  return {
    id: crypto.randomUUID(),
    name: 'New mapping',
    description: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    source: 'dataset_table',
    dataTableId: null,
    latitudeColumn: null,
    longitudeColumn: null,
    labelColumn: null,
    externalMapUrl: null,
    queryId: null,
    visualizationId: null,
    mapType: null,
    keyColumn: null,
    valueColumn: null,
    targetField: null,
  }
}

interface MappingState {
  mappings: MappingDefinition[]
  upsertMapping: (m: MappingDefinition) => void
  updateMapping: (id: string, patch: Partial<Omit<MappingDefinition, 'id' | 'createdAt'>>) => void
  removeMapping: (id: string) => void
  getById: (id: string) => MappingDefinition | undefined
}

export const useMappingStore = create<MappingState>()(
  persist(
    (set, get) => ({
      mappings: [],

      upsertMapping: (m) => {
        set((s) => {
          const i = s.mappings.findIndex((x) => x.id === m.id)
          if (i >= 0) {
            const next = [...s.mappings]
            next[i] = { ...m, updatedAt: nowIso() }
            return { mappings: next }
          }
          return {
            mappings: [...s.mappings, { ...m, updatedAt: nowIso() }],
          }
        })
      },

      updateMapping: (id, patch) => {
        set((s) => ({
          mappings: s.mappings.map((m) =>
            m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m,
          ),
        }))
      },

      removeMapping: (id) => {
        set((s) => ({ mappings: s.mappings.filter((m) => m.id !== id) }))
      },

      getById: (id) => get().mappings.find((m) => m.id === id),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: isSupabaseConfigured(),
    },
  ),
)
