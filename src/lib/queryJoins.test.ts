import { describe, expect, it } from 'vitest'
import { joinTables } from '#/lib/queryJoins'
import { runQueryDefinition } from '#/lib/queryEngine'
import type { DataTable, QueryDefinition } from '#/types/data'

const households: DataTable = {
  id: 'hh',
  name: 'Households',
  columns: [
    { name: 'hh_id', type: 'string' },
    { name: 'district', type: 'string' },
  ],
  rows: [
    { hh_id: '1', district: 'North' },
    { hh_id: '2', district: 'South' },
  ],
}

const visits: DataTable = {
  id: 'vis',
  name: 'Visits',
  columns: [
    { name: 'hh_id', type: 'string' },
    { name: 'score', type: 'number' },
  ],
  rows: [
    { hh_id: '1', score: 10 },
    { hh_id: '1', score: 5 },
  ],
}

describe('joinTables', () => {
  it('inner-joins and prefixes right columns', () => {
    const rows = joinTables(households.rows, visits, {
      type: 'inner',
      leftColumn: 'hh_id',
      rightColumn: 'hh_id',
      alias: 'visits',
    })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      hh_id: '1',
      district: 'North',
      visits__score: 10,
    })
  })

  it('left-joins keep unmatched left rows', () => {
    const rows = joinTables(households.rows, visits, {
      type: 'left',
      leftColumn: 'hh_id',
      rightColumn: 'hh_id',
      alias: 'visits',
    })
    expect(rows.some((r) => r.hh_id === '2' && r.visits__score == null)).toBe(true)
  })
})

describe('joined query pipeline', () => {
  it('aggregates across a join', () => {
    const query: QueryDefinition = {
      id: 'q1',
      name: 'J',
      tableId: 'hh',
      selectedColumns: [],
      filters: [],
      groupBy: ['district'],
      aggregations: [
        { id: 'a1', operator: 'sum', column: 'visits__score', alias: 'sum_score' },
      ],
      joins: [
        {
          id: 'j1',
          tableId: 'vis',
          type: 'inner',
          leftColumn: 'hh_id',
          rightColumn: 'hh_id',
          alias: 'visits',
        },
      ],
      createdAt: '',
      updatedAt: '',
    }
    const rows = runQueryDefinition(households, query, [households, visits])
    expect(rows).toEqual([{ district: 'North', sum_score: 15 }])
  })
})
