import { describe, expect, it } from 'vitest'
import {
  filterOperatorsForColumnType,
  isFilterOperatorAllowed,
} from '#/lib/filterOperators'
import { runQueryDefinition } from '#/lib/queryEngine'
import type { DataTable, QueryDefinition } from '#/types/data'

describe('filterOperatorsForColumnType', () => {
  it('offers contains only for strings', () => {
    expect(filterOperatorsForColumnType('string')).toContain('contains')
    expect(filterOperatorsForColumnType('number')).not.toContain('contains')
    expect(isFilterOperatorAllowed('gt', 'string')).toBe(false)
    expect(isFilterOperatorAllowed('gt', 'number')).toBe(true)
  })

  it('restricts booleans to equality', () => {
    expect(filterOperatorsForColumnType('boolean')).toEqual(['eq', 'neq'])
  })
})

const table: DataTable = {
  id: 't1',
  name: 'T',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'score', type: 'number' },
    { name: 'active', type: 'boolean' },
  ],
  rows: [
    { name: 'Alpha', score: 10, active: true },
    { name: 'Beta', score: 20, active: false },
  ],
}

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'F',
    tableId: 't1',
    selectedColumns: ['name', 'score', 'active'],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('typed filters in runQueryDefinition', () => {
  it('filters strings with contains', () => {
    const rows = runQueryDefinition(
      table,
      q({
        filters: [{ id: 'f1', column: 'name', operator: 'contains', value: 'lp' }],
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Alpha')
  })

  it('filters numbers with gte', () => {
    const rows = runQueryDefinition(
      table,
      q({
        filters: [{ id: 'f1', column: 'score', operator: 'gte', value: '15' }],
      }),
    )
    expect(rows.map((r) => r.name)).toEqual(['Beta'])
  })
})
