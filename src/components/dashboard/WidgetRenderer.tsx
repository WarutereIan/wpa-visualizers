import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { WidgetConfig, WidgetType } from '#/types/dashboard'
import {
  useDatasetRows,
  useDemoDataset,
  type DemoRow,
} from '#/hooks/useDemoDataset'
import { buildEChartsOption, type EChartsWidgetKind } from '#/lib/echartsWidgetOptions'
import { widgetNeedsDataSource } from '#/lib/widgetMeta'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { groupByResultColumn } from '#/lib/dateGrain'
import { KpiWidget } from '#/components/dashboard/widgets/KpiWidget'
import { TableWidget } from '#/components/dashboard/widgets/TableWidget'
import { ComposedChartWidget } from '#/components/dashboard/widgets/ComposedChartWidget'
import { TextBoxWidget } from '#/components/dashboard/widgets/TextBoxWidget'

const ECHARTS_MAP: Partial<Record<WidgetType, EChartsWidgetKind>> = {
  bar: 'bar',
  stacked_bar: 'stacked_bar',
  horizontal_bar: 'horizontal_bar',
  radar: 'radar',
  line: 'line',
  area: 'area',
  stacked_area: 'stacked_area',
  pie: 'pie',
  donut: 'donut',
  sunburst: 'sunburst',
  treemap: 'treemap',
  funnel: 'funnel',
  scatter: 'scatter',
  bubble: 'bubble',
  heatmap: 'heatmap',
  sankey: 'sankey',
  graph: 'graph',
  boxplot: 'boxplot',
  candlestick: 'candlestick',
  histogram: 'histogram',
  gauge: 'gauge',
  waterfall: 'waterfall',
}

function EChartsViz({
  kind,
  title,
  rows,
  paletteId,
}: {
  kind: EChartsWidgetKind
  title: string
  rows: DemoRow[]
  paletteId?: string
}) {
  const option = useMemo(
    () => buildEChartsOption(kind, title, rows, paletteId),
    [kind, title, rows, paletteId],
  )
  return (
    <div className="h-full min-h-[200px] rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-2 shadow-sm">
      <ReactECharts option={option} style={{ height: '100%', minHeight: 200 }} />
    </div>
  )
}

export function WidgetRenderer({
  config,
  readOnly,
  paletteId,
}: {
  config: WidgetConfig
  readOnly?: boolean
  /** Dashboard-level theme palette (applies to all chart widgets). */
  paletteId?: string
}) {
  const indicatorId = config.options?.indicatorId as string | undefined
  const needsQuery =
    widgetNeedsDataSource(config.type) && !(config.type === 'kpi' && indicatorId)

  const { queries } = useWorkspaceData()
  const boundQuery = config.dataSourceId
    ? queries.find((q) => q.id === config.dataSourceId)
    : undefined
  const grainHint = boundQuery
    ? (boundQuery.groupBy ?? [])
        .map((c) => {
          const g = boundQuery.groupByGrains?.[c]
          return g ? groupByResultColumn(c, g) : c
        })
        .join(', ') || undefined
    : undefined

  const chartQuery = useDemoDataset(config.dataSourceId, config.bindings)
  const tableQuery = useDatasetRows(config.dataSourceId)
  const isTable = config.type === 'table'
  const isKpi = config.type === 'kpi'
  const isText = config.type === 'text'
  const isLoading = isText
    ? false
    : isTable || isKpi
      ? tableQuery.isLoading
      : chartQuery.isLoading
  const error = isText ? null : isTable || isKpi ? tableQuery.error : chartQuery.error

  if (isText) {
    return (
      <TextBoxWidget
        title={config.title}
        body={typeof config.options?.body === 'string' ? config.options.body : ''}
        align={
          config.options?.align === 'center' || config.options?.align === 'right'
            ? config.options.align
            : 'left'
        }
        size={
          config.options?.size === 'sm' || config.options?.size === 'lg'
            ? config.options.size
            : 'md'
        }
      />
    )
  }

  if (needsQuery && !config.dataSourceId) {
    return (
      <div className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-3 text-center text-sm text-[var(--sea-ink-soft)]">
        Select or create a query
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--sea-ink-soft)]">
        Loading…
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">
        Failed to load data
      </div>
    )
  }

  const chartRows = (chartQuery.data ?? []) as DemoRow[]
  const rawRows = (tableQuery.data ?? []) as Record<string, string | number | boolean | null>[]
  const { title, type } = config

  if (type === 'kpi') {
    const measureKey = config.bindings?.yKey ?? config.bindings?.measureKey
    return (
      <KpiWidget
        title={title}
        rows={rawRows}
        measureKey={measureKey}
        indicatorId={indicatorId}
        readOnly={readOnly}
        queryName={boundQuery?.name}
        grainHint={grainHint}
      />
    )
  }
  if (type === 'table') return <TableWidget title={title} rows={rawRows} />
  if (type === 'composed') {
    return <ComposedChartWidget title={title} rows={chartRows} paletteId={paletteId} />
  }

  const eKind = ECHARTS_MAP[type]
  if (eKind) {
    return <EChartsViz kind={eKind} title={title} rows={chartRows} paletteId={paletteId} />
  }

  return <div className="p-2 text-sm text-[var(--sea-ink-soft)]">Unknown widget type: {type}</div>
}
