import { describe, expect, it } from 'vitest'
import { toRedashResult } from '#/lib/redashResult'
import type { QueryDefinition } from '#/types/data'

const baseQuery: QueryDefinition = {
  id: 'q1', name: 'q', tableId: 't1',
  selectedColumns: [], filters: [], groupBy: ['region'],
  aggregations: [{ id: 'a1', operator: 'sum', column: 'amount', alias: 'total_amount' }],
  createdAt: '', updatedAt: '',
}
const sourceColumns = [
  { name: 'region', type: 'string' as const },
  { name: 'amount', type: 'number' as const },
]

describe('toRedashResult', () => {
  it('maps group-by + aggregation columns with types and friendly names', () => {
    const res = toRedashResult(
      [{ region: 'North', total_amount: 12 }], baseQuery, sourceColumns)
    expect(res.columns).toEqual([
      { name: 'region', type: 'string', friendly_name: 'Region' },
      { name: 'total_amount', type: 'float', friendly_name: 'Total Amount' },
    ])
    expect(res.rows).toEqual([{ region: 'North', total_amount: 12 }])
  })

  it('count aggregations are integer', () => {
    const q = { ...baseQuery, aggregations: [{ id: 'a', operator: 'count' as const, column: 'id', alias: 'n' }] }
    const res = toRedashResult([{ region: 'North', n: 3 }], q, sourceColumns)
    expect(res.columns.find(c => c.name === 'n')?.type).toBe('integer')
  })

  it('raw select falls back to row keys when no columns selected', () => {
    const q = { ...baseQuery, groupBy: [], aggregations: [] }
    const res = toRedashResult([{ region: 'North', amount: 5 }], q, sourceColumns)
    expect(res.columns.map(c => c.name)).toEqual(['region', 'amount'])
    expect(res.columns[1].type).toBe('float')
  })

  it('grain columns are string typed', () => {
    const q = { ...baseQuery, groupBy: ['created_at'], groupByGrains: { created_at: 'month' as const } }
    const res = toRedashResult([{ created_at_month: '2026-01', total_amount: 1 }], q,
      [...sourceColumns, { name: 'created_at', type: 'date' as const }])
    expect(res.columns[0]).toEqual({ name: 'created_at_month', type: 'string', friendly_name: 'Created At Month' })
  })
})
