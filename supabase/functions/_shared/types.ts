export type DataColumnType = 'string' | 'number' | 'boolean' | 'date'

export interface DataColumnDef {
  name: string
  type: DataColumnType
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

export interface QueryParameter {
  name: string
  title: string
  type: string
  default: string | number | null
  enumOptions?: string[]
  queryId?: string
}

export type AggregationOperator = 'sum' | 'count' | 'avg'

export interface QueryAggregation {
  id: string
  operator: AggregationOperator
  column: string
  alias: string
}

export type DateGrain = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface QuerySort {
  column: string
  direction: 'asc' | 'desc'
}

export interface QueryComputedField {
  id: string
  alias: string
  expression: string
}

export interface QueryJoin {
  id: string
  tableId: string
  type: 'inner' | 'left'
  leftColumn: string
  rightColumn: string
  alias?: string
}

export interface QueryDefinition {
  id: string
  name: string
  tableId: string
  selectedColumns: string[]
  filters: DataFilter[]
  groupBy: string[]
  aggregations: QueryAggregation[]
  joins?: QueryJoin[]
  groupByGrains?: Partial<Record<string, DateGrain>>
  computedFields?: QueryComputedField[]
  sort?: QuerySort[]
  limit?: number | null
  parameters?: QueryParameter[]
  createdAt: string
  updatedAt: string
}

export type DataPrimitive = string | number | boolean | null
export type DataRow = Record<string, DataPrimitive>

/** Map a query_definitions row (snake_case) to QueryDefinition. */
export function mapQueryDefinitionFromDb(qrow: Record<string, unknown>): QueryDefinition {
  return {
    id: String(qrow.id),
    name: String(qrow.name ?? ''),
    tableId: String(qrow.table_id),
    selectedColumns: (qrow.selected_columns as string[]) ?? [],
    filters: (qrow.filters as QueryDefinition['filters']) ?? [],
    groupBy: (qrow.group_by as string[]) ?? [],
    aggregations: (qrow.aggregations as QueryDefinition['aggregations']) ?? [],
    joins: (qrow.joins as QueryDefinition['joins']) ?? [],
    groupByGrains: (qrow.group_by_grains as QueryDefinition['groupByGrains']) ?? {},
    computedFields: (qrow.computed_fields as QueryDefinition['computedFields']) ?? [],
    sort: (qrow.sort as QueryDefinition['sort']) ?? [],
    limit: (qrow.row_limit as number | null | undefined) ?? null,
    parameters: (qrow.parameters as QueryDefinition['parameters']) ?? [],
    createdAt: String(qrow.created_at ?? ''),
    updatedAt: String(qrow.updated_at ?? ''),
  }
}
