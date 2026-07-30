import type { QueryDefinition } from '#/types/data'
import type { WidgetType } from '#/types/dashboard'
import { queryResultColumns } from '#/lib/queryResultColumns'
import { bindingSlotsForWidget } from '#/lib/widgetBindingHints'
import { groupByResultColumn } from '#/lib/dateGrain'
import { slugAlias } from '#/lib/slugAlias'

export type WidgetBindings = { xKey?: string; yKey?: string }

/**
 * Suggest bindings when the query shape is obvious and slots are empty.
 * Does not overwrite existing bindings.
 */
export function suggestBindings(
  type: WidgetType,
  query: QueryDefinition,
  current?: WidgetBindings,
): WidgetBindings {
  const slots = bindingSlotsForWidget(type)
  if (slots.length === 0) return { ...current }

  const resultCols = queryResultColumns(query)
  if (resultCols.length === 0) return { ...current }

  const groupBy = query.groupBy ?? []
  const grains = query.groupByGrains ?? {}
  const aggregations = query.aggregations ?? []

  const dimCandidates = groupBy.map((c) => groupByResultColumn(c, grains[c]))
  const measureCandidates = aggregations.map((agg) => {
    const raw = agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`
    return slugAlias(raw) || raw
  })

  const firstDim =
    dimCandidates.find((c) => resultCols.includes(c)) ??
    resultCols.find((c) => !measureCandidates.includes(c)) ??
    resultCols[0]
  const firstMeasure =
    measureCandidates.find((c) => resultCols.includes(c)) ??
    (resultCols.length > 1 ? resultCols[resultCols.length - 1] : resultCols[0])

  const next: WidgetBindings = { ...current }

  for (const slot of slots) {
    const existing = slot.key === 'xKey' ? current?.xKey : current?.yKey
    if (existing && resultCols.includes(existing)) continue

    if (slot.key === 'yKey') {
      if (type === 'kpi' || type === 'gauge') {
        next.yKey = firstMeasure
      } else if (type === 'scatter' || type === 'bubble') {
        next.yKey = resultCols[1] ?? firstMeasure
      } else {
        next.yKey = firstMeasure
      }
    } else {
      if (type === 'scatter' || type === 'bubble') {
        next.xKey = resultCols[0] ?? firstDim
      } else {
        next.xKey = firstDim
      }
    }
  }

  return next
}

/** Binding keys whose values are missing from the query result schema. */
export function staleBindingKeys(
  bindings: Record<string, string> | undefined,
  resultCols: string[],
): string[] {
  if (!bindings) return []
  const set = new Set(resultCols)
  return Object.entries(bindings)
    .filter(([, col]) => col && !set.has(col))
    .map(([key]) => key)
}

export function hasStaleBindings(
  bindings: Record<string, string> | undefined,
  resultCols: string[],
): boolean {
  return staleBindingKeys(bindings, resultCols).length > 0
}

/** Drop bindings that no longer exist in result columns; keep valid ones. */
export function pruneStaleBindings(
  bindings: Record<string, string> | undefined,
  resultCols: string[],
): Record<string, string> {
  if (!bindings) return {}
  const set = new Set(resultCols)
  const next: Record<string, string> = {}
  for (const [k, v] of Object.entries(bindings)) {
    if (v && set.has(v)) next[k] = v
  }
  return next
}
