import type {
  DataColumnDef,
  DataFilter,
  DataPrimitive,
  QueryAggregation,
  QueryDefinition,
} from './types.ts'

/**
 * Query compiler — translates a `QueryDefinition` (the shape the UI produces
 * today, see `src/types/data.ts`) into backend SQL for either storage backend
 * described in `docs/supabase-backend-plan.md` §8.
 *
 *   - `jsonb`  → SQL against `public.data_table_rows`, projecting jsonb fields
 *                with typed casts (`(row_data->>'col')::type`).
 *   - `parquet`→ DuckDB SQL against `read_parquet(<path>)`, referencing typed
 *                columns directly as quoted identifiers.
 *
 * This module is a pure builder: it returns `{ sql, params, backend }` and does
 * not execute anything. The caller (an Edge Function or worker) binds `params`
 * and runs the statement against the appropriate engine. Numbered placeholders
 * (`$1`, `$2`, …) are used for both backends — Postgres and DuckDB both accept
 * them.
 *
 * It replaces the in-browser `runQueryDefinition()` (`src/lib/queryEngine.ts`)
 * for any table whose rows live server-side. `queryEngine.ts` is retained for
 * anonymous demo mode only.
 */

export type StorageBackend = 'jsonb' | 'parquet'

export interface CompiledTableMeta {
  id: string
  organizationId: string
  storageBackend: StorageBackend
  columns: DataColumnDef[]
  /** Parquet backend only: glob pattern, e.g. `s3://bucket/orgs/{org}/tables/{id}/data/*.parquet`. */
  parquetPathPattern?: string
}

export interface CompiledQuery {
  sql: string
  params: unknown[]
  backend: StorageBackend
}

const PG_NUMERIC = 'numeric'
const PG_BOOLEAN = 'boolean'

/** Quote a SQL identifier (column or alias) safely for both Postgres and DuckDB. */
function quoteIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return '"' + name.replace(/"/g, '""') + '"'
  }
  return name
}

/** Coerce a filter value string into the bind value matching the column type. */
function coerceParamValue(raw: string, colType: DataColumnDef['type']): DataPrimitive {
  if (colType === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  if (colType === 'boolean') {
    if (raw === 'true' || raw === '1') return true
    if (raw === 'false' || raw === '0') return false
    return null
  }
  return raw
}

/** Postgres/DuckDB operator for each `DataFilterOperator`. */
const COMPARISON_OPS: Record<Exclude<DataFilter['operator'], 'contains' | 'eq' | 'neq'>, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
}

interface ParamAccumulator {
  values: unknown[]
  next(): string
}

function makeParamAccumulator(): ParamAccumulator {
  let n = 0
  const values: unknown[] = []
  return {
    values,
    next() {
      n += 1
      return '$' + n
    },
  }
}

/** Render a column reference on the left-hand side of an expression. */
function columnRef(backend: StorageBackend, name: string, colType: DataColumnDef['type']): string {
  if (backend === 'parquet') {
    return quoteIdent(name)
  }
  // jsonb: extract as text, then cast for non-text comparisons.
  const extracted = `row_data->>${literalString(name)}`
  if (colType === 'number') return `(${extracted})::${PG_NUMERIC}`
  if (colType === 'boolean') return `(${extracted})::${PG_BOOLEAN}`
  return extracted
}

/** Render a bound parameter on the right-hand side, typed to match the column. */
function typedParamRef(
  placeholder: string,
  colType: DataColumnDef['type'],
): string {
  if (colType === 'number') return `${placeholder}::${PG_NUMERIC}`
  if (colType === 'boolean') return `${placeholder}::${PG_BOOLEAN}`
  return placeholder
}

/** SQL string literal (used for jsonb key extraction; values go through params). */
function literalString(s: string): string {
  return "'" + s.replace(/'/g, "''") + "'"
}

function resolveColumn(
  columns: DataColumnDef[],
  name: string,
): DataColumnDef {
  const col = columns.find((c) => c.name === name)
  if (!col) {
    // Unknown column — fall back to text so the query still runs against the
    // known-good columns rather than hard-failing. The UI should prevent this.
    return { name, type: 'string' }
  }
  return col
}

function compileFilter(
  backend: StorageBackend,
  filter: DataFilter,
  columns: DataColumnDef[],
  params: ParamAccumulator,
): string | null {
  const col = resolveColumn(columns, filter.column)
  const left = columnRef(backend, filter.column, col.type)

  if (filter.operator === 'contains') {
    const ph = params.next()
    params.values.push('%' + filter.value + '%')
    // contains is only meaningful for text columns.
    const textLeft = backend === 'parquet' ? quoteIdent(filter.column) : `row_data->>${literalString(filter.column)}`
    return `${textLeft} ilike ${ph}`
  }

  if (filter.operator === 'eq' || filter.operator === 'neq') {
    const ph = params.next()
    const value = coerceParamValue(filter.value, col.type)
    if (value === null) {
      // Unparseable typed value — force a non-match instead of throwing.
      return filter.operator === 'eq' ? 'false' : 'true'
    }
    params.values.push(value)
    const right = typedParamRef(ph, col.type)
    return `${left} ${filter.operator === 'eq' ? '=' : '<>'} ${right}`
  }

  // Numeric comparisons.
  const ph = params.next()
  const value = coerceParamValue(filter.value, col.type)
  if (value === null) return 'false'
  params.values.push(value)
  const right = typedParamRef(ph, col.type)
  return `${left} ${COMPARISON_OPS[filter.operator]} ${right}`
}

function compileAggregation(
  backend: StorageBackend,
  agg: QueryAggregation,
  columns: DataColumnDef[],
): string {
  const alias = (agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`).trim()
  const aliasSql = quoteIdent(alias)
  if (agg.operator === 'count') {
    if (!agg.column) return `count(*) as ${aliasSql}`
    return `count(${columnRef(backend, agg.column, resolveColumn(columns, agg.column).type)}) as ${aliasSql}`
  }
  const col = resolveColumn(columns, agg.column)
  const ref = columnRef(backend, agg.column, col.type === 'number' ? 'number' : 'string')
  // Force numeric context for sum/avg; non-numeric columns coerce to numeric or null.
  const numericRef = col.type === 'number' ? ref : `(${ref})::numeric`
  if (agg.operator === 'sum') return `sum(${numericRef}) as ${aliasSql}`
  return `avg(${numericRef}) as ${aliasSql}`
}

function compileProjection(
  backend: StorageBackend,
  selected: string[],
  columns: DataColumnDef[],
): string {
  if (selected.length === 0) {
    return backend === 'parquet' ? '*' : 'row_data'
  }
  return selected
    .map((name) => {
      const col = resolveColumn(columns, name)
      const ref = columnRef(backend, name, col.type)
      return `${ref} as ${quoteIdent(name)}`
    })
    .join(', ')
}

function fromClause(table: CompiledTableMeta, params: ParamAccumulator): string {
  if (table.storageBackend === 'parquet') {
    const pattern = table.parquetPathPattern ?? defaultParquetPath(table)
    const rendered = pattern
      .replace('{org}', table.organizationId)
      .replace('{id}', table.id)
    const ph = params.next()
    params.values.push(rendered)
    return `from read_parquet(${ph})`
  }
  return `from public.data_table_rows`
}

function defaultParquetPath(table: CompiledTableMeta): string {
  return `s3://dimes-bi/orgs/${table.organizationId}/tables/${table.id}/data/*.parquet`
}

export function compileQuery(
  table: CompiledTableMeta,
  query: QueryDefinition,
): CompiledQuery {
  const params = makeParamAccumulator()
  const backend = table.storageBackend
  const columns = table.columns
  const filters = query.filters ?? []
  const groupBy = query.groupBy ?? []
  const aggregations = query.aggregations ?? []
  const selectedColumns = query.selectedColumns ?? []

  const where: string[] = []

  if (backend === 'jsonb') {
    // Scope to org + table. The org check is defense-in-depth; RLS also enforces it.
    const orgPh = params.next()
    params.values.push(table.organizationId)
    const tablePh = params.next()
    params.values.push(table.id)
    where.push(`organization_id = ${orgPh}`)
    where.push(`data_table_id = ${tablePh}`)
  }

  for (const f of filters) {
    const cond = compileFilter(backend, f, columns, params)
    if (cond) where.push(cond)
  }

  const whereSql = where.length ? `where ${where.join(' and ')}` : ''

  const selectParts: string[] = []
  if (aggregations.length > 0) {
    for (const g of groupBy) {
      const col = resolveColumn(columns, g)
      selectParts.push(`${columnRef(backend, g, col.type)} as ${quoteIdent(g)}`)
    }
    for (const a of aggregations) {
      selectParts.push(compileAggregation(backend, a, columns))
    }
  } else {
    selectParts.push(compileProjection(backend, selectedColumns, columns))
  }

  const groupBySql =
    aggregations.length > 0 && groupBy.length > 0
      ? `group by ${groupBy.map((g) => quoteIdent(g)).join(', ')}`
      : ''

  const fromSql = fromClause(table, params)

  const sql = [
    `select ${selectParts.join(', ')}`,
    fromSql,
    whereSql,
    groupBySql,
  ]
    .filter((s) => s.length > 0)
    .join('\n')

  return { sql, params: params.values, backend }
}
