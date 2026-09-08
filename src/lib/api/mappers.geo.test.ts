import { describe, expect, it } from 'vitest'
import { mapDbGeoDataset, mapGeoDatasetToDb, type DbGeoDataset } from '#/lib/api/mappers'
import type { GeoDataset } from '#/types/geo'

const ORG = '11111111-1111-1111-1111-111111111111'

function dataset(): GeoDataset {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    organizationId: ORG,
    name: 'Custom counties',
    storagePath: `${ORG}/custom.geojson`,
    publicUrl: 'https://example.com/custom.geojson',
    defaultTargetField: 'code',
    fieldNames: { code: 'Code', name: 'Name' },
    featureCount: 47,
    byteSize: 2048,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  }
}

describe('geo_datasets mappers', () => {
  it('round-trips a geo dataset through the db row shape', () => {
    const src = dataset()
    const payload = mapGeoDatasetToDb(src, ORG)

    expect(payload).toEqual({
      id: src.id,
      organization_id: ORG,
      name: src.name,
      storage_path: src.storagePath,
      public_url: src.publicUrl,
      default_target_field: src.defaultTargetField,
      field_names: src.fieldNames,
      feature_count: src.featureCount,
      byte_size: src.byteSize,
    })

    const row: DbGeoDataset = {
      ...payload,
      field_names: payload.field_names,
      created_at: src.createdAt,
      updated_at: src.updatedAt,
    }

    expect(mapDbGeoDataset(row)).toEqual(src)
  })

  it('uses the supplied organization id, not the dataset field', () => {
    const otherOrg = '22222222-2222-2222-2222-222222222222'
    expect(mapGeoDatasetToDb(dataset(), otherOrg).organization_id).toBe(otherOrg)
  })

  it('keeps only string field_names and coerces numeric counts', () => {
    const mapped = mapDbGeoDataset({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      organization_id: ORG,
      name: 'Odd',
      storage_path: 'odd.geojson',
      public_url: 'https://example.com/odd.geojson',
      default_target_field: 'name',
      field_names: { name: 'Name', n: 12, nested: { a: 1 } },
      feature_count: '3' as unknown as number,
      byte_size: null as unknown as number,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    })

    expect(mapped.fieldNames).toEqual({ name: 'Name' })
    expect(mapped.featureCount).toBe(3)
    expect(mapped.byteSize).toBe(0)
  })
})
