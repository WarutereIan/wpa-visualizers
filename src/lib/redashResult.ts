import { queryResultColumns } from '#/lib/queryResultColumns'
import { slugAlias } from '#/lib/slugAlias'
import type { AggregationOperator, DataColumnDef, DataColumnType, DataRow, QueryDefinition } from '#/types/data'
import type { RedashColumnType, RedashQueryResult } from '#/types/visualization'

function toFriendlyName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function mapSourceType(type: DataColumnType): RedashColumnType {
  switch (type) {
    case 'number':
      return 'float'
    case 'date':
      return 'date'
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
  }
}

function aggregationOperatorsByAlias(query: QueryDefinition): Map<string, AggregationOperator> {
  const map = new Map<string, AggregationOperator>()
  for (const agg of query.aggregations ?? []) {
    const raw = agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`
    const alias = slugAlias(raw) || raw
    map.set(alias, agg.operator)
  }
  return map
}

function isGrainColumn(name: string, query: QueryDefinition): boolean {
  const grains = query.groupByGrains ?? {}
  for (const [column, grain] of Object.entries(grains)) {
    if (grain && name === `${column}_${grain}`) return true
  }
  return false
}

function inferFromRows(name: string, rows: DataRow[]): RedashColumnType {
  for (const row of rows) {
    const value = row[name]
    if (value != null) {
      return typeof value === 'number' ? 'float' : 'string'
    }
  }
  return 'string'
}

function resolveColumnType(
  name: string,
  query: QueryDefinition,
  sourceColumns: DataColumnDef[],
  rows: DataRow[],
): RedashColumnType {
  const aggOperators = aggregationOperatorsByAlias(query)
  const operator = aggOperators.get(name)
  if (operator != null) {
    return operator === 'count' ? 'integer' : 'float'
  }

  if (isGrainColumn(name, query)) {
    return 'string'
  }

  const source = sourceColumns.find((col) => col.name === name)
  if (source) {
    return mapSourceType(source.type)
  }

  return inferFromRows(name, rows)
}

/** Convert DSL query output rows into viz-lib's expected result shape. */
export function toRedashResult(
  rows: DataRow[],
  query: QueryDefinition,
  sourceColumns: DataColumnDef[],
): RedashQueryResult {
  const columnNames = queryResultColumns(query)
  const names = columnNames.length > 0 ? columnNames : Object.keys(rows[0] ?? {})

  const columns = names.map((name) => ({
    name,
    type: resolveColumnType(name, query, sourceColumns, rows),
    friendly_name: toFriendlyName(name),
  }))

  return { columns, rows }
}
