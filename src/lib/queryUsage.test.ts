import { describe, expect, it } from 'vitest'
import {
  findQueryUsages,
  formatQueryUsageSummary,
  suggestWidgetQueryName,
} from '#/lib/queryUsage'
import type { DashboardDefinition } from '#/types/dashboard'
import type { DashboardWidget, VisualizationDefinition } from '#/types/visualization'

function dash(partial: Partial<DashboardDefinition> & Pick<DashboardDefinition, 'id' | 'name' | 'widgets'>): DashboardDefinition {
  return {
    createdAt: '',
    updatedAt: '',
    layout: [],
    ...partial,
  }
}

function viz(partial: Pick<VisualizationDefinition, 'id' | 'queryId' | 'name'>): VisualizationDefinition {
  return {
    type: 'CHART',
    options: {},
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

function widget(partial: Pick<DashboardWidget, 'id' | 'dashboardId' | 'visualizationId'> & { text?: string | null }): DashboardWidget {
  return {
    text: partial.text ?? null,
    options: { position: { col: 0, row: 0, sizeX: 3, sizeY: 8 } },
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('queryUsage', () => {
  it('finds legacy jsonb widgets that reference a query', () => {
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

  it('finds new-model dashboard_widgets via visualizations on the query', () => {
    const usages = findQueryUsages(
      [dash({ id: 'd1', name: 'Ops', widgets: {} })],
      'q1',
      {
        visualizations: [
          viz({ id: 'v1', queryId: 'q1', name: 'Coverage chart' }),
          viz({ id: 'v2', queryId: 'q2', name: 'Other chart' }),
        ],
        widgets: [
          widget({ id: 'w1', dashboardId: 'd1', visualizationId: 'v1' }),
          widget({ id: 'w2', dashboardId: 'd1', visualizationId: 'v2' }),
        ],
      },
    )
    expect(usages).toEqual([
      {
        dashboardId: 'd1',
        dashboardName: 'Ops',
        widgetId: 'w1',
        widgetTitle: 'Coverage chart',
      },
    ])
  })

  it('counts visualizations on the query even when no dashboard widget references them', () => {
    const usages = findQueryUsages(
      [dash({ id: 'd1', name: 'Ops', widgets: {} })],
      'q1',
      {
        visualizations: [viz({ id: 'v1', queryId: 'q1', name: 'Table' })],
        widgets: [],
      },
    )
    expect(usages).toHaveLength(1)
    expect(usages[0]).toMatchObject({
      widgetId: 'v1',
      widgetTitle: 'Table',
      dashboardName: 'Query visualizations',
    })
  })

  it('keeps legacy jsonb scan as a fallback alongside the new model', () => {
    const usages = findQueryUsages(
      [
        dash({
          id: 'legacy',
          name: 'Legacy Ops',
          widgets: {
            old: { id: 'old', type: 'bar', title: 'Old coverage', dataSourceId: 'q1' },
          },
        }),
        dash({ id: 'd1', name: 'New Ops', widgets: {} }),
      ],
      'q1',
      {
        visualizations: [viz({ id: 'v1', queryId: 'q1', name: 'New chart' })],
        widgets: [widget({ id: 'w1', dashboardId: 'd1', visualizationId: 'v1' })],
      },
    )
    expect(usages).toHaveLength(2)
    expect(usages.map((u) => u.widgetTitle).sort()).toEqual(['New chart', 'Old coverage'])
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
