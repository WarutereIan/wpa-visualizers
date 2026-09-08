/**
 * Pure GeoJSON upload checks shared by the demo store and the workspace client.
 *
 * Size policy (documented for Task 4 / upload-geo):
 * - Reject raw uploads larger than {@link MAX_RAW_UPLOAD_BYTES} (15 MB).
 * - If a payload is larger than {@link SIMPLIFY_THRESHOLD_BYTES} (3 MB), the
 *   upload-geo edge function rounds coordinates to 5 decimal places (~1.1 m)
 *   to shrink it toward {@link TARGET_SIMPLIFIED_BYTES} (5 MB). Full mapshaper
 *   simplify is not used in Deno.
 */

/** Max accepted raw upload size (15 MiB). */
export const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024
/** Payloads above this are coordinate-rounded on the server. */
export const SIMPLIFY_THRESHOLD_BYTES = 3 * 1024 * 1024
/** Documented post-simplify size target (not a hard reject). */
export const TARGET_SIMPLIFIED_BYTES = 5 * 1024 * 1024

const CODE_ALIASES = [
  'code',
  'ISO',
  'ISO_A3',
  'iso_a3',
  'ISO3',
  'id',
  'ADM1_PCODE',
  'shapeISO',
  'GID_0',
  'GID_1',
] as const

const NAME_ALIASES = [
  'name',
  'NAME',
  'NAME_EN',
  'ADMIN',
  'NAME_0',
  'NAME_1',
  'shapeName',
  'COUNTY',
  'ADM1_EN',
] as const

export type GeoJsonGeometry = {
  type: string
  coordinates?: unknown
  geometries?: GeoJsonGeometry[]
}

export type GeoJsonFeature = {
  type: 'Feature'
  properties?: Record<string, unknown> | null
  geometry: GeoJsonGeometry | null
}

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export type GeoJsonValidationOk = {
  ok: true
  featureCount: number
  propertyKeys: string[]
  byteSize: number
  collection: GeoJsonFeatureCollection
}

export type GeoJsonValidationErr = {
  ok: false
  error: string
}

export type GeoJsonValidationResult = GeoJsonValidationOk | GeoJsonValidationErr

export function utf8ByteSize(value: string): number {
  return new TextEncoder().encode(value).length
}

function hasGeometry(geom: unknown): boolean {
  if (!geom || typeof geom !== 'object') return false
  const g = geom as GeoJsonGeometry
  if (typeof g.type !== 'string' || !g.type) return false
  if (g.type === 'GeometryCollection') {
    return Array.isArray(g.geometries) && g.geometries.some(hasGeometry)
  }
  return g.coordinates != null
}

export function featuresHaveGeometries(features: unknown[]): boolean {
  if (!Array.isArray(features) || features.length === 0) return false
  return features.every((f) => {
    if (!f || typeof f !== 'object') return false
    return hasGeometry((f as GeoJsonFeature).geometry)
  })
}

export function extractPropertyKeys(features: GeoJsonFeature[]): string[] {
  const keys = new Set<string>()
  for (const f of features) {
    if (f.properties && typeof f.properties === 'object') {
      for (const k of Object.keys(f.properties)) keys.add(k)
    }
  }
  return [...keys]
}

export function validateFeatureCollection(
  input: unknown,
  options?: { byteSize?: number; maxBytes?: number },
): GeoJsonValidationResult {
  const maxBytes = options?.maxBytes ?? MAX_RAW_UPLOAD_BYTES
  const serialized =
    typeof input === 'string' ? input : JSON.stringify(input ?? '')
  const byteSize = options?.byteSize ?? utf8ByteSize(serialized)

  if (byteSize > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    return { ok: false, error: `GeoJSON exceeds the ${mb}MB upload limit` }
  }

  let parsed: unknown = input
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input)
    } catch {
      return { ok: false, error: 'Invalid JSON' }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Expected a GeoJSON object' }
  }

  const obj = parsed as Record<string, unknown>
  if (obj.type !== 'FeatureCollection') {
    return { ok: false, error: 'Expected a FeatureCollection' }
  }
  if (!Array.isArray(obj.features) || obj.features.length === 0) {
    return { ok: false, error: 'FeatureCollection has no features' }
  }
  if (!featuresHaveGeometries(obj.features)) {
    return { ok: false, error: 'Every feature must have a geometry' }
  }

  const features = obj.features as GeoJsonFeature[]
  return {
    ok: true,
    featureCount: features.length,
    propertyKeys: extractPropertyKeys(features),
    byteSize,
    collection: obj as GeoJsonFeatureCollection,
  }
}

export function roundCoordinates(value: unknown, decimals = 5): unknown {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const f = 10 ** decimals
    return Math.round(value * f) / f
  }
  if (Array.isArray(value)) return value.map((v) => roundCoordinates(v, decimals))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('coordinates' in obj) {
      return { ...obj, coordinates: roundCoordinates(obj.coordinates, decimals) }
    }
    if (Array.isArray(obj.features)) {
      return { ...obj, features: obj.features.map((f) => roundCoordinates(f, decimals)) }
    }
    if (obj.geometry) {
      return { ...obj, geometry: roundCoordinates(obj.geometry, decimals) }
    }
    if (Array.isArray(obj.geometries)) {
      return {
        ...obj,
        geometries: obj.geometries.map((g) => roundCoordinates(g, decimals)),
      }
    }
  }
  return value
}

function firstAliasValue(
  props: Record<string, unknown>,
  aliases: readonly string[],
  skip: string,
): string | undefined {
  for (const k of aliases) {
    if (k === skip) continue
    const v = props[k]
    if (v == null || v === '') continue
    return String(v)
  }
  return undefined
}

export function fillMissingCodeName(
  collection: GeoJsonFeatureCollection,
): GeoJsonFeatureCollection {
  return {
    ...collection,
    features: collection.features.map((f) => {
      const props: Record<string, unknown> = { ...(f.properties ?? {}) }
      if (props.code == null || props.code === '') {
        const copied = firstAliasValue(props, CODE_ALIASES, 'code')
        if (copied != null) props.code = copied
      }
      if (props.name == null || props.name === '') {
        const copied = firstAliasValue(props, NAME_ALIASES, 'name')
        if (copied != null) props.name = copied
      }
      return { ...f, properties: props }
    }),
  }
}

export function pickDefaultTargetField(
  propertyKeys: string[],
  requested?: string,
): string {
  if (requested && propertyKeys.includes(requested)) return requested
  if (propertyKeys.includes('code')) return 'code'
  if (propertyKeys.includes('name')) return 'name'
  return propertyKeys[0] ?? 'code'
}

export function fieldNamesFromKeys(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of keys) out[k] = k
  return out
}
