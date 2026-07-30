import type { AggregationOperator, DataColumnDef, DataColumnType } from '#/types/data'
import { slugAlias } from '#/lib/slugAlias'

export function operatorsForColumnType(
  type: DataColumnType | undefined,
): AggregationOperator[] {
  if (type === 'number') return ['sum', 'count', 'avg']
  return ['count']
}

export function isAggregationAllowed(
  operator: AggregationOperator,
  columnType: DataColumnType | undefined,
): boolean {
  if (operator === 'count') return true
  return columnType === 'number'
}

export function defaultAggregationAlias(
  operator: AggregationOperator,
  column: string,
): string {
  return slugAlias(`${operator}_${column || 'all'}`)
}

export function firstNumericColumn(columns: DataColumnDef[]): DataColumnDef | undefined {
  return columns.find((c) => c.type === 'number')
}

export function assertAggregationAllowed(
  operator: AggregationOperator,
  column: string,
  columns: DataColumnDef[],
): void {
  if (operator === 'count') return
  const col = columns.find((c) => c.name === column)
  if (!isAggregationAllowed(operator, col?.type)) {
    throw new Error(
      `Aggregation ${operator} requires a number column: ${column || '(none)'}`,
    )
  }
}
