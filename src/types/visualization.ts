import type { DataRow } from '#/types/data'

export type RedashVisualizationType =
  | 'CHART' | 'TABLE' | 'COUNTER' | 'GAUGE' | 'PIVOT' | 'FUNNEL' | 'SANKEY'
  | 'SUNBURST_SEQUENCE' | 'MAP' | 'CHOROPLETH' | 'COHORT' | 'WORD_CLOUD' | 'DETAILS' | 'TREEMAP'

export interface VisualizationDefinition {
  id: string
  queryId: string
  type: RedashVisualizationType
  name: string
  description?: string
  /** viz-lib options object for this type. Opaque to our code. */
  options: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type ParameterType = 'text' | 'number' | 'date' | 'date-range' | 'enum' | 'query'

export interface QueryParameter {
  /** machine name, unique per query */
  name: string
  /** display label */
  title: string
  type: ParameterType
  default: string | number | null
  /** for type 'enum' */
  enumOptions?: string[]
  /** for type 'query': dropdown fed by another query's first column */
  queryId?: string
}

export type ParameterMappingType = 'dashboard-level' | 'widget-level' | 'static'

export interface ParameterMapping {
  type: ParameterMappingType
  /** dashboard-level: name of the shared dashboard parameter. otherwise the param's own name */
  mapTo: string
  /** only for 'static' */
  value?: string | number | null
}

export interface WidgetPosition {
  col: number
  row: number
  sizeX: number // width in columns
  sizeY: number // height in grid rows
}

export interface DashboardWidget {
  id: string
  dashboardId: string
  /** null ⇒ textbox widget */
  visualizationId: string | null
  /** markdown body for textbox widgets, null for viz widgets */
  text: string | null
  options: {
    position: WidgetPosition
    /** Layout schema: 1 = 6-col/50px rows, 2 = 12-col/25px rows */
    gridVersion?: number
    parameterMappings?: Record<string, ParameterMapping>
  }
  createdAt: string
  updatedAt: string
}

export type RedashColumnType = 'integer' | 'float' | 'boolean' | 'string' | 'datetime' | 'date'

export interface RedashQueryResult {
  columns: { name: string; type: RedashColumnType; friendly_name: string }[]
  rows: DataRow[]
}
