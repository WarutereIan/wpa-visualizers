export type DataColumnType = 'string' | 'number' | 'boolean'

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
}

export type AggregationOperator = 'sum' | 'count' | 'avg'

export interface QueryAggregation {
  id: string
  operator: AggregationOperator
  column: string
  alias: string
}

export interface QueryDefinition {
  id: string
  name: string
  tableId: string
  selectedColumns: string[]
  filters: DataFilter[]
  groupBy: string[]
  aggregations: QueryAggregation[]
  createdAt: string
  updatedAt: string
}

export type DataPrimitive = string | number | boolean | null
export type DataRow = Record<string, DataPrimitive>
