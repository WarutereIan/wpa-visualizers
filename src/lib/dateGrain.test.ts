import { describe, expect, it } from 'vitest'
import { bucketDateValue, groupByResultColumn } from '#/lib/dateGrain'
import { runQueryDefinition } from '#/lib/queryEngine'
import { queryResultColumns } from '#/lib/queryResultColumns'
import type { DataTable, QueryDefinition } from '#/types/data'

describe('bucketDateValue', () => {
  it('buckets to month and year', () => {
    expect(bucketDateValue('2024-03-15', 'month')).toBe('2024-03')
    expect(bucketDateValue('2024-03-15', 'year')).toBe('2024')
    expect(bucketDateValue('2024-03-15', 'quarter')).toBe('2024-Q1')
    expect(bucketDateValue('2024-03-15', 'day')).toBe('2024-03-15')
  })

  it('names result columns with grain suffix', () => {
    expect(groupByResultColumn('created_at', 'month')).toBe('created_at_month')
    expect(groupByResultColumn('created_at')).toBe('created_at')
  })
})

const table: DataTable = {
  id: 't1',
  name: 'Events',
  columns: [
    { name: 'created_at', type: 'date' },
    { name: 'amount', type: 'number' },
  ],
  rows: [
    { created_at: '2024-01-10', amount: 5 },
    { created_at: '2024-01-20', amount: 7 },
    { created_at: '2024-02-01', amount: 3 },
  ],
}

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'Trend',
    tableId: 't1',
    selectedColumns: ['created_at', 'amount'],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('date grain groupBy in engine', () => {
  it('groups by month and sums amount', () => {
    const query = q({
      groupBy: ['created_at'],
      groupByGrains: { created_at: 'month' },
      aggregations: [
        { id: 'a1', operator: 'sum', column: 'amount', alias: 'sum_amount' },
      ],
    })
    expect(queryResultColumns(query)).toEqual(['created_at_month', 'sum_amount'])
    const rows = runQueryDefinition(table, query)
    expect(rows).toHaveLength(2)
    const jan = rows.find((r) => r.created_at_month === '2024-01')
    expect(jan?.sum_amount).toBe(12)
  })
})
