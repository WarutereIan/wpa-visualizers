import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MoreHorizontal, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useVizLib } from '#/components/data/vizLibClient'
import { useVisualizationResult } from '#/hooks/useVisualizationResult'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { type ParameterValues, resolveWidgetParameters } from '#/lib/queryParameters'
import type { DashboardWidget, RedashQueryResult } from '#/types/visualization'

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
  onEdit,
  onRemove,
}: VisualizationWidgetProps) {
  const { Renderer, error: vizError } = useVizLib()
  const { visualizations } = useWorkspaceVisualizations()
  const { queries } = useWorkspaceData()
  const visualization = visualizations.find((item) => item.id === widget.visualizationId) ?? null
  const catalogQuery = visualization
    ? (queries.find((item) => item.id === visualization.queryId) ?? null)
    : null

  const resolvedParams = useMemo(
    () =>
      resolveWidgetParameters(
        catalogQuery?.parameters ?? [],
        widget.options.parameterMappings,
        paramValues,
        {},
      ),
    [catalogQuery?.parameters, widget.options.parameterMappings, paramValues],
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
                onEdit()
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
              search={{ queryId } as { queryId: string }}
              className="rd-tile-query"
              onClick={(event) => event.stopPropagation()}
            >
              {queryName}
            </Link>
          ) : null}
        </div>
      </header>

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
    </div>
  )
}
