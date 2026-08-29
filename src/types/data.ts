import type { QueryParameter } from '#/types/visualization'

export type DataPrimitive = string | number | boolean | null

export type DataRow = Record<string, DataPrimitive>

export type DataColumnType = 'string' | 'number' | 'boolean' | 'date'

export type DateGrain = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface DataColumnDef {
  name: string
  type: DataColumnType
}

export interface DataTable {
  id: string
  name: string
  columns: DataColumnDef[]
  rows: DataRow[]
  storageBackend?: 'jsonb' | 'parquet'
  rowCount?: number
  sourceConnectionId?: string | null
}

export type DataFilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'

export interface DataFilter {
  id: string
  column: string
  operator: DataFilterOperator
  value: string
  /** When set, value is supplied at runtime from this parameter instead of `value`. */
  param?: string
}

export type AggregationOperator = 'sum' | 'count' | 'avg'

export interface QueryAggregation {
  id: string
  operator: AggregationOperator
  column: string
  alias: string
}

export interface QuerySort {
  column: string
  direction: 'asc' | 'desc'
}

export interface QueryDefinition {
  id: string
  name: string
  tableId: string
  selectedColumns: string[]
  filters: DataFilter[]
  groupBy: string[]
  aggregations: QueryAggregation[]
  /** Optional joins onto other imported tables (right columns prefixed alias__). */
  joins?: {
    id: string
    tableId: string
    type: 'inner' | 'left'
    leftColumn: string
    rightColumn: string
    alias?: string
  }[]
  /**
   * Optional date bucketing for group-by columns that are dates.
   * Result column becomes `{column}_{grain}` (e.g. created_at_month).
   */
  groupByGrains?: Partial<Record<string, DateGrain>>
  /** Post-aggregation formulas exposed as named result columns. */
  computedFields?: {
    id: string
    alias: string
    expression: string
  }[]
  /** Optional post-result ordering (result column names). */
  sort?: QuerySort[]
  /** Optional max rows after aggregation/sort. */
  limit?: number | null
  parameters?: QueryParameter[]
  createdAt: string
  updatedAt: string
}

