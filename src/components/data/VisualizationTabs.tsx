import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { VisualizationEditorModal } from '#/components/data/VisualizationEditorModal'
import { useVizLib } from '#/components/data/vizLibClient'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { defaultParameterMappings, visualizationWidgetDraft } from '#/lib/addWidget'
import { usedParameters } from '#/lib/queryParameters'
import { toRedashResult } from '#/lib/redashResult'
import {
  DEFAULT_TABLE_VISUALIZATION,
  REDASH_VIZ_TYPE_LABELS,
  sortQueryVisualizations,
} from '#/lib/visualizationOrder'
import type { DataColumnDef, DataRow, QueryDefinition } from '#/types/data'
import type { DashboardWidget, VisualizationDefinition } from '#/types/visualization'

const pendingDefaultTable = new Set<string>()

export type VisualizationTabsProps = {
  query: QueryDefinition
  previewRows: DataRow[]
  sourceColumns: DataColumnDef[]
  dashboardId?: string | null
  existingWidgets?: DashboardWidget[]
  /** Fill available height; larger chart canvas for insight-first layout. */
  dominant?: boolean
  /** Bump to open the editor: viz id, or '__new__' for create. */
  editorRequest?: string | null
  onEditorRequestHandled?: () => void
}

export function VisualizationTabs({
  query,
  previewRows,
  sourceColumns,
  dashboardId = null,
  existingWidgets = [],
  dominant = false,
  editorRequest = null,
  onEditorRequestHandled,
}: VisualizationTabsProps) {
  const { Renderer, error: vizError } = useVizLib()
  const { listByQuery, createVisualization } = useWorkspaceVisualizations()
  const { createWidget } = useDashboardWidgets(dashboardId)
  const visualizations = sortQueryVisualizations(listByQuery(query.id))
  const data = useMemo(
    () => toRedashResult(previewRows, query, sourceColumns),
    [previewRows, query, sourceColumns],
  )

  const [activeId, setActiveId] = useState<string>('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<VisualizationDefinition | null>(null)
  const [adding, setAdding] = useState(false)
  const [addMessage, setAddMessage] = useState<string | null>(null)
  const knownIds = useRef(new Set<string>())

  useEffect(() => {
    if (visualizations.some((v) => v.type === 'TABLE')) return
    if (pendingDefaultTable.has(query.id)) return
    pendingDefaultTable.add(query.id)
    void createVisualization({
      queryId: query.id,
      ...DEFAULT_TABLE_VISUALIZATION,
    }).finally(() => {
      pendingDefaultTable.delete(query.id)
    })
  }, [createVisualization, query.id, visualizations])

  useEffect(() => {
    const added = visualizations.find((v) => !knownIds.current.has(v.id))
    knownIds.current = new Set(visualizations.map((v) => v.id))
    if (added && added.type !== 'TABLE') {
      setActiveId(added.id)
      return
    }
    if (visualizations.length === 0) return
    if (!visualizations.some((v) => v.id === activeId)) {
      setActiveId(visualizations[0].id)
    }
  }, [activeId, visualizations])

  useEffect(() => {
    if (!editorRequest) return
    if (editorRequest === '__new__') {
      setEditing(null)
      setEditorOpen(true)
    } else {
      const viz = visualizations.find((v) => v.id === editorRequest)
      if (viz) {
        setEditing(viz)
        setEditorOpen(true)
        setActiveId(viz.id)
      }
    }
    onEditorRequestHandled?.()
  }, [editorRequest, visualizations, onEditorRequestHandled])

  const active = visualizations.find((v) => v.id === activeId) ?? visualizations[0]

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (viz: VisualizationDefinition) => {
    setEditing(viz)
    setEditorOpen(true)
  }

  const handleAddToDashboard = async () => {
    if (!dashboardId || !active) return
    setAdding(true)
    setAddMessage(null)
    try {
      const params = usedParameters(query)
      await createWidget(
        visualizationWidgetDraft(
          dashboardId,
          existingWidgets,
          active.id,
          defaultParameterMappings(params),
        ),
      )
      setAddMessage('Added to this dashboard.')
    } catch (err) {
      setAddMessage(err instanceof Error ? err.message : 'Failed to add widget')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      className={`flex min-h-0 flex-col gap-2 ${
        dominant ? 'h-full flex-1' : 'mt-3 border-t border-[var(--line)] pt-3'
      }`}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="query-widget-select">
          Widget
        </label>
        <Select
          value={active?.id || undefined}
          onValueChange={setActiveId}
          disabled={visualizations.length === 0}
        >
          <SelectTrigger
            id="query-widget-select"
            className="h-8 w-[min(100%,280px)]"
            aria-label="Select widget"
          >
            <SelectValue placeholder="No widgets yet" />
          </SelectTrigger>
          <SelectContent>
            {visualizations.map((viz) => {
              const typeLabel = REDASH_VIZ_TYPE_LABELS[viz.type] ?? viz.type
              const title = viz.name?.trim() || typeLabel
              return (
                <SelectItem key={viz.id} value={viz.id}>
                  {title === typeLabel ? title : `${title} · ${typeLabel}`}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={openCreate}>
            + New
          </Button>
          {active ? (
            <Button type="button" size="sm" variant="outline" onClick={() => openEdit(active)}>
              Edit
            </Button>
          ) : null}
          {dashboardId && active ? (
            <Button
              type="button"
              size="sm"
              disabled={adding}
              onClick={() => void handleAddToDashboard()}
            >
              {adding ? 'Adding…' : 'Add to this dashboard'}
            </Button>
          ) : active ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/dashboards">Add on a dashboard</Link>
            </Button>
          ) : null}
        </div>
      </div>
      {addMessage ? (
        <p className="shrink-0 text-xs text-[var(--sea-ink-soft)]">{addMessage}</p>
      ) : null}

      <div className={dominant ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-[220px]'}>
        {!active ? (
          <p className="text-xs text-[var(--sea-ink-soft)]">
            No widgets on this query yet. Create one to preview.
          </p>
        ) : vizError ? (
          <pre className="whitespace-pre-wrap text-xs text-red-700">{vizError}</pre>
        ) : !Renderer ? (
          <p className="text-xs text-[var(--sea-ink-soft)]">Loading visualization…</p>
        ) : (
          <div className={dominant ? 'h-full min-h-[320px]' : 'min-h-[220px]'}>
            <Renderer
              type={active.type}
              options={active.options}
              data={data}
              visualizationName={active.name}
            />
          </div>
        )}
      </div>

      <VisualizationEditorModal
        open={editorOpen}
        query={query}
        data={data}
        visualization={editing}
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
