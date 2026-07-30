import { describe, expect, it } from 'vitest'
import {
  assertAggregationAllowed,
  defaultAggregationAlias,
  isAggregationAllowed,
  operatorsForColumnType,
} from '#/lib/aggregationRules'

describe('aggregationRules', () => {
  it('allows sum/avg only for number columns', () => {
    expect(operatorsForColumnType('number')).toEqual(['sum', 'count', 'avg'])
    expect(operatorsForColumnType('string')).toEqual(['count'])
    expect(isAggregationAllowed('sum', 'string')).toBe(false)
    expect(isAggregationAllowed('count', 'string')).toBe(true)
  })

  it('slugifies default aliases', () => {
    expect(defaultAggregationAlias('sum', 'Response ID')).toBe('sum_response_id')
  })

  it('throws when sum targets a non-number column', () => {
    expect(() =>
      assertAggregationAllowed('sum', 'Response ID', [
        { name: 'Response ID', type: 'string' },
      ]),
    ).toThrow(/requires a number column/)
  })
})
