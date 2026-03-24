import { useCallback, useMemo, useState } from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout/legacy'
import type { WidgetConfig, WidgetType } from '#/types/dashboard'
import {
  WIDGET_PALETTE,
  PALETTE_GROUPS,
  paletteEntryFor,
  type PaletteGroup,
} from '#/lib/widgetPalette'
import { WidgetRenderer } from '#/components/dashboard/WidgetRenderer'
import { Button } from '#/components/ui/button'
import { useDataStore } from '#/stores/dataStore'

const GridWithWidth = WidthProvider(GridLayout)

function newWidgetId() {
  return `w-${crypto.randomUUID().slice(0, 8)}`
}

export interface DashboardCanvasProps {
  layout: Layout
  widgets: Record<string, WidgetConfig>
  onChange: (next: { layout: Layout; widgets: Record<string, WidgetConfig> }) => void
  layoutKey?: string
}

export function DashboardCanvas({
  layout,
  widgets,
  onChange,
  layoutKey = 'default',
}: DashboardCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<PaletteGroup>>(
    () => new Set(['General', 'Comparison', 'Trend']),
  )
  const selected = selectedId ? widgets[selectedId] : null
  const queries = useDataStore((s) => s.queries)
  const getQueryById = useDataStore((s) => s.getQueryById)

  const toggleGroup = (g: PaletteGroup) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(g) ? next.delete(g) : next.add(g)
      return next
    })

  const onLayoutChange = useCallback(
    (next: Layout) => onChange({ layout: next, widgets }),
    [onChange, widgets],
  )

  const addWidget = useCallback(
    (type: WidgetType) => {
      const id = newWidgetId()
      const entry = paletteEntryFor(type)
      const title = entry?.label ?? type
      const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0)
      const defaultQueryId = queries[0]?.id
      const w: WidgetConfig = { id, type, title, dataSourceId: defaultQueryId }
      const nextWidgets = { ...widgets, [id]: w }
      const nextLayout: Layout = [
        ...layout,
        {
          i: id,
          x: 0,
          y: maxY,
          w: entry?.defaultW ?? 6,
          h: entry?.defaultH ?? 6,
          minW: entry?.minW ?? 3,
          minH: entry?.minH ?? 3,
        },
      ]
      onChange({ layout: nextLayout, widgets: nextWidgets })
      setSelectedId(id)
    },
    [layout, widgets, onChange, queries],
  )

  const removeWidget = useCallback(
    (wid: string) => {
      const nextW = { ...widgets }
      delete nextW[wid]
      onChange({ layout: layout.filter((l) => l.i !== wid), widgets: nextW })
      setSelectedId((s) => (s === wid ? null : s))
    },
    [layout, widgets, onChange],
  )

  const updateSelectedField = useCallback(
    (field: 'title' | 'dataSourceId', value: string) => {
      if (!selectedId) return
      onChange({
        layout,
        widgets: { ...widgets, [selectedId]: { ...widgets[selectedId], [field]: value } },
      })
    },
    [selectedId, layout, widgets, onChange],
  )

  const updateBinding = useCallback(
    (field: 'xKey' | 'yKey', value: string) => {
      if (!selectedId) return
      const current = widgets[selectedId]
      onChange({
        layout,
        widgets: {
          ...widgets,
          [selectedId]: {
            ...current,
            bindings: {
              ...(current.bindings ?? {}),
              [field]: value,
            },
          },
        },
      })
    },
    [selectedId, layout, widgets, onChange],
  )

  const gridChildren = useMemo(
    () =>
      layout.map((item) => {
        const cfg = widgets[item.i]
        if (!cfg) return null
        return (
          <div
            key={item.i}
            className={`rounded-lg border-2 bg-[var(--surface)] p-1 ${
              selectedId === item.i ? 'border-[var(--lagoon)]' : 'border-transparent'
            }`}
            onClick={() => setSelectedId(item.i)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedId(item.i) }}
            role="button"
            tabIndex={0}
          >
            <div className="drag-handle mb-1 flex cursor-grab items-center gap-1 rounded bg-[var(--sand)] px-2 py-0.5 text-[10px] font-medium text-[var(--sea-ink-soft)] active:cursor-grabbing">
              <span aria-hidden>⠿</span> Drag
            </div>
            <WidgetRenderer config={cfg} />
          </div>
        )
      }),
    [layout, widgets, selectedId],
  )

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* ── Palette (scrollable sidebar) ───────────────── */}
      <aside className="w-full shrink-0 lg:w-56 lg:max-h-[80vh] lg:overflow-y-auto lg:pr-1">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
          Add widgets
        </p>
        {PALETTE_GROUPS.map((group) => {
          const items = WIDGET_PALETTE.filter((p) => p.group === group)
          if (items.length === 0) return null
          const open = expandedGroups.has(group)
          return (
            <div key={group} className="mb-2">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] hover:bg-[var(--sand)] transition"
                onClick={() => toggleGroup(group)}
              >
                <span className="text-[9px]">{open ? '▾' : '▸'}</span>
                {group}
                <span className="ml-auto tabular-nums text-[10px] font-normal">{items.length}</span>
              </button>
              {open && (
                <div className="mt-1 flex flex-col gap-1 pl-2">
                  {items.map((p) => (
                    <Button
                      key={p.type}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto min-h-7 justify-start whitespace-normal py-1 text-left text-[11px]"
                      onClick={() => addWidget(p.type)}
                    >
                      + {p.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </aside>

      {/* ── Canvas ─────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-2">
          <p className="mb-2 text-xs text-[var(--sea-ink-soft)]">
            Drag and resize widgets. Click a widget to configure it.
          </p>
          {layout.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-sm text-[var(--sea-ink-soft)]">
              No widgets yet — pick one from the palette.
            </div>
          ) : (
            <GridWithWidth
              key={layoutKey}
              className="min-h-[320px]"
              cols={12}
              rowHeight={36}
              margin={[8, 8]}
              containerPadding={[8, 8]}
              layout={layout}
              onLayoutChange={onLayoutChange}
              draggableHandle=".drag-handle"
              compactType="vertical"
            >
              {gridChildren}
            </GridWithWidth>
          )}
        </div>
      </div>

      {/* ── Config panel ───────────────────────────────── */}
      <aside className="w-full shrink-0 space-y-3 lg:w-60">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
          Widget config
        </p>
        {selected ? (
          <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3">
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">Title</label>
              <input
                value={selected.title}
                onChange={(e) => updateSelectedField('title', e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
              />
            </div>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-[var(--sea-ink-soft)]">Type</dt>
                <dd className="font-mono text-[var(--sea-ink)]">{selected.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--sea-ink-soft)]">Source</dt>
                <dd className="text-[var(--sea-ink)]">{selected.dataSourceId ?? '—'}</dd>
              </div>
            </dl>
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">Data query</label>
              <select
                value={selected.dataSourceId ?? ''}
                onChange={(e) => updateSelectedField('dataSourceId', e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              >
                <option value="">Select query…</option>
                {queries.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
            {(() => {
              const q = selected.dataSourceId ? getQueryById(selected.dataSourceId) : undefined
              const cols = q?.selectedColumns ?? []
              if (cols.length === 0 || selected.type === 'kpi') return null
              return (
                <>
                  <div>
                    <label className="text-sm font-medium text-[var(--sea-ink)]">X field</label>
                    <select
                      value={selected.bindings?.xKey ?? ''}
                      onChange={(e) => updateBinding('xKey', e.target.value)}
                      className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
                    >
                      <option value="">Auto</option>
                      {cols.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--sea-ink)]">Y field</label>
                    <select
                      value={selected.bindings?.yKey ?? ''}
                      onChange={(e) => updateBinding('yKey', e.target.value)}
                      className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
                    >
                      <option value="">Auto</option>
                      {cols.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )
            })()}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => removeWidget(selected.id)}
            >
              Remove widget
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--sea-ink-soft)]">Select a widget on the canvas.</p>
        )}
      </aside>
    </div>
  )
}
