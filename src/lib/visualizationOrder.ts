import type { RedashVisualizationType, VisualizationDefinition } from '#/types/visualization'

export const REDASH_VIZ_TYPE_LABELS: Record<RedashVisualizationType, string> = {
  CHART: 'Chart',
  TABLE: 'Table',
  COUNTER: 'Counter',
  GAUGE: 'Gauge',
  PIVOT: 'Pivot Table',
  FUNNEL: 'Funnel',
  SANKEY: 'Sankey',
  SUNBURST_SEQUENCE: 'Sunburst Sequence',
  MAP: 'Map (Markers)',
  CHOROPLETH: 'Map (Choropleth)',
  COHORT: 'Cohort',
  WORD_CLOUD: 'Word Cloud',
  DETAILS: 'Details View',
  TREEMAP: 'Treemap',
}

export const REDASH_VIZ_TYPES = Object.keys(REDASH_VIZ_TYPE_LABELS) as RedashVisualizationType[]

/** Oldest TABLE visualization — Redash's default, always first and not deletable. */
export function defaultTableVisualization(
  visualizations: VisualizationDefinition[],
): VisualizationDefinition | undefined {
  return visualizations
    .filter((v) => v.type === 'TABLE')
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))[0]
}

export function sortQueryVisualizations(
  visualizations: VisualizationDefinition[],
): VisualizationDefinition[] {
  const firstTable = defaultTableVisualization(visualizations)
  if (!firstTable) return visualizations
  return [firstTable, ...visualizations.filter((v) => v.id !== firstTable.id)]
}

export function isDefaultTableVisualization(
  visualization: VisualizationDefinition,
  visualizations: VisualizationDefinition[],
): boolean {
  return defaultTableVisualization(visualizations)?.id === visualization.id
}

export const DEFAULT_TABLE_VISUALIZATION = {
  type: 'TABLE' as const,
  name: 'Table',
  options: {} as Record<string, unknown>,
}
