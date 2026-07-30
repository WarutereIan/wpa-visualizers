import type { DataColumnType, DataFilterOperator } from '#/types/data'

const STRING_OPS: DataFilterOperator[] = ['eq', 'neq', 'contains']
const NUMBER_OPS: DataFilterOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
const DATE_OPS: DataFilterOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']
const BOOLEAN_OPS: DataFilterOperator[] = ['eq', 'neq']

export function filterOperatorsForColumnType(
  type: DataColumnType | undefined,
): DataFilterOperator[] {
  switch (type) {
    case 'number':
      return [...NUMBER_OPS]
    case 'date':
      return [...DATE_OPS]
    case 'boolean':
      return [...BOOLEAN_OPS]
    case 'string':
    default:
      return [...STRING_OPS]
  }
}

export function isFilterOperatorAllowed(
  operator: DataFilterOperator,
  type: DataColumnType | undefined,
): boolean {
  return filterOperatorsForColumnType(type).includes(operator)
}
