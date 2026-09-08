import {
  MAX_RAW_UPLOAD_BYTES,
  utf8ByteSize,
  validateFeatureCollection,
  type GeoJsonValidationResult,
} from '#/lib/geo/geojsonValidate'

export const ACCEPTED_GEO_FILE = '.geojson,.json,application/geo+json,application/json'

export function isAcceptedGeoFileName(name: string): boolean {
  return /\.(geojson|json)$/i.test(name.trim())
}

export function nameFromGeoFile(fileName: string): string {
  return fileName.replace(/\.(geojson|json)$/i, '').trim() || 'Custom map'
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function validateGeoFile(file: File): Promise<GeoJsonValidationResult> {
  if (!isAcceptedGeoFileName(file.name)) {
    return { ok: false, error: 'Choose a .geojson or .json file' }
  }
  if (file.size > MAX_RAW_UPLOAD_BYTES) {
    return { ok: false, error: 'GeoJSON exceeds the 15MB upload limit' }
  }
  const text = await file.text()
  return validateFeatureCollection(text, { byteSize: utf8ByteSize(text) })
}
