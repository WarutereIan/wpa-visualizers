import type {
  DataColumnDef,
  DataFilter,
  DataPrimitive,
  QueryAggregation,
  QueryDefinition,
  QueryJoin,
} from './types.ts'
import { groupByResultColumn, sqlDateGrainExpr } from './dateGrain.ts'
import { formulaToSql } from './queryComputed.ts'
import { slugAlias } from './slugAlias.ts'

/**
 * Query compiler — translates a QueryDefinition into backend SQL.
 * Keep in sync with supabase/functions/_shared/queryCompiler.ts
 */

export type StorageBackend = 'jsonb' | 'parquet'

export interface CompiledTableMeta {
  id: string
  organizationId: string
  storageBackend: StorageBackend
  columns: DataColumnDef[]
  parquetPathPattern?: string
  name?: string
}

export interface CompiledQuery {
  sql: string
  params: unknown[]
  backend: StorageBackend
  parquetTableIds: string[]
}

const PG_NUMERIC = 'numeric'
const PG_BOOLEAN = 'boolean'

function quoteIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return '"' + name.replace(/"/g, '""') + '"'
  }
  return name
}

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

function literalString(s: string): string {
  return "'" + s.replace(/'/g, "''") + "'"
}

function columnRef(
  backend: StorageBackend,
  name: string,
  colType: DataColumnDef['type'],
  tableAlias?: string,
): string {
  if (backend === 'parquet') {
    return tableAlias ? `${quoteIdent(tableAlias)}.${quoteIdent(name)}` : quoteIdent(name)
  }
  const extracted = `row_data->>${literalString(name)}`
  if (colType === 'number') return `(${extracted})::${PG_NUMERIC}`
  if (colType === 'boolean') return `(${extracted})::${PG_BOOLEAN}`
  return extracted
}

function typedParamRef(placeholder: string, colType: DataColumnDef['type']): string {
  if (colType === 'number') return `${placeholder}::${PG_NUMERIC}`
  if (colType === 'boolean') return `${placeholder}::${PG_BOOLEAN}`
  return placeholder
}

function resolveColumn(columns: DataColumnDef[], name: string): DataColumnDef {
  return columns.find((c) => c.name === name) ?? { name, type: 'string' }
}

function compileFilter(
  backend: StorageBackend,
  filter: DataFilter,
  columns: DataColumnDef[],
  params: ParamAccumulator,
  tableAlias?: string,
): string | null {
  const col = resolveColumn(columns, filter.column)
  const left = columnRef(backend, filter.column, col.type, tableAlias)

  if (filter.operator === 'contains') {
    const ph = params.next()
    params.values.push('%' + filter.value + '%')
    const textLeft =
      backend === 'parquet'
        ? tableAlias
          ? `${quoteIdent(tableAlias)}.${quoteIdent(filter.column)}`
          : quoteIdent(filter.column)
        : `row_data->>${literalString(filter.column)}`
    return `${textLeft} ilike ${ph}`
  }

  if (filter.operator === 'eq' || filter.operator === 'neq') {
    const ph = params.next()
    const value = coerceParamValue(filter.value, col.type)
    if (value === null) return filter.operator === 'eq' ? 'false' : 'true'
    params.values.push(value)
    return `${left} ${filter.operator === 'eq' ? '=' : '<>'} ${typedParamRef(ph, col.type)}`
  }

  const ph = params.next()
  const value = coerceParamValue(filter.value, col.type)
  if (value === null) return 'false'
  params.values.push(value)
  return `${left} ${COMPARISON_OPS[filter.operator]} ${typedParamRef(ph, col.type)}`
}

function compileAggregation(
  backend: StorageBackend,
  agg: QueryAggregation,
  columns: DataColumnDef[],
  tableAlias?: string,
): string {
  const alias =
    slugAlias(agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`) ||
    `${agg.operator}_all`
  const aliasSql = quoteIdent(alias)
  if (agg.operator === 'count') {
    if (!agg.column) return `count(*) as ${aliasSql}`
    return `count(${columnRef(backend, agg.column, resolveColumn(columns, agg.column).type, tableAlias)}) as ${aliasSql}`
  }
  const col = resolveColumn(columns, agg.column)
  const ref = columnRef(backend, agg.column, col.type === 'number' ? 'number' : 'string', tableAlias)
  const numericRef = col.type === 'number' ? ref : `(${ref})::numeric`
  if (agg.operator === 'sum') return `sum(${numericRef}) as ${aliasSql}`
  return `avg(${numericRef}) as ${aliasSql}`
}

function compileProjection(
  backend: StorageBackend,
  selected: string[],
  columns: DataColumnDef[],
  tableAlias?: string,
): string {
  if (selected.length === 0) {
    return backend === 'parquet' ? (tableAlias ? `${quoteIdent(tableAlias)}.*` : '*') : 'row_data'
  }
  return selected
    .map((name) => {
      const col = resolveColumn(columns, name)
      return `${columnRef(backend, name, col.type, tableAlias)} as ${quoteIdent(name)}`
    })
    .join(', ')
}

function defaultParquetPath(table: CompiledTableMeta): string {
  return `s3://dimes-bi/orgs/${table.organizationId}/tables/${table.id}/data/*.parquet`
}

function pushParquetPath(table: CompiledTableMeta, params: ParamAccumulator): string {
  const pattern = table.parquetPathPattern ?? defaultParquetPath(table)
  const rendered = pattern.replace('{org}', table.organizationId).replace('{id}', table.id)
  const ph = params.next()
  params.values.push(rendered)
  return `read_parquet(${ph})`
}

function joinAliasName(join: QueryJoin, rightName?: string): string {
  return slugAlias(join.alias || rightName || 'joined') || 'joined'
}

function resolvePrefixedColumn(
  backend: StorageBackend,
  name: string,
  primary: CompiledTableMeta,
  primaryAlias: string,
  joins: QueryJoin[],
  joinedTables: CompiledTableMeta[],
): string {
  const m = /^([a-z0-9_]+)__(.+)$/i.exec(name)
  if (m) {
    const [, alias, col] = m
    const right = joinedTables.find((t) => {
      const j = joins.find((jn) => jn.tableId === t.id)
      return j ? joinAliasName(j, t.name) === alias : false
    })
    const colDef = right ? resolveColumn(right.columns, col) : { name: col, type: 'string' as const }
    return columnRef(backend, col, colDef.type, alias)
  }
  return columnRef(backend, name, resolveColumn(primary.columns, name).type, primaryAlias)
}

export function compileQuery(
  table: CompiledTableMeta,
  query: QueryDefinition,
  joinedTables: CompiledTableMeta[] = [],
): CompiledQuery {
  const params = makeParamAccumulator()
  const backend = table.storageBackend
  const filters = query.filters ?? []
  const groupBy = query.groupBy ?? []
  const aggregations = query.aggregations ?? []
  const selectedColumns = query.selectedColumns ?? []
  const grains = query.groupByGrains ?? {}
  const joins = query.joins ?? []

  if (backend === 'jsonb' && joins.length > 0) {
    throw new Error('compileQuery: jsonb joins must use the JS query engine')
  }

  const parquetTableIds = [table.id, ...joins.map((j) => j.tableId)]
  const where: string[] = []
  let fromSql = ''
  let primaryAlias: string | undefined

  if (backend === 'parquet') {
    primaryAlias = 't0'
    fromSql = `from ${pushParquetPath(table, params)} as ${quoteIdent(primaryAlias)}`
    for (const join of joins) {
      const right = joinedTables.find((t) => t.id === join.tableId)
      if (!right) throw new Error(`Joined table metadata missing: ${join.tableId}`)
      const alias = joinAliasName(join, right.name)
      const joinKw = join.type === 'inner' ? 'inner join' : 'left join'
      fromSql += `\n${joinKw} ${pushParquetPath(right, params)} as ${quoteIdent(alias)}`
      fromSql += `\n  on ${quoteIdent(primaryAlias)}.${quoteIdent(join.leftColumn)} = ${quoteIdent(alias)}.${quoteIdent(join.rightColumn)}`
    }
  } else {
    const orgPh = params.next()
    params.values.push(table.organizationId)
    const tablePh = params.next()
    params.values.push(table.id)
    where.push(`organization_id = ${orgPh}`)
    where.push(`data_table_id = ${tablePh}`)
    fromSql = 'from public.data_table_rows'
  }

  for (const f of filters) {
    let cond: string | null
    if (backend === 'parquet' && primaryAlias) {
      if (f.column.includes('__')) {
        const left = resolvePrefixedColumn(backend, f.column, table, primaryAlias, joins, joinedTables)
        const col = resolveColumn(
          joinedTables.flatMap((t) => t.columns).concat(table.columns),
          f.column.includes('__') ? f.column.split('__')[1] : f.column,
        )
        if (f.operator === 'contains') {
          const ph = params.next()
          params.values.push('%' + f.value + '%')
          cond = `${left} ilike ${ph}`
        } else {
          const ph = params.next()
          const value = coerceParamValue(f.value, col.type)
          if (value === null) cond = f.operator === 'eq' ? 'false' : 'true'
          else {
            params.values.push(value)
            if (f.operator === 'eq' || f.operator === 'neq') {
              cond = `${left} ${f.operator === 'eq' ? '=' : '<>'} ${typedParamRef(ph, col.type)}`
            } else {
              cond = `${left} ${COMPARISON_OPS[f.operator]} ${typedParamRef(ph, col.type)}`
            }
          }
        }
      } else {
        cond = compileFilter(backend, f, table.columns, params, primaryAlias)
      }
    } else {
      cond = compileFilter(backend, f, table.columns, params)
    }
    if (cond) where.push(cond)
  }

  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  const selectParts: string[] = []
  const resultColumns: string[] = []

  if (aggregations.length > 0) {
    for (const g of groupBy) {
      const grain = grains[g]
      const outName = groupByResultColumn(g, grain)
      resultColumns.push(outName)
      const baseRef =
        backend === 'parquet' && primaryAlias
          ? columnRef(backend, g, resolveColumn(table.columns, g).type, primaryAlias)
          : columnRef(backend, g, resolveColumn(table.columns, g).type)
      if (grain) {
        selectParts.push(`${sqlDateGrainExpr(baseRef, grain)} as ${quoteIdent(outName)}`)
      } else {
        selectParts.push(`${baseRef} as ${quoteIdent(outName)}`)
      }
    }
    for (const a of aggregations) {
      const alias =
        slugAlias(a.alias?.trim() || `${a.operator}_${a.column || 'all'}`) || `${a.operator}_all`
      resultColumns.push(alias)
      if (backend === 'parquet' && primaryAlias && a.column.includes('__')) {
        const left = resolvePrefixedColumn(backend, a.column, table, primaryAlias, joins, joinedTables)
        const aliasSql = quoteIdent(alias)
        if (a.operator === 'count') selectParts.push(`count(${left}) as ${aliasSql}`)
        else if (a.operator === 'sum') selectParts.push(`sum((${left})::numeric) as ${aliasSql}`)
        else selectParts.push(`avg((${left})::numeric) as ${aliasSql}`)
      } else {
        selectParts.push(compileAggregation(backend, { ...a, alias }, table.columns, primaryAlias))
      }
    }
  } else if (backend === 'parquet' && primaryAlias && joins.length > 0 && selectedColumns.length === 0) {
    for (const c of table.columns) {
      selectParts.push(
        `${columnRef(backend, c.name, c.type, primaryAlias)} as ${quoteIdent(c.name)}`,
      )
      resultColumns.push(c.name)
    }
    for (const join of joins) {
      const right = joinedTables.find((t) => t.id === join.tableId)
      if (!right) continue
      const alias = joinAliasName(join, right.name)
      for (const c of right.columns) {
        const out = `${alias}__${c.name}`
        selectParts.push(`${columnRef(backend, c.name, c.type, alias)} as ${quoteIdent(out)}`)
        resultColumns.push(out)
      }
    }
  } else {
    selectParts.push(compileProjection(backend, selectedColumns, table.columns, primaryAlias))
    if (selectedColumns.length) resultColumns.push(...selectedColumns)
  }

  const groupBySql =
    aggregations.length > 0 && groupBy.length > 0
      ? `group by ${groupBy.map((g) => quoteIdent(groupByResultColumn(g, grains[g]))).join(', ')}`
      : ''

  const innerSql = [`select ${selectParts.join(', ')}`, fromSql, whereSql, groupBySql]
    .filter((s) => s.length > 0)
    .join('\n')

  const computed = query.computedFields ?? []
  const sort = query.sort ?? []
  const limit = query.limit

  if (computed.length === 0 && sort.length === 0 && (limit == null || limit < 0)) {
    return { sql: innerSql, params: params.values, backend, parquetTableIds }
  }

  const outerSelect = ['inner_q.*']
  for (const c of computed) {
    const alias = slugAlias(c.alias.trim()) || c.alias.trim()
    if (!alias) continue
    outerSelect.push(`(${formulaToSql(c.expression, resultColumns)}) as ${quoteIdent(alias)}`)
  }

  let sql = `select ${outerSelect.join(', ')}\nfrom (\n${innerSql}\n) as inner_q`
  if (sort.length > 0) {
    sql +=
      '\norder by ' +
      sort.map((s) => `${quoteIdent(s.column)} ${s.direction === 'desc' ? 'desc' : 'asc'}`).join(', ')
  }
  if (limit != null && limit >= 0) {
    sql += `\nlimit ${Math.floor(limit)}`
  }

  return { sql, params: params.values, backend, parquetTableIds }
}

