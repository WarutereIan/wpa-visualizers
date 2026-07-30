import type { DateGrain, DataPrimitive } from './types.ts'

/** Keep in sync with src/lib/dateGrain.ts */
export function bucketDateValue(
  raw: DataPrimitive | undefined,
  grain: DateGrain,
): string | null {
  if (raw == null || raw === '') return null
  const d = new Date(typeof raw === 'string' || typeof raw === 'number' ? raw : String(raw))
  if (Number.isNaN(d.getTime())) return String(raw)

  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()

  switch (grain) {
    case 'year':
      return `${y}`
    case 'quarter': {
      const q = Math.floor(m / 3) + 1
      return `${y}-Q${q}`
    }
    case 'month':
      return `${y}-${String(m + 1).padStart(2, '0')}`
    case 'week': {
      const tmp = new Date(Date.UTC(y, m, day))
      const dayNum = tmp.getUTCDay() || 7
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
      const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    }
    case 'day':
    default:
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
}

export function groupByResultColumn(column: string, grain?: DateGrain): string {
  if (!grain) return column
  return `${column}_${grain}`
}

/** DuckDB/Postgres expression that buckets a date/timestamp column. */
export function sqlDateGrainExpr(columnSql: string, grain: DateGrain): string {
  switch (grain) {
    case 'year':
      return `strftime(${columnSql}, '%Y')`
    case 'quarter':
      return `concat(strftime(${columnSql}, '%Y'), '-Q', cast(quarter(${columnSql}) as varchar))`
    case 'month':
      return `strftime(${columnSql}, '%Y-%m')`
    case 'week':
      return `concat(strftime(${columnSql}, '%G'), '-W', lpad(cast(week(${columnSql}) as varchar), 2, '0'))`
    case 'day':
    default:
      return `strftime(${columnSql}, '%Y-%m-%d')`
  }
}
