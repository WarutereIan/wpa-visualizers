import type {
  DataColumnDef,
  DataFilter,
  DataPrimitive,
  DataRow,
  DataTable,
  QueryAggregation,
  QueryDefinition,
} from '#/types/data'
import type { DashboardDefinition } from '#/types/dashboard'
import type { MappingDefinition } from '#/types/mapping'
import type { DashboardWidget, RedashVisualizationType, VisualizationDefinition } from '#/types/visualization'
import { normalizeDashboardTheme } from '#/lib/chartPalettes'
import type {
  OutputIndicatorLink,
  OutputStatus,
  ProjectStatus,
  Indicator,
  IndicatorType,
  Output,
  Project,
} from '#/types/outputsIndicators'
import type { Layout } from 'react-grid-layout'

export interface DbDataTable {
  id: string
  organization_id: string
  name: string
  storage_backend: 'jsonb' | 'parquet'
  row_count: number
  source_connection_id?: string | null
  created_at: string
  updated_at: string
}

export interface DbDataTableColumn {
  id: string
  data_table_id: string
  name: string
  display_name: string | null
  data_type: 'string' | 'number' | 'boolean' | 'date'
  ordinal: number
}

export interface DbQueryDefinition {
  id: string
  organization_id: string
  table_id: string
  name: string
  selected_columns: string[]
  filters: unknown
  group_by: string[]
  aggregations: unknown
  sort?: unknown
  row_limit?: number | null
  group_by_grains?: unknown
  computed_fields?: unknown
  joins?: unknown
  created_at: string
  updated_at: string
}

export interface DbDashboard {
  id: string
  organization_id: string
  name: string
  description: string | null
  layout: unknown
  widgets: unknown
  theme?: unknown
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export interface DbVisualization {
  id: string
  organization_id: string
  query_id: string
  type: RedashVisualizationType
  name: string
  description: string | null
  options: unknown
  created_at: string
  updated_at: string
}

export interface DbDashboardWidget {
  id: string
  organization_id: string
  dashboard_id: string
  visualization_id: string | null
  text: string | null
  options: unknown
  created_at: string
  updated_at: string
}

export interface DbMapping {
  id: string
  organization_id: string
  name: string
  description: string
  source: 'dataset_table' | 'external_url' | 'baseline_embed'
  data_table_id: string | null
  latitude_column: string | null
  longitude_column: string | null
  label_column: string | null
  external_map_url: string | null
  created_at: string
  updated_at: string
}

export function mapDbColumns(columns: DbDataTableColumn[]): DataColumnDef[] {
  return [...columns]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((c) => ({
      name: c.name,
      type: c.data_type,
    }))
}

export function mapDbTable(
  table: DbDataTable,
  columns: DbDataTableColumn[],
  rows: DataRow[] = [],
): DataTable {
  return {
    id: table.id,
    name: table.name,
    columns: mapDbColumns(columns),
    rows,
    storageBackend: table.storage_backend,
    rowCount: table.row_count,
    sourceConnectionId: table.source_connection_id ?? null,
  }
}

export function mapDbQuery(row: DbQueryDefinition): QueryDefinition {
  return {
    id: row.id,
    name: row.name,
    tableId: row.table_id,
    selectedColumns: row.selected_columns ?? [],
    filters: (row.filters as DataFilter[]) ?? [],
    groupBy: row.group_by ?? [],
    aggregations: (row.aggregations as QueryAggregation[]) ?? [],
    sort: (row.sort as QueryDefinition['sort']) ?? [],
    limit: row.row_limit ?? null,
    groupByGrains: (row.group_by_grains as QueryDefinition['groupByGrains']) ?? {},
    computedFields: (row.computed_fields as QueryDefinition['computedFields']) ?? [],
    joins: (row.joins as QueryDefinition['joins']) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapQueryToDb(
  query: Omit<QueryDefinition, 'createdAt' | 'updatedAt'> & Partial<Pick<QueryDefinition, 'createdAt' | 'updatedAt'>>,
  organizationId: string,
) {
  return {
    id: query.id,
    organization_id: organizationId,
    table_id: query.tableId,
    name: query.name,
    selected_columns: query.selectedColumns,
    filters: query.filters,
    group_by: query.groupBy,
    aggregations: query.aggregations,
    sort: query.sort ?? [],
    row_limit: query.limit ?? null,
    group_by_grains: query.groupByGrains ?? {},
    computed_fields: query.computedFields ?? [],
    joins: query.joins ?? [],
  }
}

export function mapDbDashboard(row: DbDashboard): DashboardDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    layout: (row.layout as Layout) ?? [],
    widgets: (row.widgets as DashboardDefinition['widgets']) ?? {},
    theme: normalizeDashboardTheme(row.theme),
    status: row.status,
  }
}

export function mapDashboardToDb(
  dashboard: DashboardDefinition,
  organizationId: string,
) {
  return {
    id: dashboard.id,
    organization_id: organizationId,
    name: dashboard.name,
    description: dashboard.description ?? null,
    layout: dashboard.layout,
    widgets: dashboard.widgets,
    theme: normalizeDashboardTheme(dashboard.theme),
    status: dashboard.status ?? 'draft',
  }
}

export function mapDbVisualization(row: DbVisualization): VisualizationDefinition {
  return {
    id: row.id,
    queryId: row.query_id,
    type: row.type,
    name: row.name,
    description: row.description ?? undefined,
    options: (row.options as VisualizationDefinition['options']) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapVisualizationToDb(
  viz: Omit<VisualizationDefinition, 'createdAt' | 'updatedAt'> &
    Partial<Pick<VisualizationDefinition, 'createdAt' | 'updatedAt'>>,
  organizationId: string,
) {
  return {
    id: viz.id,
    organization_id: organizationId,
    query_id: viz.queryId,
    type: viz.type,
    name: viz.name,
    description: viz.description ?? null,
    options: viz.options ?? {},
  }
}

export function mapDbDashboardWidget(row: DbDashboardWidget): DashboardWidget {
  const options = (row.options as DashboardWidget['options']) ?? {
    position: { col: 0, row: 0, sizeX: 3, sizeY: 3 },
  }
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    visualizationId: row.visualization_id,
    text: row.text,
    options,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapWidgetToDb(
  widget: Omit<DashboardWidget, 'createdAt' | 'updatedAt'> &
    Partial<Pick<DashboardWidget, 'createdAt' | 'updatedAt'>>,
  organizationId: string,
) {
  return {
    id: widget.id,
    organization_id: organizationId,
    dashboard_id: widget.dashboardId,
    visualization_id: widget.visualizationId,
    text: widget.text,
    options: widget.options,
  }
}

export function mapDbMapping(row: DbMapping): MappingDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
    dataTableId: row.data_table_id,
    latitudeColumn: row.latitude_column,
    longitudeColumn: row.longitude_column,
    labelColumn: row.label_column,
    externalMapUrl: row.external_map_url,
  }
}

export function mapMappingToDb(mapping: MappingDefinition, organizationId: string) {
  return {
    id: mapping.id,
    organization_id: organizationId,
    name: mapping.name,
    description: mapping.description,
    source: mapping.source,
    data_table_id: mapping.dataTableId ?? null,
    latitude_column: mapping.latitudeColumn ?? null,
    longitude_column: mapping.longitudeColumn ?? null,
    label_column: mapping.labelColumn ?? null,
    external_map_url: mapping.externalMapUrl ?? null,
  }
}

export function normalizeRowData(row: Record<string, unknown>): DataRow {
  const out: DataRow = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value as DataPrimitive
      continue
    }
    out[key] = String(value)
  }
  return out
}

// --- MEAL layer (Phase C) ---

export interface DbProject {
  id: string
  organization_id: string
  code: string | null
  name: string
  program: string | null
  description: string
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface DbOutput {
  id: string
  project_id: string
  title: string
  description: string
  status: OutputStatus
  location: string | null
  target_period: string | null
  created_at: string
  updated_at: string
}

export interface DbIndicator {
  id: string
  organization_id: string
  project_id: string | null
  name: string
  type: IndicatorType
  location: string | null
  unit: string | null
  baseline: number | null
  target: number | null
  current: number | null
  period: string | null
  source_query_id: string | null
  formula: Record<string, unknown> | null
  disaggregations: unknown
  created_at: string
  updated_at: string
}

export interface DbOutputIndicatorLink {
  output_id: string
  indicator_id: string
  weight: number
  note: string | null
}

export function mapDbProject(row: DbProject): Project {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    program: row.program,
    description: row.description,
    status: row.status,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapDbOutput(row: DbOutput): Output {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    location: row.location,
    targetPeriod: row.target_period,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapDbIndicator(row: DbIndicator): Indicator {
  const disaggregations = Array.isArray(row.disaggregations)
    ? (row.disaggregations as unknown[]).filter((d): d is string => typeof d === 'string')
    : []
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    name: row.name,
    type: row.type,
    location: row.location,
    unit: row.unit,
    baseline: row.baseline == null ? null : Number(row.baseline),
    target: row.target == null ? null : Number(row.target),
    current: row.current == null ? null : Number(row.current),
    period: row.period,
    sourceQueryId: row.source_query_id,
    formula: row.formula ?? {},
    disaggregations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapDbLink(row: DbOutputIndicatorLink): OutputIndicatorLink {
  return {
    outputId: row.output_id,
    indicatorId: row.indicator_id,
    weight: Number(row.weight),
    note: row.note,
  }
}
