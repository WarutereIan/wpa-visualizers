import { describe, expect, it } from 'vitest'
import type { QueryDefinition } from '#/types/data'
import {
  suggestBindings,
  staleBindingKeys,
  pruneStaleBindings,
} from '#/lib/suggestBindings'

function q(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'Q',
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

describe('suggestBindings', () => {
  it('fills dimension + measure from groupBy + agg', () => {
    const query = q({
      groupBy: ['district'],
      aggregations: [{ id: 'a1', operator: 'sum', column: 'volts', alias: 'sum_volts' }],
    })
    expect(suggestBindings('bar', query, {})).toEqual({
      xKey: 'district',
      yKey: 'sum_volts',
    })
  })

  it('does not overwrite existing valid bindings', () => {
    const query = q({
      groupBy: ['district'],
      aggregations: [{ id: 'a1', operator: 'sum', column: 'volts', alias: 'sum_volts' }],
    })
    expect(
      suggestBindings('bar', query, { xKey: 'district', yKey: 'sum_volts' }),
    ).toEqual({ xKey: 'district', yKey: 'sum_volts' })
  })

  it('suggests sole measure for KPI', () => {
    const query = q({
      aggregations: [{ id: 'a1', operator: 'sum', column: 'volts', alias: 'sum_volts' }],
    })
    expect(suggestBindings('kpi', query, {})).toEqual({ yKey: 'sum_volts' })
  })
})

describe('staleBindingKeys', () => {
  it('flags missing columns', () => {
    expect(staleBindingKeys({ xKey: 'a', yKey: 'gone' }, ['a', 'b'])).toEqual(['yKey'])
  })

  it('prunes invalid bindings', () => {
    expect(pruneStaleBindings({ xKey: 'a', yKey: 'gone' }, ['a'])).toEqual({ xKey: 'a' })
  })
})
