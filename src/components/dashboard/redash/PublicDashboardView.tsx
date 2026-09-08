import { useMemo } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout/legacy'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import { ParameterBar } from '#/components/dashboard/redash/ParameterBar'
import { TextboxWidget } from '#/components/dashboard/redash/TextboxWidget'
import { useVizLib } from '#/components/data/vizLibClient'
import { collectDashboardParameters, defaultParameterValues } from '#/lib/dashboardParameters'
import {
  mapDbDashboardWidget,
  mapDbQuery,
  mapDbVisualization,
} from '#/lib/api/mappers'
import type { SharedRedashDashboardPayload } from '#/lib/api/sharedLinks'
import { toRedashResult } from '#/lib/redashResult'
import {
  GRID_COLS,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  positionToLayoutItem,
} from '#/lib/widgetGrid'
import type { DataRow, QueryDefinition } from '#/types/data'
import type { DashboardWidget, VisualizationDefinition } from '#/types/visualization'

const GridWithWidth = WidthProvider(GridLayout)

const EMPTY_QUERY: QueryDefinition = {
  id: '',
  name: '',
  tableId: '',
  selectedColumns: [],
  filters: [],
  groupBy: [],
  aggregations: [],
  createdAt: '',
  updatedAt: '',
}

function formatLastRefresh(iso: string | undefined, fetchedAt: Date): string {
  const updated = iso ? new Date(iso) : fetchedAt
  if (Number.isNaN(updated.getTime())) return `Refreshed ${fetchedAt.toLocaleString()}`
  return `Last refresh ${updated.toLocaleString()}`
}

function PublicVisualizationWidget({
  widget,
  visualization,
  query,
  rows,
  error,
}: {
  widget: DashboardWidget
  visualization: VisualizationDefinition | null
  query: QueryDefinition | null
  rows: DataRow[]
  error: string | null
}) {
  const { Renderer, error: vizError } = useVizLib()
  const result = useMemo(
    () => toRedashResult(rows, query ?? EMPTY_QUERY, []),
    [rows, query],
  )

  const title = visualization?.name ?? widget.id

  return (
    <div className="rd-tile">
      <header className="rd-tile-header">
        <span className="rd-tile-title">{title}</span>
      </header>
      <div className="rd-tile-body">
        {vizError ? (
          <div className="rd-muted">{vizError}</div>
        ) : !visualization ? (
          <div className="rd-muted">Visualization not found</div>
        ) : error ? (
          <div className="rd-muted">{error}</div>
        ) : !Renderer ? (
          <div className="rd-muted">Loading visualization…</div>
        ) : result.rows.length === 0 && result.columns.length === 0 ? (
          <div className="rd-muted">No data</div>
        ) : (
          <div className="rd-tile-viz">
            <Renderer
              type={visualization.type}
              options={visualization.options}
              data={result}
              visualizationName={visualization.name}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function PublicDashboardView({
  payload,
  fetchedAt,
}: {
  payload: SharedRedashDashboardPayload
  fetchedAt: Date
}) {
  const widgets = payload.widgets.map((row) => {
    const mapped = mapDbDashboardWidget(row)
    if (mapped.options?.position) return mapped
    return {
      ...mapped,
      options: {
        ...mapped.options,
        position: { col: 0, row: 0, sizeX: 3, sizeY: 8 },
      },
    }
  })
  const visualizations = payload.visualizations.map(mapDbVisualization)
  const queries = payload.queries.map(mapDbQuery)
  const layout = widgets.map(positionToLayoutItem)
  const dashboardParams = collectDashboardParameters(widgets, visualizations, queries)
  const dashboardParamValues = defaultParameterValues(dashboardParams)

  return (
    <div className="rd-page min-h-screen px-4 py-4 md:px-6">
      <header className="rd-header">
        <div className="rd-header-title">
          <h1>{payload.dashboard.name}</h1>
        </div>
        <p className="rd-header-meta">{formatLastRefresh(payload.dashboard.updated_at, fetchedAt)}</p>
      </header>

      {payload.dashboard.description ? (
        <p className="mb-4 text-sm text-[rgba(0,0,0,0.45)]">{payload.dashboard.description}</p>
      ) : null}

      <ParameterBar
        parameters={dashboardParams}
        values={dashboardParamValues}
        onApply={() => undefined}
        disabled
      />

      {widgets.length === 0 ? (
        <div className="rd-empty">
          <p>This dashboard is empty.</p>
        </div>
      ) : (
        <div className="rd-grid">
          <GridWithWidth
            className="min-h-[280px]"
            cols={GRID_COLS}
            rowHeight={GRID_ROW_HEIGHT}
            margin={[GRID_MARGIN, GRID_MARGIN]}
            containerPadding={[0, 0]}
            layout={layout}
            isDraggable={false}
            isResizable={false}
            compactType="vertical"
          >
            {widgets.map((widget) => {
              const visualization = widget.visualizationId
                ? (visualizations.find((item) => item.id === widget.visualizationId) ?? null)
                : null
              const query = visualization
                ? (queries.find((item) => item.id === visualization.queryId) ?? null)
                : null
              const queryId = visualization?.queryId
              const rows = queryId ? (payload.queryResults[queryId] ?? []) : []
              const error = queryId ? (payload.queryErrors?.[queryId] ?? null) : null

              return (
                <div key={widget.id} className="h-full">
                  {widget.visualizationId ? (
                    <PublicVisualizationWidget
                      widget={widget}
                      visualization={visualization}
                      query={query}
                      rows={rows}
                      error={error}
                    />
                  ) : (
                    <TextboxWidget widget={widget} editing={false} onEdit={() => undefined} onRemove={() => undefined} />
                  )}
                </div>
              )
            })}
          </GridWithWidth>
        </div>
      )}

      <footer className="rd-public-footer">
        <span className="rd-public-footer-label">Powered by</span>
        <DimesBiLogo size="sm" linkToHome={false} />
      </footer>
    </div>
  )
}
