/** Pick latitude/longitude column names from a table schema (best-effort). */
export function guessGeoColumns(columnNames: string[]): {
  latitude: string | null
  longitude: string | null
} {
  const lower = columnNames.map((c) => ({ raw: c, l: c.trim().toLowerCase() }))
  const lat =
    lower.find((x) => x.l === 'latitude' || x.l === 'lat')?.raw ??
    lower.find((x) => x.l.includes('latitude'))?.raw ??
    null
  const lng =
    lower.find((x) => x.l === 'longitude' || x.l === 'lon' || x.l === 'lng')?.raw ??
    lower.find((x) => x.l.includes('longitude'))?.raw ??
    null
  return { latitude: lat, longitude: lng }
}

/** Parse a cell value into a finite number, or null. */
export function parseCoordinate(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v.trim().replace(',', '.'))
    if (!Number.isNaN(n) && Number.isFinite(n)) return n
  }
  return null
}

export function isValidLatitude(n: number): boolean {
  return n >= -90 && n <= 90
}

export function isValidLongitude(n: number): boolean {
  return n >= -180 && n <= 180
}
