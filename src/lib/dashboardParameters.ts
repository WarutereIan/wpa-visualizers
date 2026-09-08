import { usedParameters, type ParameterValues } from '#/lib/queryParameters'
import type { QueryDefinition } from '#/types/data'
import type { DashboardWidget, QueryParameter, VisualizationDefinition } from '#/types/visualization'

/**
 * Dashboard-level params across widgets.
 * For each widget → query usedParameters → mappings type==='dashboard-level'
 * → group by mapTo; first occurrence's definition wins (title/type/default).
 * Returned `name` is the dashboard `mapTo` key.
 */
export function collectDashboardParameters(
  widgets: DashboardWidget[],
  visualizations: VisualizationDefinition[],
  queries: QueryDefinition[],
): QueryParameter[] {
  const vizById = new Map(visualizations.map((item) => [item.id, item]))
  const queryById = new Map(queries.map((item) => [item.id, item]))
  const seen = new Map<string, QueryParameter>()

  for (const widget of widgets) {
    if (!widget.visualizationId) continue
    const visualization = vizById.get(widget.visualizationId)
    if (!visualization) continue
    const query = queryById.get(visualization.queryId)
    if (!query) continue

    const mappings = widget.options.parameterMappings
    for (const param of usedParameters(query)) {
      const mapping = mappings?.[param.name]
      if (mapping?.type !== 'dashboard-level') continue
      const key = mapping.mapTo
      if (!key || seen.has(key)) continue
      seen.set(key, { ...param, name: key })
    }
  }

  return [...seen.values()]
}

export function defaultParameterValues(parameters: QueryParameter[]): ParameterValues {
  const values: ParameterValues = {}
  for (const param of parameters) {
    values[param.name] = param.default ?? null
  }
  return values
}
