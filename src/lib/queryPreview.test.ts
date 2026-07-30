import { describe, expect, it } from 'vitest'
import { previewQueryRows } from '#/lib/queryPreview'
import type { DataTable, QueryDefinition } from '#/types/data'

const table: DataTable = {
  id: 't1',
  name: 'Survey',
  columns: [
    { name: 'district', type: 'string' },
    { name: 'volts', type: 'number' },
  ],
  rows: [
    { district: 'A', volts: 10 },
    { district: 'B', volts: 20 },
  ],
}

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'Draft',
    tableId: 't1',
    selectedColumns: ['district', 'volts'],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('previewQueryRows', () => {
  it('returns aggregated shape matching result columns (not raw rows)', () => {
    const draft = q({
      groupBy: ['district'],
      aggregations: [{ id: 'a1', operator: 'sum', column: 'volts', alias: 'sum_volts' }],
    })
    const { rows, error, expectedColumns } = previewQueryRows(table, draft)
    expect(error).toBeNull()
    expect(expectedColumns).toEqual(['district', 'sum_volts'])
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual(['district', 'sum_volts'].sort())
    expect(rows).toHaveLength(2)
  })

  it('surfaces aggregation type errors instead of raw fallback', () => {
    const { rows, error } = previewQueryRows(
      table,
      q({
        aggregations: [
          { id: 'a1', operator: 'sum', column: 'district', alias: 'sum_district' },
        ],
      }),
    )
    expect(rows).toEqual([])
    expect(error).toMatch(/requires a number column/)
  })
})
