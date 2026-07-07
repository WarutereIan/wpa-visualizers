import { describe, expect, it } from 'vitest'
import { evaluateAlertCondition } from './alertRules'

describe('evaluateAlertCondition', () => {
  it('fires when current is below threshold', () => {
    expect(evaluateAlertCondition({ op: 'lt', threshold: 50 }, 40, 100)).toBe(true)
    expect(evaluateAlertCondition({ op: 'lt', threshold: 50 }, 60, 100)).toBe(false)
  })

  it('supports percent_of_target unit', () => {
    expect(evaluateAlertCondition({ op: 'lt', threshold: 80, unit: 'percent_of_target' }, 70, 100)).toBe(true)
    expect(evaluateAlertCondition({ op: 'lt', threshold: 80, unit: 'percent_of_target' }, 85, 100)).toBe(false)
  })

  it('defaults to lt when op omitted', () => {
    expect(evaluateAlertCondition({ threshold: 10 }, 5, null)).toBe(true)
  })
})
