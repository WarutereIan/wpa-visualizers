import { describe, expect, it } from 'vitest'
import {
  BUILTIN_CHOROPLETH_MAPS,
  buildChoroplethAvailableMaps,
  customChoroplethMapKey,
} from '#/lib/geo/mapRegistry'

describe('mapRegistry', () => {
  it('includes all built-in map ids with required fields', () => {
    const ids = [
      'world-countries',
      'africa-countries',
      'kenya-counties',
      'kenya-subcounties',
    ] as const

    for (const id of ids) {
      const entry = BUILTIN_CHOROPLETH_MAPS[id]
      expect(entry.url).toMatch(/^\/geo\/.*\.geojson$/)
      expect(entry.defaultTargetField).toBe('code')
      expect(entry.fieldNames.name).toBeTruthy()
      expect(entry.fieldNames.code).toBeTruthy()
    }
  })

  it('includes iso fields on country maps', () => {
    expect(BUILTIN_CHOROPLETH_MAPS['world-countries'].fieldNames.iso_a2).toBeTruthy()
    expect(BUILTIN_CHOROPLETH_MAPS['world-countries'].fieldNames.iso_a3).toBeTruthy()
    expect(BUILTIN_CHOROPLETH_MAPS['africa-countries'].fieldNames.iso_a2).toBeTruthy()
    expect(BUILTIN_CHOROPLETH_MAPS['africa-countries'].fieldNames.iso_a3).toBeTruthy()
  })

  it('buildChoroplethAvailableMaps returns built-ins when custom is omitted', () => {
    const maps = buildChoroplethAvailableMaps()
    expect(Object.keys(maps).sort()).toEqual(Object.keys(BUILTIN_CHOROPLETH_MAPS).sort())
    expect(maps['world-countries'].url).toBe('/geo/world-countries.geojson')
  })

  it('prefixes custom maps with custom: to avoid builtin collisions', () => {
    const maps = buildChoroplethAvailableMaps([
      {
        id: 'world-countries',
        name: 'Evil Override',
        url: 'https://example.com/evil.geojson',
        fieldNames: { code: 'Code' },
      },
      {
        id: 'org-dataset-1',
        name: 'Custom Region',
        url: 'https://example.com/custom.geojson',
        fieldNames: { name: 'Name', code: 'Code' },
      },
    ])

    expect(maps['world-countries'].url).toBe('/geo/world-countries.geojson')
    expect(maps['world-countries'].name).toBe('World Countries')
    expect(maps[customChoroplethMapKey('world-countries')].name).toBe('Evil Override')
    expect(maps[customChoroplethMapKey('org-dataset-1')].name).toBe('Custom Region')
  })
})
