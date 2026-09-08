import { describe, expect, it } from 'vitest'
import { mapDbMapping, mapMappingToDb, type DbMapping } from '#/lib/api/mappers'
import type { MappingDefinition } from '#/types/mapping'

const ORG = '11111111-1111-1111-1111-111111111111'

function choroplethMapping(): MappingDefinition {
  return {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'County totals',
    description: 'Choropleth from query',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    source: 'choropleth',
    dataTableId: null,
    latitudeColumn: null,
    longitudeColumn: null,
    labelColumn: null,
    externalMapUrl: null,
    queryId: '33333333-3333-3333-3333-333333333333',
    visualizationId: null,
    mapType: 'kenya-counties',
    keyColumn: 'county_code',
    valueColumn: 'total',
    targetField: 'code',
  }
}

describe('mapping mappers', () => {
  it('round-trips choropleth fields through jsonb options', () => {
    const mapping = choroplethMapping()
    const payload = mapMappingToDb(mapping, ORG)

    expect(payload.source).toBe('choropleth')
    expect(payload.options).toEqual({
      queryId: mapping.queryId,
      visualizationId: null,
      mapType: 'kenya-counties',
      keyColumn: 'county_code',
      valueColumn: 'total',
      targetField: 'code',
    })

    const row: DbMapping = {
      id: payload.id,
      organization_id: payload.organization_id,
      name: payload.name,
      description: payload.description,
      source: payload.source,
      data_table_id: payload.data_table_id,
      latitude_column: payload.latitude_column,
      longitude_column: payload.longitude_column,
      label_column: payload.label_column,
      external_map_url: payload.external_map_url,
      options: payload.options,
      created_at: mapping.createdAt,
      updated_at: mapping.updatedAt,
    }

    expect(mapDbMapping(row)).toMatchObject({
      source: 'choropleth',
      queryId: mapping.queryId,
      visualizationId: null,
      mapType: 'kenya-counties',
      keyColumn: 'county_code',
      valueColumn: 'total',
      targetField: 'code',
    })
  })

  it('still maps dataset_table rows when options is missing', () => {
    const row: DbMapping = {
      id: '44444444-4444-4444-4444-444444444444',
      organization_id: ORG,
      name: 'Sites',
      description: '',
      source: 'dataset_table',
      data_table_id: '55555555-5555-5555-5555-555555555555',
      latitude_column: 'lat',
      longitude_column: 'lng',
      label_column: 'name',
      external_map_url: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }

    expect(mapDbMapping(row)).toMatchObject({
      source: 'dataset_table',
      dataTableId: row.data_table_id,
      latitudeColumn: 'lat',
      longitudeColumn: 'lng',
      queryId: null,
      mapType: null,
    })
  })
})
