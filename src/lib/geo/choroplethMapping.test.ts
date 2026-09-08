import { describe, expect, it } from 'vitest'
import type { MappingDefinition } from '#/types/mapping'
import type { VisualizationDefinition } from '#/types/visualization'
import {
  buildChoroplethRendererOptions,
  isChoroplethMappingConfigured,
  mappingFieldsFromOptions,
  mappingOptionsFromDefinition,
} from '#/lib/geo/choroplethMapping'

function mapping(patch: Partial<MappingDefinition> = {}): MappingDefinition {
  return {
    id: 'm1',
    name: 'Counties',
    description: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    source: 'choropleth',
    queryId: 'q1',
    visualizationId: null,
    mapType: 'kenya-counties',
    keyColumn: 'county_code',
    valueColumn: 'total',
    targetField: 'code',
    ...patch,
  }
}

describe('isChoroplethMappingConfigured', () => {
  it('requires query, map, key, value, and target field', () => {
    expect(isChoroplethMappingConfigured(mapping())).toBe(true)
    expect(isChoroplethMappingConfigured(mapping({ queryId: null }))).toBe(false)
    expect(isChoroplethMappingConfigured(mapping({ mapType: '' }))).toBe(false)
    expect(isChoroplethMappingConfigured(mapping({ keyColumn: null }))).toBe(false)
    expect(isChoroplethMappingConfigured(mapping({ valueColumn: '  ' }))).toBe(false)
    expect(isChoroplethMappingConfigured(mapping({ targetField: null }))).toBe(false)
  })

  it('does not require visualizationId', () => {
    expect(isChoroplethMappingConfigured(mapping({ visualizationId: null }))).toBe(true)
    expect(isChoroplethMappingConfigured(mapping({ visualizationId: 'viz-1' }))).toBe(true)
  })
})

describe('buildChoroplethRendererOptions', () => {
  it('builds ephemeral CHOROPLETH options from mapping fields when no visualization is linked', () => {
    expect(buildChoroplethRendererOptions(mapping({ visualizationId: null }), null)).toEqual({
      mapType: 'kenya-counties',
      keyColumn: 'county_code',
      valueColumn: 'total',
      targetField: 'code',
    })
  })

  it('uses the linked CHOROPLETH visualization options when present', () => {
    const viz: VisualizationDefinition = {
      id: 'viz-1',
      queryId: 'q1',
      type: 'CHOROPLETH',
      name: 'Saved map',
      options: {
        mapType: 'world-countries',
        keyColumn: 'iso',
        valueColumn: 'pop',
        targetField: 'iso_a3',
        steps: 7,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    expect(buildChoroplethRendererOptions(mapping({ visualizationId: 'viz-1' }), viz)).toEqual(
      viz.options,
    )
  })

  it('falls back to mapping fields when the visualization is missing or not CHOROPLETH', () => {
    const tableViz: VisualizationDefinition = {
      id: 'viz-table',
      queryId: 'q1',
      type: 'TABLE',
      name: 'Table',
      options: { itemsPerPage: 10 },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    expect(buildChoroplethRendererOptions(mapping(), tableViz)).toMatchObject({
      mapType: 'kenya-counties',
      keyColumn: 'county_code',
    })
    expect(buildChoroplethRendererOptions(mapping(), null).mapType).toBe('kenya-counties')
  })
})

describe('mapping options pack/unpack', () => {
  it('packs choropleth fields for jsonb persistence', () => {
    expect(mappingOptionsFromDefinition(mapping({ visualizationId: 'viz-1' }))).toEqual({
      queryId: 'q1',
      visualizationId: 'viz-1',
      mapType: 'kenya-counties',
      keyColumn: 'county_code',
      valueColumn: 'total',
      targetField: 'code',
    })
  })

  it('reads choropleth fields back from jsonb options', () => {
    expect(
      mappingFieldsFromOptions({
        queryId: 'q1',
        visualizationId: null,
        mapType: 'africa-countries',
        keyColumn: 'iso2',
        valueColumn: 'n',
        targetField: 'iso_a2',
      }),
    ).toEqual({
      queryId: 'q1',
      visualizationId: null,
      mapType: 'africa-countries',
      keyColumn: 'iso2',
      valueColumn: 'n',
      targetField: 'iso_a2',
    })
  })

  it('treats missing or invalid options as null choropleth fields', () => {
    expect(mappingFieldsFromOptions(undefined)).toEqual({
      queryId: null,
      visualizationId: null,
      mapType: null,
      keyColumn: null,
      valueColumn: null,
      targetField: null,
    })
    expect(mappingFieldsFromOptions('nope')).toEqual({
      queryId: null,
      visualizationId: null,
      mapType: null,
      keyColumn: null,
      valueColumn: null,
      targetField: null,
    })
  })
})
