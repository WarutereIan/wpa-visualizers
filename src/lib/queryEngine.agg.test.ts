import { describe, expect, it } from 'vitest'
import { runQueryDefinition } from '#/lib/queryEngine'
import type { DataTable, QueryDefinition } from '#/types/data'

const table: DataTable = {
  id: 't1',
  name: 'Survey',
  columns: [
    { name: 'Response ID', type: 'string' },
    { name: 'How many volts', type: 'number' },
  ],
  rows: [
    { 'Response ID': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'How many volts': 12 },
    { 'Response ID': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'How many volts': 8 },
  ],
}

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'Test',
    tableId: 't1',
    selectedColumns: [],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('runQueryDefinition type-safe aggregations', () => {
  it('rejects SUM on a string/uuid column', () => {
    expect(() =>
      runQueryDefinition(
        table,
        q({
          aggregations: [
            { id: 'a1', operator: 'sum', column: 'Response ID', alias: 'sum_response_id' },
          ],
        }),
      ),
    ).toThrow(/requires a number column/)
  })

  it('sums a number column with slug alias', () => {
    const rows = runQueryDefinition(
      table,
      q({
        aggregations: [
          { id: 'a1', operator: 'sum', column: 'How many volts', alias: 'sum_How many volts' },
        ],
      }),
    )
    expect(rows).toEqual([{ sum_how_many_volts: 20 }])
  })
})
