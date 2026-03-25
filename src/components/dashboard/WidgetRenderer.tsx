import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { WidgetConfig, WidgetType } from '#/types/dashboard'
import {
  useDatasetRows,
  useDemoDataset,
  type DemoRow,
} from '#/hooks/useDemoDataset'
import { buildEChartsOption, type EChartsWidgetKind } from '#/lib/echartsWidgetOptions'
import { KpiWidget } from '#/components/dashboard/widgets/KpiWidget'
import { TableWidget } from '#/components/dashboard/widgets/TableWidget'
import { ComposedChartWidget } from '#/components/dashboard/widgets/ComposedChartWidget'

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
 /*  sunburst: 'sunburst',
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
  waterfall: 'waterfall', */
}

function EChartsViz({ kind, title, rows }: { kind: EChartsWidgetKind; title: string; rows: DemoRow[] }) {
  const option = useMemo(() => buildEChartsOption(kind, title, rows), [kind, title, rows])
  return (
    <div className="h-full min-h-[200px] rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-2 shadow-sm">
      <ReactECharts option={option} style={{ height: '100%', minHeight: 200 }} />
    </div>
  )
}

export function WidgetRenderer({
  config,
  readOnly,
}: {
  config: WidgetConfig
  readOnly?: boolean
}) {
  const chartQuery = useDemoDataset(config.dataSourceId, config.bindings)
  const tableQuery = useDatasetRows(config.dataSourceId)
  const isTable = config.type === 'table'
  const data = isTable ? tableQuery.data : chartQuery.data
  const isLoading = isTable ? tableQuery.isLoading : chartQuery.isLoading
  const error = isTable ? tableQuery.error : chartQuery.error

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

  const rows = (data ?? []) as DemoRow[]
  const rawRows = (data ?? []) as Record<string, string | number | boolean | null>[]
  const { title, type } = config

  if (type === 'kpi')      return <KpiWidget title={title} rows={rows} readOnly={readOnly} />
  if (type === 'table')    return <TableWidget title={title} rows={rawRows} />
  if (type === 'composed') return <ComposedChartWidget title={title} rows={rows} />

  const eKind = ECHARTS_MAP[type]
  if (eKind) return <EChartsViz kind={eKind} title={title} rows={rows} />

  return <div className="p-2 text-sm text-[var(--sea-ink-soft)]">Unknown widget type: {type}</div>
}
