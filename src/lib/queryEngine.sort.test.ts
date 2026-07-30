import { describe, expect, it } from 'vitest'
import { applySortAndLimit, runQueryDefinition } from '#/lib/queryEngine'
import type { DataTable, QueryDefinition } from '#/types/data'

const table: DataTable = {
  id: 't1',
  name: 'HH',
  columns: [
    { name: 'district', type: 'string' },
    { name: 'beneficiaries', type: 'number' },
  ],
  rows: [
    { district: 'North', beneficiaries: 10 },
    { district: 'South', beneficiaries: 30 },
    { district: 'East', beneficiaries: 20 },
  ],
}

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'Test',
    tableId: 't1',
    selectedColumns: ['district', 'beneficiaries'],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('applySortAndLimit', () => {
  it('sorts ascending by numeric column', () => {
    const rows = applySortAndLimit(
      [
        { district: 'South', beneficiaries: 30 },
        { district: 'North', beneficiaries: 10 },
      ],
      [{ column: 'beneficiaries', direction: 'asc' }],
      null,
    )
    expect(rows.map((r) => r.beneficiaries)).toEqual([10, 30])
  })

  it('applies limit after sort', () => {
    const rows = applySortAndLimit(
      table.rows,
      [{ column: 'beneficiaries', direction: 'desc' }],
      2,
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].beneficiaries).toBe(30)
  })
})

describe('runQueryDefinition sort/limit', () => {
  it('returns top-N districts by sum', () => {
    const rows = runQueryDefinition(
      table,
      q({
        groupBy: ['district'],
        aggregations: [
          { id: 'a1', operator: 'sum', column: 'beneficiaries', alias: 'sum_beneficiaries' },
        ],
        sort: [{ column: 'sum_beneficiaries', direction: 'desc' }],
        limit: 2,
      }),
    )
    expect(rows).toHaveLength(2)
    expect(rows[0].sum_beneficiaries).toBe(30)
  })

  it('exposes multiple aggregation aliases in one result row', () => {
    const rows = runQueryDefinition(
      table,
      q({
        aggregations: [
          { id: 'a1', operator: 'sum', column: 'beneficiaries', alias: 'sum_beneficiaries' },
          { id: 'a2', operator: 'avg', column: 'beneficiaries', alias: 'avg_beneficiaries' },
          { id: 'a3', operator: 'count', column: 'district', alias: 'count_district' },
        ],
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      sum_beneficiaries: 60,
      count_district: 3,
    })
    expect(rows[0].avg_beneficiaries).toBe(20)
  })
})
