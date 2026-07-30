import type { DataColumnType, DataPrimitive, DataRow, DataTable } from '#/types/data'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/

export function inferColumnType(sample: DataPrimitive): DataColumnType {
  if (sample === null || sample === undefined) return 'string'
  if (typeof sample === 'boolean') return 'boolean'
  if (typeof sample === 'number') return Number.isFinite(sample) ? 'number' : 'string'
  if (typeof sample === 'string') {
    const s = sample.trim()
    if (!s) return 'string'
    if (UUID_RE.test(s)) return 'string'
    if (s === 'true' || s === 'false') return 'boolean'
    if (ISO_DATE_RE.test(s)) {
      const t = Date.parse(s)
      if (Number.isFinite(t)) return 'date'
    }
    const n = Number(s)
    if (Number.isFinite(n) && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) return 'number'
    return 'string'
  }
  return 'string'
}

/** Infer schema from row samples (first decisive non-null per column). */
export function inferColumnsFromRows(rows: DataRow[]): DataTable['columns'] {
  const first = rows[0] ?? {}
  const keys = Object.keys(first)
  return keys.map((k) => {
    const sample = rows.find((r) => r[k] !== null && r[k] !== undefined)?.[k] ?? null
    return { name: k, type: inferColumnType(sample) }
  })
}
