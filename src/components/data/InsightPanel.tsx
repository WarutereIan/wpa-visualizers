import { useMemo } from 'react'
import { Button } from '#/components/ui/button'
import {
  INSIGHT_CHART_TYPES,
  chartOptionsFromInsight,
  chartTypeFromOptions,
  insightFromQuery,
  queryPatchFromInsight,
  type InsightChartType,
  type InsightState,
} from '#/lib/insightQuery'
import { operatorsForColumnType } from '#/lib/aggregationRules'
import type { AggregationOperator, DataColumnDef, QueryDefinition } from '#/types/data'
import type { VisualizationDefinition } from '#/types/visualization'

export type InsightPanelProps = {
  query: QueryDefinition
  columns: DataColumnDef[]
  visualizations: VisualizationDefinition[]
  onQueryChange: (patch: Partial<QueryDefinition>) => void
  onEnsureChart: (options: Record<string, unknown>, name?: string) => void
  onOpenEditor?: () => void
}

export function InsightPanel({
  query,
  columns,
  visualizations,
  onQueryChange,
  onEnsureChart,
  onOpenEditor,
}: InsightPanelProps) {
  const primaryChart = useMemo(
    () => visualizations.find((v) => v.type === 'CHART') ?? null,
    [visualizations],
  )

  const insight = useMemo(
    () => insightFromQuery(query, chartTypeFromOptions(primaryChart?.options)),
    [query, primaryChart],
  )

  const stringish = columns.filter((c) => c.type === 'string' || c.type === 'date' || c.type === 'boolean')
  const numeric = columns.filter((c) => c.type === 'number')
  const breakDownOptions = stringish.length > 0 ? stringish : columns
  const measureColumns = numeric.length > 0 ? numeric : columns

  const applyInsight = (next: InsightState) => {
    onQueryChange(queryPatchFromInsight(next, columns, query.aggregations ?? []))
    onEnsureChart(chartOptionsFromInsight(next), chartLabel(next.chartType))
  }

  const measureOps: AggregationOperator[] = insight.measure
    ? operatorsForColumnType(columns.find((c) => c.name === insight.measure?.column)?.type)
    : ['count', 'sum', 'avg']

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[var(--sea-ink-soft)]">
        Pick what to break down and measure — we shape the query and chart together.
      </p>

      <div>
        <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="insight-chart-type">
          Chart type
        </label>
        <select
          id="insight-chart-type"
          value={insight.chartType}
          onChange={(e) =>
            applyInsight({ ...insight, chartType: e.target.value as InsightChartType })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
        >
          {INSIGHT_CHART_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="insight-break-down">
          Break down by
        </label>
        <select
          id="insight-break-down"
          value={insight.breakDownBy ?? ''}
          onChange={(e) =>
            applyInsight({
              ...insight,
              breakDownBy: e.target.value || null,
              seriesBy:
                e.target.value && e.target.value === insight.seriesBy ? null : insight.seriesBy,
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
        >
          <option value="">None</option>
          {breakDownOptions.map((col) => (
            <option key={col.name} value={col.name}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr),minmax(0,1.2fr)] gap-2">
        <div>
          <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="insight-op">
            Measure
          </label>
          <select
            id="insight-op"
            value={insight.measure?.operator ?? 'count'}
            onChange={(e) => {
              const operator = e.target.value as AggregationOperator
              const column =
                insight.measure?.column ||
                (operator === 'count' ? columns[0]?.name : measureColumns[0]?.name) ||
                ''
              applyInsight({
                ...insight,
                measure: column ? { operator, column } : null,
              })
            }}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          >
            {measureOps.map((op) => (
              <option key={op} value={op}>
                {op.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="insight-col">
            of column
          </label>
          <select
            id="insight-col"
            value={insight.measure?.column ?? ''}
            onChange={(e) => {
              const column = e.target.value
              if (!column) {
                applyInsight({ ...insight, measure: null })
                return
              }
              const operator = insight.measure?.operator ?? 'count'
              applyInsight({ ...insight, measure: { operator, column } })
            }}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          >
            <option value="">None</option>
            {(insight.measure?.operator === 'count' ? columns : measureColumns).map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="insight-series">
          Split series <span className="font-normal">(optional)</span>
        </label>
        <select
          id="insight-series"
          value={insight.seriesBy ?? ''}
          onChange={(e) =>
            applyInsight({
              ...insight,
              seriesBy: e.target.value || null,
            })
          }
          className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
        >
          <option value="">None</option>
          {breakDownOptions
            .filter((col) => col.name !== insight.breakDownBy)
            .map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
        </select>
      </div>

      {onOpenEditor ? (
        <Button type="button" size="sm" variant="outline" className="w-full" onClick={onOpenEditor}>
          More chart options…
        </Button>
      ) : null}
    </div>
  )
}

function chartLabel(type: InsightChartType): string {
  return INSIGHT_CHART_TYPES.find((entry) => entry.value === type)?.label ?? 'Chart'
}
