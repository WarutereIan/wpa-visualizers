/** Built-in choropleth map metadata (mirrors src/lib/geo/mapRegistry.ts). */
export const BUILTIN_CHOROPLETH_MAPS = {
  'world-countries': {
    name: 'World Countries',
    url: '/geo/world-countries.geojson',
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
    fieldNames: {
      name: 'Name',
      code: 'Code',
    },
  },
  'kenya-subcounties': {
    name: 'Kenya Sub-counties',
    url: '/geo/kenya-subcounties.geojson',
    fieldNames: {
      name: 'Name',
      code: 'Code',
    },
  },
} as const

export type ChoroplethMapEntry = {
  name: string
  url: string
  fieldNames: Record<string, string>
}

export type ChoroplethAvailableMaps = Record<string, ChoroplethMapEntry>

function customChoroplethMapKey(id: string): string {
  return `custom:${id}`
}

function mapTypeFromOptions(options: unknown): string | null {
  if (!options || typeof options !== 'object') return null
  const mapType = (options as Record<string, unknown>).mapType
  return typeof mapType === 'string' && mapType.trim() ? mapType.trim() : null
}

/** Collect unique mapType values from CHOROPLETH visualizations. */
export function collectChoroplethMapTypes(
  visualizations: Array<{ type?: string; options?: unknown }>,
): string[] {
  const mapTypes = new Set<string>()
  for (const viz of visualizations) {
    if (viz.type !== 'CHOROPLETH') continue
    const mapType = mapTypeFromOptions(viz.options)
    if (mapType) mapTypes.add(mapType)
  }
  return [...mapTypes]
}

type GeoDatasetRow = {
  id: string
  name: string
  public_url: string
  field_names: unknown
}

function fieldNamesFromDb(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

/** Build choroplethAvailableMaps for a public shared dashboard response. */
export async function buildPublicChoroplethMaps(
  admin: {
    from: (table: string) => {
      select: (cols: string) => {
        in: (col: string, ids: string[]) => {
          eq: (col: string, val: string) => Promise<{ data: GeoDatasetRow[] | null }>
        }
      }
    }
  },
  organizationId: string,
  mapTypes: string[],
): Promise<ChoroplethAvailableMaps> {
  const maps: ChoroplethAvailableMaps = {}

  for (const [id, entry] of Object.entries(BUILTIN_CHOROPLETH_MAPS)) {
    maps[id] = {
      name: entry.name,
      url: entry.url,
      fieldNames: { ...entry.fieldNames },
    }
  }

  const customIds = mapTypes
    .filter((mapType) => mapType.startsWith('custom:'))
    .map((mapType) => mapType.slice('custom:'.length))
    .filter(Boolean)

  if (customIds.length === 0) return maps

  const { data: rows } = await admin
    .from('geo_datasets')
    .select('id, name, public_url, field_names')
    .in('id', customIds)
    .eq('organization_id', organizationId)

  for (const row of rows ?? []) {
    maps[customChoroplethMapKey(row.id)] = {
      name: row.name,
      url: row.public_url,
      fieldNames: fieldNamesFromDb(row.field_names),
    }
  }

  return maps
}
