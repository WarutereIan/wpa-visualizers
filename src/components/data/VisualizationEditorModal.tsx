import { useEffect, useMemo, useRef, useState } from 'react'
import { ConfigProvider } from 'antd'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { ChoroplethAuthoringHint } from '#/components/data/ChoroplethAuthoringHint'
import { useVizLib } from '#/components/data/vizLibClient'
import { useChoroplethMaps } from '#/hooks/useChoroplethMaps'
import { getDefaultChoroplethOptions } from '#/lib/geo/mapRegistry'
import { useVisualizationWidgetRefs } from '#/hooks/useDashboardWidgets'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import {
  isDefaultTableVisualization,
  REDASH_VIZ_TYPE_LABELS,
  REDASH_VIZ_TYPES,
} from '#/lib/visualizationOrder'
import type { QueryDefinition } from '#/types/data'
import type {
  RedashQueryResult,
  RedashVisualizationType,
  VisualizationDefinition,
} from '#/types/visualization'

export type VisualizationEditorModalProps = {
  open: boolean
  query: QueryDefinition
  data: RedashQueryResult
  visualization: VisualizationDefinition | null
  onClose: () => void
}

export function VisualizationEditorModal({
  open,
  query,
  data,
  visualization,
  onClose,
}: VisualizationEditorModalProps) {
  const choroplethMaps = useChoroplethMaps()
  const { Editor, Renderer, error: vizError } = useVizLib()
  const { listByQuery, createVisualization, updateVisualization, removeVisualization } =
    useWorkspaceVisualizations()
  const siblings = listByQuery(query.id)
  const isDefaultTable = visualization
    ? isDefaultTableVisualization(visualization, siblings)
    : false

  const [type, setType] = useState<RedashVisualizationType>(visualization?.type ?? 'CHART')
  const [name, setName] = useState(visualization?.name ?? REDASH_VIZ_TYPE_LABELS.CHART)
  const [options, setOptions] = useState<Record<string, unknown>>(visualization?.options ?? {})
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const { widgets: refs, isLoading: refsLoading } = useVisualizationWidgetRefs(
    visualization?.id ?? null,
  )
  const { dashboards } = useWorkspaceDashboards()

  const dashboardNames = useMemo(() => {
    const names = refs.map((w) => dashboards.find((d) => d.id === w.dashboardId)?.name ?? 'Untitled')
    return [...new Set(names)]
  }, [refs, dashboards])

  useEffect(() => {
    if (!open) return
    setType(visualization?.type ?? 'CHART')
    setName(visualization?.name ?? REDASH_VIZ_TYPE_LABELS.CHART)
    setOptions(visualization?.options ?? {})
    setSaveError(null)
    setDeleteOpen(false)
  }, [open, visualization])

  const handleTypeChange = (next: RedashVisualizationType) => {
    const prevLabel = REDASH_VIZ_TYPE_LABELS[type]
    setType(next)
    setOptions(next === 'CHOROPLETH' ? getDefaultChoroplethOptions(choroplethMaps) : {})
    if (!name.trim() || name === prevLabel) {
      setName(REDASH_VIZ_TYPE_LABELS[next])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const trimmed = name.trim() || REDASH_VIZ_TYPE_LABELS[type]
      if (visualization) {
        await updateVisualization(visualization.id, { name: trimmed, type, options })
      } else {
        await createVisualization({
          queryId: query.id,
          type,
          name: trimmed,
          options,
        })
      }
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!visualization || isDefaultTable) return
    if (refs.length > 0) return
    setSaving(true)
    setSaveError(null)
    try {
      await removeVisualization(visualization.id)
      setDeleteOpen(false)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className="inset-3 top-3 left-3 flex h-[calc(100dvh-1.5rem)] max-h-none w-[calc(100vw-1.5rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-visible p-0 sm:max-w-none"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('.ant-select-dropdown, .ant-picker-dropdown, .ant-dropdown')) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('.ant-select-dropdown, .ant-picker-dropdown, .ant-dropdown')) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className="shrink-0 border-b border-[var(--line)] px-4 py-3">
          <DialogTitle>{visualization ? 'Edit visualization' : 'New visualization'}</DialogTitle>
          <DialogDescription>
            Configure type and options. Preview uses the current query result.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={bodyRef}
          className="flex min-h-0 flex-1 flex-row"
        >
          <aside className="flex min-h-0 w-[min(42%,520px)] min-w-[300px] shrink-0 flex-col space-y-3 overflow-y-auto border-r border-[var(--line)] p-4">
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">Type</label>
              <Select
                value={type}
                disabled={isDefaultTable}
                onValueChange={(value) => handleTypeChange(value as RedashVisualizationType)}
              >
                <SelectTrigger className="mt-1" aria-label="Visualization type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {REDASH_VIZ_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {REDASH_VIZ_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]" htmlFor="viz-name">
                Name
              </label>
              <input
                id="viz-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
              />
            </div>
            {type === 'CHOROPLETH' ? <ChoroplethAuthoringHint /> : null}
            <div className="min-h-[200px] flex-1">
              {vizError ? (
                <p className="text-xs text-red-700">{vizError}</p>
              ) : !Editor ? (
                <p className="text-xs text-[var(--sea-ink-soft)]">Loading editor…</p>
              ) : (
                <ConfigProvider
                  getPopupContainer={(node) =>
                    (node?.closest('[data-slot="dialog-content"]') as HTMLElement | null) ??
                    bodyRef.current ??
                    document.body
                  }
                  theme={{
                    token: {
                      zIndexPopupBase: 200,
                    },
                  }}
                >
                  <Editor
                    type={type}
                    options={options}
                    data={data}
                    visualizationName={name}
                    onOptionsChange={(opts) => setOptions({ ...(opts as Record<string, unknown>) })}
                  />
                </ConfigProvider>
              )}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-[var(--surface)] p-4">
            {vizError ? (
              <pre className="whitespace-pre-wrap text-xs text-red-700">{vizError}</pre>
            ) : !Renderer ? (
              <p className="text-sm text-[var(--sea-ink-soft)]">Loading preview…</p>
            ) : (
              <div className="min-h-0 flex-1">
                <div className="h-full min-h-[360px]">
                  <Renderer type={type} options={options} data={data} visualizationName={name} />
                </div>
              </div>
            )}
          </div>
        </div>

        {saveError && (
          <p className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800">
            {saveError}
          </p>
        )}

        <DialogFooter className="shrink-0 border-t border-[var(--line)] px-4 py-3">
          {visualization && !isDefaultTable ? (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              disabled={saving || refsLoading}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete visualization</DialogTitle>
          <DialogDescription>
            {refs.length > 0
              ? `This visualization is used on ${dashboardNames.join(', ')}. Remove those dashboard widgets first.`
              : `Delete “${visualization?.name ?? 'this visualization'}”? This cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
            {refs.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          {refs.length === 0 ? (
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
