import type { DashboardDefinition, WidgetConfig } from '#/types/dashboard'
import type { RedashVisualizationType, WidgetPosition } from '#/types/visualization'

export interface MigrationPlanItem {
  widgetId: string
  action: 'visualization' | 'textbox' | 'skip'
  vizType?: RedashVisualizationType
  vizOptions?: Record<string, unknown>
  downgraded: boolean // true when the legacy type has no Redash equivalent
  reason?: string // e.g. "radar → CHART(column)"
  position: WidgetPosition
  queryId?: string
  text?: string
}

function halfGrid(n: number): number {
  return Math.round(n / 2)
}

function positionFromLayout(
  dashboard: DashboardDefinition,
  widgetId: string,
): WidgetPosition {
  const item = dashboard.layout.find((entry) => entry.i === widgetId)
  const x = item?.x ?? 0
  const y = item?.y ?? 0
  const w = item?.w ?? 2
  const h = item?.h ?? 1
  return {
    col: halfGrid(x),
    row: y,
    sizeX: Math.max(1, halfGrid(w)),
    sizeY: h,
  }
}

function columnMapping(bindings: Record<string, string> | undefined): Record<string, string> {
  const mapping: Record<string, string> = {}
  if (bindings?.xKey) mapping[bindings.xKey] = 'x'
  if (bindings?.yKey) mapping[bindings.yKey] = 'y'
  if (bindings?.sizeKey) mapping[bindings.sizeKey] = 'size'
  return mapping
}

function chartOptions(
  globalSeriesType: string,
  bindings: Record<string, string> | undefined,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const mapping = columnMapping(bindings)
  return {
    globalSeriesType,
    ...extra,
    ...(Object.keys(mapping).length > 0 ? { columnMapping: mapping } : {}),
  }
}

function mapLegacyType(widget: WidgetConfig): Omit<MigrationPlanItem, 'widgetId' | 'position' | 'queryId'> {
  const bindings = widget.bindings ?? {}

  switch (widget.type) {
    case 'text':
      return {
        action: 'textbox',
        downgraded: false,
        text: typeof widget.options?.body === 'string' ? widget.options.body : '',
      }
    case 'table':
      return { action: 'visualization', vizType: 'TABLE', vizOptions: {}, downgraded: false }
    case 'kpi': {
      const counterColName = bindings.valueKey ?? bindings.yKey ?? bindings.measureKey
      return {
        action: 'visualization',
        vizType: 'COUNTER',
        vizOptions: {
          ...(counterColName ? { counterColName } : {}),
          rowNumber: 1,
        },
        downgraded: false,
      }
    }
    case 'bar':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('column', bindings),
        downgraded: false,
      }
    case 'histogram':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('histogram', bindings),
        downgraded: false,
      }
    case 'stacked_bar':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('column', bindings, { series: { stacking: 'stack' } }),
        downgraded: false,
      }
    case 'horizontal_bar':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('column', bindings, { swappedAxes: true }),
        downgraded: false,
      }
    case 'line':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('line', bindings),
        downgraded: false,
      }
    case 'area':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('area', bindings),
        downgraded: false,
      }
    case 'stacked_area':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('area', bindings, { series: { stacking: 'stack' } }),
        downgraded: false,
      }
    case 'pie':
    case 'donut':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('pie', bindings),
        downgraded: false,
      }
    case 'scatter':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('scatter', bindings),
        downgraded: false,
      }
    case 'bubble':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions(
          'scatter',
          bindings,
          bindings.sizeKey ? { sizemode: 'diameter' } : {},
        ),
        downgraded: true,
        reason: 'bubble → CHART(scatter)',
      }
    case 'heatmap':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('heatmap', bindings),
        downgraded: false,
      }
    case 'funnel':
      return { action: 'visualization', vizType: 'FUNNEL', vizOptions: {}, downgraded: false }
    case 'sankey':
      return { action: 'visualization', vizType: 'SANKEY', vizOptions: {}, downgraded: false }
    case 'sunburst':
      return {
        action: 'visualization',
        vizType: 'SUNBURST_SEQUENCE',
        vizOptions: {},
        downgraded: false,
      }
    case 'boxplot':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('box', bindings),
        downgraded: true,
        reason: 'boxplot → CHART(box)',
      }
    case 'radar':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('radar', bindings),
        downgraded: false,
      }
    case 'waterfall':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('waterfall', bindings),
        downgraded: false,
      }
    case 'treemap':
      return { action: 'visualization', vizType: 'TREEMAP', vizOptions: {}, downgraded: false }
    case 'gauge':
      return { action: 'visualization', vizType: 'GAUGE', vizOptions: {}, downgraded: false }
    case 'graph':
    case 'candlestick':
    case 'composed':
      return {
        action: 'visualization',
        vizType: 'CHART',
        vizOptions: chartOptions('column', bindings),
        downgraded: true,
        reason: `${widget.type} → CHART(column)`,
      }
  }
}

export function planWidgetMigration(dashboard: DashboardDefinition): MigrationPlanItem[] {
  return Object.values(dashboard.widgets).map((widget) => {
    const mapped = mapLegacyType(widget)
    const position = positionFromLayout(dashboard, widget.id)
    if (mapped.action === 'visualization' && !widget.dataSourceId) {
      return {
        widgetId: widget.id,
        action: 'skip' as const,
        vizType: mapped.vizType,
        vizOptions: mapped.vizOptions,
        downgraded: mapped.downgraded,
        reason: mapped.reason ? `${mapped.reason}; no dataSourceId` : 'no dataSourceId',
        position,
      }
    }
    return {
      widgetId: widget.id,
      ...mapped,
      position,
      ...(widget.dataSourceId ? { queryId: widget.dataSourceId } : {}),
    }
  })
}
