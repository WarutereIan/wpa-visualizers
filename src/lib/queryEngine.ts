import type {
  DataColumnDef,
  DataFilter,
  DataPrimitive,
  DataRow,
  DataTable,
  QueryAggregation,
  QueryDefinition,
} from '#/types/data'

function parseMaybeNumber(v: string): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function matchesFilter(row: DataRow, filter: DataFilter, column?: DataColumnDef): boolean {
  const raw = row[filter.column]
  if (raw === undefined) return false

  switch (filter.operator) {
    case 'eq':
      return String(raw) === filter.value
    case 'neq':
      return String(raw) !== filter.value
    case 'contains':
      return String(raw).toLowerCase().includes(filter.value.toLowerCase())
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const left = typeof raw === 'number' ? raw : parseMaybeNumber(String(raw))
      const right = parseMaybeNumber(filter.value)
      if (left === null || right === null) return false
      if (filter.operator === 'gt') return left > right
      if (filter.operator === 'gte') return left >= right
      if (filter.operator === 'lt') return left < right
      return left <= right
    }
    default:
      return true
  }
}

function projectRow(row: DataRow, selected: string[]): DataRow {
  if (selected.length === 0) return row
  const out: DataRow = {}
  selected.forEach((k) => {
    out[k] = (row[k] ?? null) as DataPrimitive
  })
  return out
}

export function runQueryDefinition(table: DataTable, query: QueryDefinition): DataRow[] {
  const columnsByName = new Map(table.columns.map((c) => [c.name, c]))
  const filters = query.filters ?? []
  const groupBy = query.groupBy ?? []
  const aggregations = query.aggregations ?? []
  const selectedColumns = query.selectedColumns ?? []
  const filtered = table.rows.filter((row) =>
    filters.every((f) => matchesFilter(row, f, columnsByName.get(f.column))),
  )

  if (aggregations.length === 0) {
    return filtered.map((r) => projectRow(r, selectedColumns))
  }

  if (groupBy.length === 0) {
    return [computeAggRow(filtered, aggregations)]
  }

  const grouped = new Map<string, DataRow[]>()
  filtered.forEach((row) => {
    const key = groupBy.map((k) => String(row[k] ?? '')).join('||')
    const list = grouped.get(key)
    if (list) list.push(row)
    else grouped.set(key, [row])
  })

  return Array.from(grouped.entries()).map(([_, rows]) => {
    const out: DataRow = {}
    const first = rows[0] ?? {}
    groupBy.forEach((k) => {
      out[k] = (first[k] ?? null) as DataPrimitive
    })
    const aggRow = computeAggRow(rows, aggregations)
    Object.assign(out, aggRow)
    return out
  })
}

function computeAggRow(rows: DataRow[], aggregations: QueryAggregation[]): DataRow {
  const out: DataRow = {}
  aggregations.forEach((agg) => {
    const alias = agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`
    if (agg.operator === 'count') {
      out[alias] = rows.length
      return
    }
    const nums = rows
      .map((r) => r[agg.column])
      .map((v) => (typeof v === 'number' ? v : parseMaybeNumber(String(v ?? ''))))
      .filter((v): v is number => v !== null)
    if (agg.operator === 'sum') out[alias] = nums.reduce((a, b) => a + b, 0)
    else out[alias] = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  })
  return out
}

