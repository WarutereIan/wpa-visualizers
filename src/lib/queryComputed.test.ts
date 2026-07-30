import { describe, expect, it } from 'vitest'
import { applyComputedFields, evaluateComputedExpression } from '#/lib/queryComputed'
import { runQueryDefinition } from '#/lib/queryEngine'
import { queryResultColumns } from '#/lib/queryResultColumns'
import type { DataTable, QueryDefinition } from '#/types/data'

describe('evaluateComputedExpression', () => {
  it('computes ratios from row fields', () => {
    expect(evaluateComputedExpression('sum_reached / sum_target', { sum_reached: 40, sum_target: 80 })).toBe(
      0.5,
    )
  })

  it('supports parentheses and precedence', () => {
    expect(evaluateComputedExpression('(a + b) * c', { a: 1, b: 2, c: 4 })).toBe(12)
  })

  it('rejects unknown columns', () => {
    expect(() => evaluateComputedExpression('foo + 1', { bar: 1 })).toThrow(/Unknown column/)
  })
})

const table: DataTable = {
  id: 't1',
  name: 'T',
  columns: [
    { name: 'reached', type: 'number' },
    { name: 'target', type: 'number' },
  ],
  rows: [
    { reached: 40, target: 80 },
    { reached: 10, target: 20 },
  ],
}

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'C',
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

describe('computed fields in runQueryDefinition', () => {
  it('adds a named ratio after aggregations', () => {
    const query = q({
      aggregations: [
        { id: 'a1', operator: 'sum', column: 'reached', alias: 'sum_reached' },
        { id: 'a2', operator: 'sum', column: 'target', alias: 'sum_target' },
      ],
      computedFields: [
        { id: 'c1', alias: 'completion_rate', expression: 'sum_reached / sum_target' },
      ],
    })
    expect(queryResultColumns(query)).toEqual([
      'sum_reached',
      'sum_target',
      'completion_rate',
    ])
    const rows = runQueryDefinition(table, query)
    expect(rows).toHaveLength(1)
    expect(rows[0].completion_rate).toBe(0.5)
  })
})

describe('applyComputedFields', () => {
  it('slugifies aliases', () => {
    const rows = applyComputedFields([{ a: 2, b: 4 }], [
      { id: 'c1', alias: 'Ratio Value', expression: 'a / b' },
    ])
    expect(rows[0].ratio_value).toBe(0.5)
  })
})
