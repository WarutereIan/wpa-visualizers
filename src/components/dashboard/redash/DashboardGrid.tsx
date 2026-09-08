import { useCallback } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout/legacy'
import { TextboxWidget } from '#/components/dashboard/redash/TextboxWidget'
import { VisualizationWidget } from '#/components/dashboard/redash/VisualizationWidget'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import type { ParameterValues } from '#/lib/queryParameters'
import {
  GRID_COLS,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  layoutItemToPosition,
  positionToLayoutItem,
} from '#/lib/widgetGrid'
import type { DashboardWidget } from '#/types/visualization'

const GridWithWidth = WidthProvider(GridLayout)

export type DashboardGridProps = {
  dashboardId: string
  editing: boolean
  dashboardParamValues: ParameterValues
  refreshNonce: number
  onEditWidget: (w: DashboardWidget) => void
}

export function DashboardGrid({
  dashboardId,
  editing,
  dashboardParamValues,
  refreshNonce,
  onEditWidget,
}: DashboardGridProps) {
  const { widgets, updateWidget, removeWidget, isLoading } = useDashboardWidgets(dashboardId)
  const layout = widgets.map(positionToLayoutItem)

  const handleLayoutChange = useCallback(
    (next: Layout) => {
      if (!editing) return
      for (const item of next) {
        const widget = widgets.find((entry) => entry.id === item.i)
        if (!widget) continue
        const position = layoutItemToPosition(item)
        const prev = widget.options.position
        if (
          prev.col === position.col &&
          prev.row === position.row &&
          prev.sizeX === position.sizeX &&
          prev.sizeY === position.sizeY
        ) {
          continue
        }
        void updateWidget(widget.id, { options: { ...widget.options, position } })
      }
    },
    [editing, updateWidget, widgets],
  )

  if (isLoading && widgets.length === 0) {
    return <div className="rd-muted">Loading widgets…</div>
  }

  if (widgets.length === 0) {
    return (
      <div className="rd-empty">
        <p>This dashboard is empty.</p>
        {editing ? <p>Add a widget or a textbox to get started.</p> : null}
      </div>
    )
  }

  return (
    <div className={`rd-grid ${editing ? 'editing' : ''}`}>
      <GridWithWidth
        className="min-h-[280px]"
        cols={GRID_COLS}
        rowHeight={GRID_ROW_HEIGHT}
        margin={[GRID_MARGIN, GRID_MARGIN]}
        containerPadding={[0, 0]}
        layout={layout}
        isDraggable={editing}
        isResizable={editing}
        compactType="vertical"
        draggableHandle=".rd-drag-handle"
        onLayoutChange={handleLayoutChange}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="h-full">
            {widget.visualizationId ? (
              <VisualizationWidget
                widget={widget}
                editing={editing}
                paramValues={dashboardParamValues}
                refreshNonce={refreshNonce}
                onEdit={() => onEditWidget(widget)}
                onRemove={() => void removeWidget(widget.id)}
              />
            ) : (
              <TextboxWidget
                widget={widget}
                editing={editing}
                onEdit={() => onEditWidget(widget)}
                onRemove={() => void removeWidget(widget.id)}
              />
            )}
          </div>
        ))}
      </GridWithWidth>
    </div>
  )
}
