import type { DataPrimitive, DataRow } from '#/types/data'

export type KpiMeasureResult = {
  value: number | null
  field: string | null
  caption: string
  empty: boolean
}

function pickMeasureField(row: DataRow, measureKey?: string): string | null {
  if (measureKey && measureKey in row) return measureKey
  const keys = Object.keys(row)
  const numeric = keys.find((k) => typeof row[k] === 'number')
  return numeric ?? keys[0] ?? null
}

function toNumber(v: DataPrimitive): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Resolve a KPI display value from query result rows.
 * Single aggregation layer: show the bound field as-is (first row if many).
 * Never re-averages across rows.
 */
export function resolveKpiMeasure(
  rows: DataRow[],
  measureKey?: string,
): KpiMeasureResult {
  if (rows.length === 0) {
    return {
      value: null,
      field: measureKey ?? null,
      caption: 'No rows from query',
      empty: true,
    }
  }

  const row = rows[0]
  const field = pickMeasureField(row, measureKey)
  const value = field ? toNumber(row[field] ?? null) : null
  const multi = rows.length > 1

  return {
    value,
    field,
    caption: multi
      ? `First row · ${field ?? 'measure'}`
      : `From query · ${field ?? 'measure'}`,
    empty: value == null,
  }
}
