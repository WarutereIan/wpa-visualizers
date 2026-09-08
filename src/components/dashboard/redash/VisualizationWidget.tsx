import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MoreHorizontal, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ParameterInput } from '#/components/dashboard/redash/ParameterInput'
import { ParameterMappingForm } from '#/components/dashboard/redash/ParameterMappingForm'
import { useVizLib } from '#/components/data/vizLibClient'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useVisualizationResult } from '#/hooks/useVisualizationResult'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { defaultParameterMappings } from '#/lib/addWidget'
import { defaultParameterValues } from '#/lib/dashboardParameters'
import { usedParameters, type ParameterValues, resolveWidgetParameters } from '#/lib/queryParameters'
import type { DashboardWidget, ParameterMapping, RedashQueryResult } from '#/types/visualization'

export type VisualizationWidgetProps = {
  widget: DashboardWidget
  editing: boolean
  paramValues: ParameterValues
  refreshNonce: number
  onEdit: () => void
  onRemove: () => void
}

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function resultToCsv(result: RedashQueryResult): string {
  const headers = result.columns.map((column) => column.name)
  const lines = [
    headers.map(csvEscape).join(','),
    ...result.rows.map((row) => headers.map((name) => csvEscape(row[name])).join(',')),
  ]
  return lines.join('\n')
}

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function downloadCsv(result: RedashQueryResult, filename: string) {
  downloadBlob(new Blob([resultToCsv(result)], { type: 'text/csv;charset=utf-8' }), filename)
}

function downloadExcel(result: RedashQueryResult, filename: string) {
  const rows = result.rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const column of result.columns) out[column.name] = row[column.name]
    return out
  })
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Result')
  XLSX.writeFile(workbook, filename)
}

function formatRefreshedAt(at: Date | null): string {
  if (!at) return 'Refreshed —'
  const minutes = Math.max(0, Math.floor((Date.now() - at.getTime()) / 60000))
  if (minutes < 1) return 'Refreshed just now'
  if (minutes === 1) return 'Refreshed 1 minute ago'
  return `Refreshed ${minutes} minutes ago`
}

export function VisualizationWidget({
  widget,
  editing,
  paramValues,
  refreshNonce,
  onRemove,
}: VisualizationWidgetProps) {
  const { Renderer, error: vizError } = useVizLib()
  const { visualizations } = useWorkspaceVisualizations()
  const { queries } = useWorkspaceData()
  const visualization = visualizations.find((item) => item.id === widget.visualizationId) ?? null
  const catalogQuery = visualization
    ? (queries.find((item) => item.id === visualization.queryId) ?? null)
    : null
  const { updateWidget } = useDashboardWidgets(widget.dashboardId)

  const usedParams = useMemo(
    () => (catalogQuery ? usedParameters(catalogQuery) : []),
    [catalogQuery],
  )
  const widgetLevelParams = useMemo(
    () =>
      usedParams.filter((param) => {
        const mapping = widget.options.parameterMappings?.[param.name]
        return !mapping || mapping.type === 'widget-level'
      }),
    [usedParams, widget.options.parameterMappings],
  )

  const [widgetValues, setWidgetValues] = useState<ParameterValues>({})
  useEffect(() => {
    setWidgetValues((prev) => {
      const seeded = defaultParameterValues(widgetLevelParams)
      const next: ParameterValues = {}
      let changed = Object.keys(prev).some((key) => !(key in seeded))
      for (const param of widgetLevelParams) {
        const mapping = widget.options.parameterMappings?.[param.name]
        const key = mapping?.type === 'widget-level' ? mapping.mapTo : param.name
        if (key in prev) {
          next[key] = prev[key]
        } else {
          next[key] = seeded[param.name]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [widgetLevelParams, widget.options.parameterMappings])

  const [mappingOpen, setMappingOpen] = useState(false)
  const [draftMappings, setDraftMappings] = useState<Record<string, ParameterMapping>>({})
  const [savingMappings, setSavingMappings] = useState(false)

  const resolvedParams = useMemo(
    () =>
      resolveWidgetParameters(
        catalogQuery?.parameters ?? [],
        widget.options.parameterMappings,
        paramValues,
        widgetValues,
      ),
    [catalogQuery?.parameters, widget.options.parameterMappings, paramValues, widgetValues],
  )

  const { result, query, isLoading, error, lastRefreshedAt } = useVisualizationResult(
    visualization?.queryId ?? null,
    resolvedParams,
    refreshNonce,
  )

  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menuOpen])

  const title = visualization?.name ?? 'Visualization'
  const queryName = query?.name ?? catalogQuery?.name
  const queryId = query?.id ?? catalogQuery?.id
  const fileBase = (visualization?.name || queryName || 'widget').replace(/[^\w.-]+/g, '_')

  return (
    <div className={`rd-tile ${editing ? 'is-editing' : ''}`}>
      <div className="rd-tile-actions">
        <button
          type="button"
          className="rd-tile-action"
          title="More"
          aria-label="Widget menu"
          onClick={(event) => {
            event.stopPropagation()
            setMenuOpen((open) => !open)
          }}
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menuOpen ? (
          <div className="rd-menu" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              disabled={!result}
              onClick={() => {
                if (!result) return
                setMenuOpen(false)
                downloadCsv(result, `${fileBase}.csv`)
              }}
            >
              Download as CSV
            </button>
            <button
              type="button"
              disabled={!result}
              onClick={() => {
                if (!result) return
                setMenuOpen(false)
                downloadExcel(result, `${fileBase}.xlsx`)
              }}
            >
              Download as Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setDraftMappings(
                  Object.keys(widget.options.parameterMappings ?? {}).length > 0
                    ? (widget.options.parameterMappings ?? {})
                    : defaultParameterMappings(usedParams),
                )
                setMappingOpen(true)
              }}
            >
              Edit Parameters
            </button>
            {editing ? (
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setMenuOpen(false)
                  onRemove()
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <header className={`rd-tile-header rd-drag-handle ${editing ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <div className="min-w-0 truncate">
          <span className="rd-tile-title">{title}</span>
          {queryName && queryId ? (
            <Link
              to="/data-management"
              search={{ queryId }}
              className="rd-tile-query"
              onClick={(event) => event.stopPropagation()}
            >
              {queryName}
            </Link>
          ) : null}
        </div>
      </header>

      {widgetLevelParams.length > 0 ? (
        <div className="rd-tile-params">
          {widgetLevelParams.map((parameter) => {
            const mapping = widget.options.parameterMappings?.[parameter.name]
            const key = mapping?.type === 'widget-level' ? mapping.mapTo : parameter.name
            return (
              <label key={parameter.name} className="rd-filter">
                <span className="rd-filter-label">{parameter.title || parameter.name}</span>
                <ParameterInput
                  parameter={parameter}
                  value={widgetValues[key] ?? parameter.default ?? null}
                  onChange={(next) => setWidgetValues((prev) => ({ ...prev, [key]: next }))}
                />
              </label>
            )
          })}
        </div>
      ) : null}

      <div className="rd-tile-body">
        {vizError ? (
          <div className="rd-muted">{vizError}</div>
        ) : !visualization ? (
          <div className="rd-muted">Visualization not found</div>
        ) : error ? (
          <div className="rd-muted">{error}</div>
        ) : isLoading || !result ? (
          <div className="rd-muted">{isLoading ? 'Loading visualization…' : 'No data'}</div>
        ) : !Renderer ? (
          <div className="rd-muted">Loading visualization…</div>
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

      <footer className="rd-tile-footer">
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="size-3.5 opacity-60" aria-hidden />
          {formatRefreshedAt(lastRefreshedAt)}
        </span>
      </footer>

      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Edit Parameters</DialogTitle>
          </DialogHeader>
          {usedParams.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">This query has no parameters.</p>
          ) : (
            <ParameterMappingForm
              parameters={usedParams}
              value={draftMappings}
              onChange={setDraftMappings}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMappingOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingMappings}
              onClick={() => {
                setSavingMappings(true)
                void updateWidget(widget.id, {
                  options: { ...widget.options, parameterMappings: draftMappings },
                })
                  .then(() => setMappingOpen(false))
                  .finally(() => setSavingMappings(false))
              }}
            >
              {savingMappings ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
