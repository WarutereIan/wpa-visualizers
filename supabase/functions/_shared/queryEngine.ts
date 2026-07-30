import type {
  DataColumnDef,
  DataFilter,
  DataPrimitive,
  DataRow,
  DateGrain,
  QueryAggregation,
  QueryDefinition,
} from './types.ts'
import { applyComputedFields } from './queryComputed.ts'
import { bucketDateValue, groupByResultColumn } from './dateGrain.ts'
import { materializeJoinedTable, type DataTable } from './queryJoins.ts'
import { slugAlias } from './slugAlias.ts'

function parseMaybeNumber(v: string): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function matchesFilter(row: DataRow, filter: DataFilter, _column?: DataColumnDef): boolean {
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

function assertAggregationAllowed(
  operator: QueryAggregation['operator'],
  column: string,
  columns: DataColumnDef[],
): void {
  if (operator === 'count') return
  const col = columns.find((c) => c.name === column)
  if (col?.type !== 'number') {
    throw new Error(`Aggregation ${operator} requires a number column: ${column || '(none)'}`)
  }
}

export function applySortAndLimit(
  rows: DataRow[],
  sort: { column: string; direction: 'asc' | 'desc' }[] | undefined,
  limit: number | null | undefined,
): DataRow[] {
  let out = rows
  if (sort && sort.length > 0) {
    out = [...out].sort((a, b) => {
      for (const s of sort) {
        const av = a[s.column]
        const bv = b[s.column]
        let cmp = 0
        if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
        else cmp = String(av ?? '').localeCompare(String(bv ?? ''))
        if (cmp !== 0) return s.direction === 'desc' ? -cmp : cmp
      }
      return 0
    })
  }
  if (limit != null && limit >= 0) {
    out = out.slice(0, limit)
  }
  return out
}

function finalizeResult(rows: DataRow[], query: QueryDefinition): DataRow[] {
  const withComputed = applyComputedFields(rows, query.computedFields)
  return applySortAndLimit(withComputed, query.sort, query.limit)
}

function computeAggRow(rows: DataRow[], aggregations: QueryAggregation[]): DataRow {
  const out: DataRow = {}
  aggregations.forEach((agg) => {
    const alias =
      slugAlias(agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`) ||
      `${agg.operator}_all`
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

/**
 * Run a query. Pass `catalog` when the query has joins.
 * Keep in sync with src/lib/queryEngine.ts
 */
export function runQueryDefinition(
  table: DataTable,
  query: QueryDefinition,
  catalog: DataTable[] = [],
): DataRow[] {
  const source =
    query.joins && query.joins.length > 0
      ? materializeJoinedTable(table, query.joins, catalog.length ? catalog : [table])
      : table

  const columnsByName = new Map(source.columns.map((c) => [c.name, c]))
  const filters = query.filters ?? []
  const groupBy = query.groupBy ?? []
  const aggregations = query.aggregations ?? []
  const selectedColumns = query.selectedColumns ?? []

  for (const agg of aggregations) {
    assertAggregationAllowed(agg.operator, agg.column, source.columns)
  }

  const filtered = source.rows.filter((row) =>
    filters.every((f) => matchesFilter(row, f, columnsByName.get(f.column))),
  )

  if (aggregations.length === 0) {
    return finalizeResult(
      filtered.map((r) => projectRow(r, selectedColumns)),
      query,
    )
  }

  if (groupBy.length === 0) {
    return finalizeResult([computeAggRow(filtered, aggregations)], query)
  }

  const grouped = new Map<string, DataRow[]>()
  const grains = query.groupByGrains ?? {}
  filtered.forEach((row) => {
    const key = groupBy
      .map((k) => {
        const grain = grains[k] as DateGrain | undefined
        if (grain) return String(bucketDateValue(row[k], grain) ?? '')
        return String(row[k] ?? '')
      })
      .join('||')
    const list = grouped.get(key)
    if (list) list.push(row)
    else grouped.set(key, [row])
  })

  const groupedRows = Array.from(grouped.entries()).map(([_, rows]) => {
    const out: DataRow = {}
    const first = rows[0] ?? {}
    groupBy.forEach((k) => {
      const grain = grains[k] as DateGrain | undefined
      const outKey = groupByResultColumn(k, grain)
      if (grain) {
        out[outKey] = bucketDateValue(first[k], grain)
      } else {
        out[outKey] = (first[k] ?? null) as DataPrimitive
      }
    })
    const aggRow = computeAggRow(rows, aggregations)
    Object.assign(out, aggRow)
    return out
  })

  return finalizeResult(groupedRows, query)
}

export type { DataTable }
