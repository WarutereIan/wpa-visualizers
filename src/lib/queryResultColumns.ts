import type { QueryDefinition } from '#/types/data'
import { groupByResultColumn } from '#/lib/dateGrain'
import { slugAlias } from '#/lib/slugAlias'

/**
 * Column names present in rows returned by `runQueryDefinition` / the server
 * query engine for this query shape.
 *
 * - No aggregations → `selectedColumns` (or empty = all columns at runtime;
 *   we still return selectedColumns for the picker).
 * - Aggregations, no groupBy → aggregation aliases only.
 * - Aggregations + groupBy → groupBy columns (with grain suffix) ∪ aggregation aliases.
 */
export function queryResultColumns(query: QueryDefinition): string[] {
  const aggregations = query.aggregations ?? []
  const groupBy = query.groupBy ?? []
  const grains = query.groupByGrains ?? {}
  const selectedColumns = query.selectedColumns ?? []

  if (aggregations.length === 0) {
    return [...selectedColumns]
  }

  const aliases = aggregations.map((agg) => {
    const raw = agg.alias?.trim() || `${agg.operator}_${agg.column || 'all'}`
    return slugAlias(raw) || raw
  })

  if (groupBy.length === 0) {
    const computed = (query.computedFields ?? [])
      .map((f) => slugAlias(f.alias.trim()) || f.alias.trim())
      .filter(Boolean)
    return [...aliases, ...computed]
  }

  const groupCols = groupBy.map((c) => groupByResultColumn(c, grains[c]))
  const computed = (query.computedFields ?? []).map(
    (f) => slugAlias(f.alias.trim()) || f.alias.trim(),
  ).filter(Boolean)
  return [...groupCols, ...aliases, ...computed]
}
