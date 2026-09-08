import { describe, expect, it } from 'vitest'
import { planWidgetMigration } from '#/lib/legacyWidgetMigration'
import type { DashboardDefinition, WidgetType } from '#/types/dashboard'

const dash = (widgets: DashboardDefinition['widgets'], layout: DashboardDefinition['layout']): DashboardDefinition => ({
  id: 'd1', name: 'D', createdAt: '', updatedAt: '', layout, widgets,
})

describe('planWidgetMigration', () => {
  it('maps a bar widget to CHART column with bindings', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'bar', title: 'Sales', dataSourceId: 'q1', bindings: { xKey: 'region', yKey: 'total' } } },
      [{ i: 'w1', x: 0, y: 0, w: 6, h: 8 }],
    ))
    expect(plan[0]).toMatchObject({
      action: 'visualization', vizType: 'CHART', downgraded: false, queryId: 'q1',
      position: { col: 0, row: 0, sizeX: 3, sizeY: 8 },
    })
    expect(plan[0].vizOptions).toMatchObject({
      globalSeriesType: 'column',
      columnMapping: { region: 'x', total: 'y' },
    })
  })
  it('maps text widgets to textboxes', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'text', title: 'Note', options: { body: '# hi' } } },
      [{ i: 'w1', x: 6, y: 0, w: 6, h: 4 }],
    ))
    expect(plan[0]).toMatchObject({ action: 'textbox', text: '# hi', position: { col: 3, row: 0, sizeX: 3, sizeY: 4 } })
  })
  it('downgrades radar with a reason', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'radar', title: 'R', dataSourceId: 'q1', bindings: {} } },
      [{ i: 'w1', x: 0, y: 0, w: 4, h: 8 }],
    ))
    expect(plan[0]).toMatchObject({ vizType: 'CHART', downgraded: true })
    expect(plan[0].reason).toContain('radar')
  })
  it('skips widgets without a query', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'bar', title: 'B' } },
      [{ i: 'w1', x: 0, y: 0, w: 4, h: 8 }],
    ))
    expect(plan[0].action).toBe('skip')
  })

  it('encodes the full legacy→Redash type-mapping table', () => {
    const cases: Array<{
      type: WidgetType
      extra?: Partial<DashboardDefinition['widgets'][string]>
      expected: Record<string, unknown>
    }> = [
      { type: 'table', expected: { action: 'visualization', vizType: 'TABLE', vizOptions: {}, downgraded: false } },
      { type: 'kpi', extra: { bindings: { valueKey: 'total' } }, expected: { action: 'visualization', vizType: 'COUNTER', vizOptions: { counterColName: 'total', rowNumber: 1 }, downgraded: false } },
      { type: 'bar', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: false } },
      { type: 'histogram', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: false } },
      { type: 'stacked_bar', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column', series: { stacking: 'stack' } }, downgraded: false } },
      { type: 'horizontal_bar', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column', swappedAxes: true }, downgraded: false } },
      { type: 'line', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'line' }, downgraded: false } },
      { type: 'area', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'area' }, downgraded: false } },
      { type: 'stacked_area', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'area', series: { stacking: 'stack' } }, downgraded: false } },
      { type: 'pie', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'pie' }, downgraded: false } },
      { type: 'donut', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'pie' }, downgraded: false } },
      { type: 'scatter', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'scatter' }, downgraded: false } },
      { type: 'bubble', extra: { bindings: { sizeKey: 'pop' } }, expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'scatter', sizemode: 'diameter' }, downgraded: true, reason: 'bubble → CHART(scatter)' } },
      { type: 'heatmap', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'heatmap' }, downgraded: false } },
      { type: 'funnel', expected: { action: 'visualization', vizType: 'FUNNEL', vizOptions: {}, downgraded: false } },
      { type: 'sankey', expected: { action: 'visualization', vizType: 'SANKEY', vizOptions: {}, downgraded: false } },
      { type: 'sunburst', expected: { action: 'visualization', vizType: 'SUNBURST_SEQUENCE', vizOptions: {}, downgraded: false } },
      { type: 'treemap', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'treemap → CHART(column)' } },
      { type: 'graph', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'graph → CHART(column)' } },
      { type: 'radar', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'radar → CHART(column)' } },
      { type: 'boxplot', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'box' }, downgraded: true, reason: 'boxplot → CHART(box)' } },
      { type: 'candlestick', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'candlestick → CHART(column)' } },
      { type: 'gauge', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'gauge → CHART(column)' } },
      { type: 'waterfall', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'waterfall → CHART(column)' } },
      { type: 'composed', expected: { vizType: 'CHART', vizOptions: { globalSeriesType: 'column' }, downgraded: true, reason: 'composed → CHART(column)' } },
    ]

    for (const { type, extra, expected } of cases) {
      const plan = planWidgetMigration(dash(
        { w1: { id: 'w1', type, title: type, dataSourceId: 'q1', bindings: {}, ...extra } },
        [{ i: 'w1', x: 0, y: 0, w: 4, h: 8 }],
      ))
      expect(plan[0], type).toMatchObject(expected)
    }
  })

  it('halves odd 12-col widths with round and min 1', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'table', title: 'T', dataSourceId: 'q1' } },
      [{ i: 'w1', x: 1, y: 2, w: 1, h: 5 }],
    ))
    expect(plan[0].position).toEqual({ col: 1, row: 2, sizeX: 1, sizeY: 5 })
  })
})
