import { defaultAggregationAlias } from '#/lib/aggregationRules'
import type { AggregationOperator, DataColumnDef, QueryAggregation, QueryDefinition } from '#/types/data'

export type InsightChartType = 'column' | 'line' | 'area' | 'pie' | 'scatter' | 'bar'

export type InsightMeasure = {
  operator: AggregationOperator
  column: string
}

export type InsightState = {
  chartType: InsightChartType
  breakDownBy: string | null
  measure: InsightMeasure | null
  seriesBy: string | null
}

export const INSIGHT_CHART_TYPES: { value: InsightChartType; label: string }[] = [
  { value: 'column', label: 'Column' },
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
]

export function insightFromQuery(
  query: QueryDefinition,
  chartType: InsightChartType = 'column',
): InsightState {
  const agg = query.aggregations?.[0]
  return {
    chartType,
    breakDownBy: query.groupBy?.[0] ?? null,
    measure: agg
      ? { operator: agg.operator, column: agg.column }
      : null,
    seriesBy: query.groupBy?.[1] ?? null,
  }
}

/** Rewrite query shape from Insight choices (groupBy + single aggregation). */
export function queryPatchFromInsight(
  insight: InsightState,
  columns: DataColumnDef[],
  existingAggregations: QueryAggregation[],
): Partial<QueryDefinition> {
  const groupBy = [insight.breakDownBy, insight.seriesBy].filter(
    (value): value is string => Boolean(value),
  )

  const selected = new Set<string>(groupBy)
  if (insight.measure?.column) selected.add(insight.measure.column)
  if (selected.size === 0) {
    for (const col of columns.slice(0, 2)) selected.add(col.name)
  }

  let aggregations: QueryAggregation[] = []
  if (insight.measure) {
    const existing = existingAggregations[0]
    const alias = defaultAggregationAlias(insight.measure.operator, insight.measure.column)
    aggregations = [
      {
        id: existing?.id ?? `agg-${crypto.randomUUID().slice(0, 8)}`,
        operator: insight.measure.operator,
        column: insight.measure.column,
        alias,
      },
    ]
  }

  return {
    selectedColumns: Array.from(selected),
    groupBy,
    aggregations,
  }
}

export function measureAlias(insight: InsightState): string | null {
  if (!insight.measure) return null
  return defaultAggregationAlias(insight.measure.operator, insight.measure.column)
}

/** Redash chart options driven by Insight (also updates query result column names). */
export function chartOptionsFromInsight(insight: InsightState): Record<string, unknown> {
  const yAlias = measureAlias(insight)
  const columnMapping: Record<string, string> = {}
  if (insight.breakDownBy) columnMapping[insight.breakDownBy] = 'x'
  if (yAlias) columnMapping[yAlias] = 'y'
  if (insight.seriesBy) columnMapping[insight.seriesBy] = 'series'

  const globalSeriesType = insight.chartType === 'bar' ? 'column' : insight.chartType

  return {
    globalSeriesType,
    columnMapping,
    ...(insight.chartType === 'bar' ? { swappedAxes: true } : { swappedAxes: false }),
  }
}

export function chartTypeFromOptions(options: Record<string, unknown> | undefined): InsightChartType {
  const type = String(options?.globalSeriesType ?? 'column')
  if (options?.swappedAxes === true && type === 'column') return 'bar'
  if (type === 'line' || type === 'area' || type === 'pie' || type === 'scatter' || type === 'column') {
    return type
  }
  return 'column'
}
