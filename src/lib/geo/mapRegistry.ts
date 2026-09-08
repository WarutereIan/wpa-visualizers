import type { BuiltinMapId } from '#/types/geo'

export type ChoroplethMapEntry = {
  name: string
  url: string
  fieldNames: Record<string, string>
}

export type ChoroplethAvailableMaps = Record<string, ChoroplethMapEntry>

export type BuiltinChoroplethMap = ChoroplethMapEntry & {
  defaultTargetField: 'code'
}

export const BUILTIN_CHOROPLETH_MAPS: Record<BuiltinMapId, BuiltinChoroplethMap> = {
  'world-countries': {
    name: 'World Countries',
    url: '/geo/world-countries.geojson',
    defaultTargetField: 'code',
    fieldNames: {
      name: 'Name',
      code: 'Code',
      iso_a2: 'ISO 3166-1 alpha-2',
      iso_a3: 'ISO 3166-1 alpha-3',
    },
  },
  'africa-countries': {
    name: 'Africa Countries',
    url: '/geo/africa-countries.geojson',
    defaultTargetField: 'code',
    fieldNames: {
      name: 'Name',
      code: 'Code',
      iso_a2: 'ISO 3166-1 alpha-2',
      iso_a3: 'ISO 3166-1 alpha-3',
    },
  },
  'kenya-counties': {
    name: 'Kenya Counties',
    url: '/geo/kenya-counties.geojson',
    defaultTargetField: 'code',
    fieldNames: {
      name: 'Name',
      code: 'Code',
    },
  },
  'kenya-subcounties': {
    name: 'Kenya Sub-counties',
    url: '/geo/kenya-subcounties.geojson',
    defaultTargetField: 'code',
    fieldNames: {
      name: 'Name',
      code: 'Code',
    },
  },
}

export type CustomChoroplethMapInput = {
  id: string
  name: string
  url: string
  fieldNames: Record<string, string>
}

/** Prefix custom map keys so they never collide with built-in ids. */
export function customChoroplethMapKey(id: string): string {
  return `custom:${id}`
}

export function buildChoroplethAvailableMaps(
  custom?: CustomChoroplethMapInput[],
): ChoroplethAvailableMaps {
  const maps: ChoroplethAvailableMaps = {}

  for (const [id, entry] of Object.entries(BUILTIN_CHOROPLETH_MAPS)) {
    maps[id] = {
      name: entry.name,
      url: entry.url,
      fieldNames: entry.fieldNames,
    }
  }

  if (custom) {
    for (const dataset of custom) {
      maps[customChoroplethMapKey(dataset.id)] = {
        name: dataset.name,
        url: dataset.url,
        fieldNames: dataset.fieldNames,
      }
    }
  }

  return maps
}
