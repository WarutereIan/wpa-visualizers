import { describe, expect, it } from 'vitest'
import {
  findQueryUsages,
  formatQueryUsageSummary,
  suggestWidgetQueryName,
} from '#/lib/queryUsage'
import type { DashboardDefinition } from '#/types/dashboard'

function dash(partial: Partial<DashboardDefinition> & Pick<DashboardDefinition, 'id' | 'name' | 'widgets'>): DashboardDefinition {
  return {
    createdAt: '',
    updatedAt: '',
    layout: [],
    ...partial,
  }
}

describe('queryUsage', () => {
  it('finds widgets that reference a query', () => {
    const usages = findQueryUsages(
      [
        dash({
          id: 'd1',
          name: 'Ops',
          widgets: {
            w1: { id: 'w1', type: 'bar', title: 'Coverage', dataSourceId: 'q1' },
            w2: { id: 'w2', type: 'kpi', title: 'Other', dataSourceId: 'q2' },
          },
        }),
        dash({
          id: 'd2',
          name: 'MEAL',
          widgets: {
            w3: { id: 'w3', type: 'line', title: 'Trend', dataSourceId: 'q1' },
          },
        }),
      ],
      'q1',
    )
    expect(usages).toHaveLength(2)
    expect(formatQueryUsageSummary(usages)).toContain('2 widgets')
  })

  it('suggests widget query names from title + table', () => {
    expect(
      suggestWidgetQueryName({
        widgetTitle: 'Coverage',
        widgetType: 'bar',
        tableName: 'Households',
      }),
    ).toBe('Coverage · Households')
  })
})
