import { defaultTableVisualization } from '#/lib/visualizationOrder'
import { DEFAULT_TEXT_SIZE, DEFAULT_VIZ_SIZE, findFreePosition } from '#/lib/widgetGrid'
import type { DashboardWidget, ParameterMapping, QueryParameter, VisualizationDefinition } from '#/types/visualization'

/** Redash default: each used param maps to a dashboard parameter of the same name. */
export function defaultParameterMappings(
  parameters: QueryParameter[],
): Record<string, ParameterMapping> {
  return Object.fromEntries(
    parameters.map((param) => [param.name, { type: 'dashboard-level' as const, mapTo: param.name }]),
  )
}

/** Prefer the query's Table visualization (Redash default), else the first viz. */
export function pickDefaultVisualization(
  visualizations: VisualizationDefinition[],
): VisualizationDefinition | undefined {
  return defaultTableVisualization(visualizations) ?? visualizations[0]
}

export function filterQueriesByName<T extends { name: string }>(queries: T[], search: string): T[] {
  const q = search.trim().toLowerCase()
  if (!q) return queries
  return queries.filter((item) => item.name.toLowerCase().includes(q))
}

export function visualizationWidgetDraft(
  dashboardId: string,
  existingWidgets: DashboardWidget[],
  visualizationId: string,
  parameterMappings: Record<string, ParameterMapping>,
): Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    dashboardId,
    visualizationId,
    text: null,
    options: {
      position: findFreePosition(existingWidgets, DEFAULT_VIZ_SIZE.sizeX, DEFAULT_VIZ_SIZE.sizeY),
      parameterMappings,
    },
  }
}

export function textboxWidgetDraft(
  dashboardId: string,
  existingWidgets: DashboardWidget[],
  text: string,
): Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    dashboardId,
    visualizationId: null,
    text,
    options: {
      position: findFreePosition(existingWidgets, DEFAULT_TEXT_SIZE.sizeX, DEFAULT_TEXT_SIZE.sizeY),
    },
  }
}
