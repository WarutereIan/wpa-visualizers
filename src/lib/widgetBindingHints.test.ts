import { describe, expect, it } from 'vitest'
import {
  bindingChecklistMessage,
  bindingSlotsForWidget,
  isPrimaryWidgetType,
} from '#/lib/widgetBindingHints'
import { formatQueryUsageLines } from '#/lib/queryUsage'

describe('widgetBindingHints', () => {
  it('marks core chart types as primary', () => {
    expect(isPrimaryWidgetType('kpi')).toBe(true)
    expect(isPrimaryWidgetType('text')).toBe(true)
    expect(isPrimaryWidgetType('sankey')).toBe(false)
  })

  it('requires time + measure for line charts', () => {
    const slots = bindingSlotsForWidget('line')
    expect(slots.map((s) => s.key)).toEqual(['xKey', 'yKey'])
    expect(bindingChecklistMessage('line', true, {})).toMatch(/time|measure/i)
    expect(bindingChecklistMessage('line', true, { xKey: 'month', yKey: 'sum_v' })).toBeNull()
  })

  it('asks for a query when unbound', () => {
    expect(bindingChecklistMessage('bar', false, undefined)).toMatch(/query/i)
  })
})

describe('formatQueryUsageLines', () => {
  it('lists widget titles', () => {
    const lines = formatQueryUsageLines([
      {
        dashboardId: 'd1',
        dashboardName: 'Ops',
        widgetId: 'w1',
        widgetTitle: 'Reach',
      },
    ])
    expect(lines[0]).toContain('Reach')
    expect(lines[0]).toContain('Ops')
  })
})
