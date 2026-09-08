import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_RAW_UPLOAD_BYTES } from '#/lib/geo/geojsonValidate'
import { useGeoDatasetStore } from '#/stores/geoDatasetStore'

vi.hoisted(() => {
  const mem = new Map<string, string>()
  const storage = {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, String(value))
    },
    removeItem: (key: string) => {
      mem.delete(key)
    },
    clear: () => mem.clear(),
    key: (index: number) => [...mem.keys()][index] ?? null,
    get length() {
      return mem.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  })
})

const collection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { code: '047', name: 'Nairobi' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [36.7, -1.3],
            [36.9, -1.3],
            [36.9, -1.2],
            [36.7, -1.2],
            [36.7, -1.3],
          ],
        ],
      },
    },
  ],
}

function resetStore() {
  const { datasets, remove } = useGeoDatasetStore.getState()
  for (const row of datasets) remove(row.id)
  useGeoDatasetStore.setState({ datasets: [] })
}

beforeAll(() => {
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = () => 'blob:geo-test'
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = () => {}
  }
})

beforeEach(() => {
  resetStore()
})

afterEach(() => {
  resetStore()
})

describe('geoDatasetStore demo add/remove', () => {
  it('adds a FeatureCollection and lists it with blob url + metadata', () => {
    const row = useGeoDatasetStore.getState().addFromGeoJson(collection, { name: 'Nairobi' })

    expect(row.organizationId).toBe('demo')
    expect(row.name).toBe('Nairobi')
    expect(row.featureCount).toBe(1)
    expect(row.defaultTargetField).toBe('code')
    expect(row.fieldNames).toEqual({ code: 'code', name: 'name' })
    expect(row.publicUrl).toMatch(/^blob:/)
    expect(row.storagePath).toBe(`demo/${row.id}.geojson`)
    expect(row.geojson?.type).toBe('FeatureCollection')
    expect(useGeoDatasetStore.getState().list()).toHaveLength(1)
    expect(useGeoDatasetStore.getState().getById(row.id)).toMatchObject({ name: 'Nairobi' })
  })

  it('honors an explicit defaultTargetField when the key exists', () => {
    const row = useGeoDatasetStore.getState().addFromGeoJson(collection, {
      name: 'Named join',
      defaultTargetField: 'name',
    })
    expect(row.defaultTargetField).toBe('name')
  })

  it('rejects a duplicate map name', () => {
    const store = useGeoDatasetStore.getState()
    store.addFromGeoJson(collection, { name: 'Counties' })
    expect(() => store.addFromGeoJson(collection, { name: 'Counties' })).toThrow(
      /already exists/i,
    )
    expect(useGeoDatasetStore.getState().list()).toHaveLength(1)
  })

  it('rejects invalid GeoJSON', () => {
    expect(() =>
      useGeoDatasetStore.getState().addFromGeoJson({ type: 'FeatureCollection', features: [] }, {
        name: 'Empty',
      }),
    ).toThrow(/no features/i)
  })

  it('adds from a File and names it from the filename when omitted', async () => {
    const file = new File([JSON.stringify(collection)], 'nairobi-county.geojson', {
      type: 'application/geo+json',
    })
    const row = await useGeoDatasetStore.getState().addFromFile(file)
    expect(row.name).toBe('nairobi-county')
    expect(useGeoDatasetStore.getState().list()).toHaveLength(1)
  })

  it('rejects an oversized File before parse', async () => {
    const file = new File(['{}'], 'huge.geojson', { type: 'application/geo+json' })
    Object.defineProperty(file, 'size', { value: MAX_RAW_UPLOAD_BYTES + 1 })
    await expect(useGeoDatasetStore.getState().addFromFile(file)).rejects.toThrow(/15MB/i)
    expect(useGeoDatasetStore.getState().list()).toHaveLength(0)
  })

  it('removes a dataset and forgets its id', () => {
    const store = useGeoDatasetStore.getState()
    const row = store.addFromGeoJson(collection, { name: 'To delete' })
    store.remove(row.id)
    expect(store.list()).toHaveLength(0)
    expect(store.getById(row.id)).toBeUndefined()
  })
})
