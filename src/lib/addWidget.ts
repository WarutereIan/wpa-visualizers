import { defaultTableVisualization } from '#/lib/visualizationOrder'
import {
  DEFAULT_TEXT_SIZE,
  DEFAULT_VIZ_SIZE,
  GRID_VERSION,
  findFreePosition,
} from '#/lib/widgetGrid'
import type { QueryDefinition } from '#/types/data'
import type {
  DashboardWidget,
  ParameterMapping,
  QueryParameter,
  VisualizationDefinition,
} from '#/types/visualization'

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
      gridVersion: GRID_VERSION,
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
      gridVersion: GRID_VERSION,
    },
  }
}

/** Copy a query definition for "Edit data" forks (strips identity timestamps). */
export function cloneQueryInput(
  query: QueryDefinition,
  nameSuffix = '(edit)',
): Omit<QueryDefinition, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: `${query.name} ${nameSuffix}`.trim(),
    tableId: query.tableId,
    selectedColumns: [...(query.selectedColumns ?? [])],
    filters: (query.filters ?? []).map((filter) => ({ ...filter })),
    groupBy: [...(query.groupBy ?? [])],
    aggregations: (query.aggregations ?? []).map((agg) => ({ ...agg })),
    joins: query.joins?.map((join) => ({ ...join })),
    groupByGrains: query.groupByGrains ? { ...query.groupByGrains } : undefined,
    computedFields: query.computedFields?.map((field) => ({ ...field })),
    sort: query.sort?.map((entry) => ({ ...entry })),
    limit: query.limit ?? null,
    parameters: query.parameters?.map((param) => ({
      ...param,
      enumOptions: param.enumOptions ? [...param.enumOptions] : undefined,
    })),
    projectId: query.projectId ?? null,
  }
}
