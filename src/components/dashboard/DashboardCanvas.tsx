import { useCallback, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout/legacy'
import type { WidgetConfig, WidgetType } from '#/types/dashboard'
import type { QueryDefinition } from '#/types/data'
import {
  morePaletteByGroup,
  paletteEntryFor,
  primaryPaletteEntries,
} from '#/lib/widgetPalette'
import {
  bindingChecklistMessage,
  bindingSlotsForWidget,
} from '#/lib/widgetBindingHints'
import {
  hasStaleBindings,
  suggestBindings,
  staleBindingKeys,
} from '#/lib/suggestBindings'
import {
  DEFAULT_DASHBOARD_THEME,
  dashboardThemeStyle,
  normalizeDashboardTheme,
  type DashboardTheme,
} from '#/lib/chartPalettes'
import { queryResultColumns } from '#/lib/queryResultColumns'
import {
  findQueryUsages,
  formatQueryUsageLines,
  formatQueryUsageSummary,
  suggestWidgetQueryName,
} from '#/lib/queryUsage'
import { WidgetRenderer } from '#/components/dashboard/WidgetRenderer'
import { DashboardThemePicker } from '#/components/dashboard/DashboardThemePicker'
import { QueryEditor } from '#/components/data/QueryEditor'
import { Button } from '#/components/ui/button'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'

const GridWithWidth = WidthProvider(GridLayout)

function newWidgetId() {
  return `w-${crypto.randomUUID().slice(0, 8)}`
}

export interface DashboardCanvasProps {
  layout: Layout
  widgets: Record<string, WidgetConfig>
  theme?: DashboardTheme
  onChange: (next: {
    layout: Layout
    widgets: Record<string, WidgetConfig>
    theme?: DashboardTheme
  }) => void
  layoutKey?: string
}

type EditorMode = { kind: 'new' | 'edit'; queryId: string; local?: boolean } | null
type KpiSource = 'query' | 'indicator'
type MobileTab = 'canvas' | 'add' | 'config'

export function DashboardCanvas({
  layout,
  widgets,
  theme: themeProp,
  onChange,
  layoutKey = 'default',
}: DashboardCanvasProps) {
  const theme = normalizeDashboardTheme(themeProp ?? DEFAULT_DASHBOARD_THEME)
  const paletteId = theme.paletteId
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showMoreWidgets, setShowMoreWidgets] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas')
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [draftQuery, setDraftQuery] = useState<QueryDefinition | null>(null)
  const [savingEditor, setSavingEditor] = useState(false)

  const selected = selectedId ? widgets[selectedId] : null
  const { tables, queries, createQuery, updateQuery, updateColumnType } =
    useWorkspaceData()
  const { dashboards } = useWorkspaceDashboards()
  const { indicators } = useWorkspaceMeal()

  const getQueryById = useCallback(
    (id: string) => queries.find((q) => q.id === id),
    [queries],
  )

  const selectedQuery = selected?.dataSourceId
    ? getQueryById(selected.dataSourceId)
    : undefined
  const resultCols = selectedQuery ? queryResultColumns(selectedQuery) : []

  const kpiSource: KpiSource =
    selected?.type === 'kpi' && selected.options?.indicatorId ? 'indicator' : 'query'

  const draftUsages = useMemo(() => {
    if (!editorMode || editorMode.local) return []
    return findQueryUsages(dashboards, editorMode.queryId).filter(
      (u) => u.widgetId !== selectedId,
    )
  }, [editorMode, dashboards, selectedId])

  const selectedQueryUsages = useMemo(() => {
    if (!selected?.dataSourceId) return []
    return findQueryUsages(dashboards, selected.dataSourceId)
  }, [selected?.dataSourceId, dashboards])

  const bindingSlots =
    selected && selected.type !== 'kpi' ? bindingSlotsForWidget(selected.type) : []

  const staleKeys =
    selected && selectedQuery
      ? staleBindingKeys(selected.bindings, resultCols)
      : []

  const checklist =
    selected &&
    (staleKeys.length > 0
      ? `Bindings missing from query result: ${staleKeys.join(', ')}. Re-pick fields below.`
      : bindingChecklistMessage(
          selected.type,
          Boolean(selected.dataSourceId) ||
            (selected.type === 'kpi' && Boolean(selected.options?.indicatorId)),
          selected.bindings,
        ))

  const widgetHasStaleBindings = useCallback(
    (cfg: WidgetConfig) => {
      if (!cfg.dataSourceId) return false
      const q = getQueryById(cfg.dataSourceId)
      if (!q) return false
      return hasStaleBindings(cfg.bindings, queryResultColumns(q))
    },
    [getQueryById],
  )

  const onLayoutChange = useCallback(
    (next: Layout) => onChange({ layout: next, widgets }),
    [onChange, widgets],
  )

  const setTheme = useCallback(
    (next: DashboardTheme) => onChange({ layout, widgets, theme: next }),
    [onChange, layout, widgets],
  )

  const addWidget = useCallback(
    (type: WidgetType) => {
      const id = newWidgetId()
      const entry = paletteEntryFor(type)
      const title = entry?.label ?? type
      const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0)
      const w: WidgetConfig =
        type === 'text'
          ? {
              id,
              type,
              title,
              options: { body: '', align: 'left', size: 'md' },
            }
          : { id, type, title }
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
      setMobileTab('config')
    },
    [layout, widgets, onChange],
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
      if (field === 'dataSourceId') {
        const q = value ? getQueryById(value) : undefined
        const current = widgets[selectedId]
        const suggested = q
          ? suggestBindings(current.type, q, {})
          : {}
        onChange({
          layout,
          widgets: {
            ...widgets,
            [selectedId]: {
              ...current,
              dataSourceId: value || undefined,
              bindings: suggested,
              options: {
                ...(current.options ?? {}),
                indicatorId: undefined,
              },
            },
          },
        })
        return
      }
      onChange({
        layout,
        widgets: {
          ...widgets,
          [selectedId]: {
            ...widgets[selectedId],
            title: value,
          },
        },
      })
    },
    [selectedId, layout, widgets, onChange, getQueryById],
  )

  const updateBinding = useCallback(
    (field: 'xKey' | 'yKey', value: string) => {
      if (!selectedId) return
      const current = widgets[selectedId]
      const nextBindings: Record<string, string> = { ...(current.bindings ?? {}) }
      if (value) nextBindings[field] = value
      else delete nextBindings[field]
      onChange({
        layout,
        widgets: {
          ...widgets,
          [selectedId]: {
            ...current,
            bindings: nextBindings,
          },
        },
      })
    },
    [selectedId, layout, widgets, onChange],
  )

  const updateOption = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return
      const current = widgets[selectedId]
      const nextOptions = { ...(current.options ?? {}) }
      if (value === undefined || value === '') delete nextOptions[key]
      else nextOptions[key] = value
      onChange({
        layout,
        widgets: {
          ...widgets,
          [selectedId]: { ...current, options: nextOptions },
        },
      })
    },
    [selectedId, layout, widgets, onChange],
  )

  const setKpiSource = useCallback(
    (source: KpiSource) => {
      if (!selectedId) return
      const current = widgets[selectedId]
      if (source === 'indicator') {
        onChange({
          layout,
          widgets: {
            ...widgets,
            [selectedId]: {
              ...current,
              dataSourceId: undefined,
              bindings: {},
              options: { ...(current.options ?? {}), indicatorId: current.options?.indicatorId },
            },
          },
        })
      } else {
        onChange({
          layout,
          widgets: {
            ...widgets,
            [selectedId]: {
              ...current,
              options: { ...(current.options ?? {}), indicatorId: undefined },
            },
          },
        })
      }
    },
    [selectedId, layout, widgets, onChange],
  )

  const setIndicatorId = useCallback(
    (indicatorId: string) => {
      if (!selectedId) return
      const current = widgets[selectedId]
      onChange({
        layout,
        widgets: {
          ...widgets,
          [selectedId]: {
            ...current,
            dataSourceId: undefined,
            bindings: {},
            options: {
              ...(current.options ?? {}),
              indicatorId: indicatorId || undefined,
            },
          },
        },
      })
    },
    [selectedId, layout, widgets, onChange],
  )

  const openNewQuery = useCallback(() => {
    if (!selectedId) return
    if (tables.length === 0) return
    const table = tables[0]
    const firstCols = table.columns.slice(0, 2).map((c) => c.name)
    const name = suggestWidgetQueryName({
      widgetTitle: widgets[selectedId]?.title ?? '',
      widgetType: widgets[selectedId]?.type ?? 'chart',
      tableName: table.name,
    })
    const now = new Date().toISOString()
    const localId = `local-${crypto.randomUUID()}`
    const local: QueryDefinition = {
      id: localId,
      name,
      tableId: table.id,
      selectedColumns: firstCols,
      filters: [],
      groupBy: [],
      aggregations: [],
      createdAt: now,
      updatedAt: now,
    }
    setDraftQuery(local)
    setEditorMode({ kind: 'new', queryId: localId, local: true })
  }, [selectedId, tables, widgets])

  const openEditQuery = useCallback(() => {
    if (!selected?.dataSourceId) return
    const q = getQueryById(selected.dataSourceId)
    if (!q) return
    setDraftQuery({ ...q })
    setEditorMode({ kind: 'edit', queryId: q.id })
  }, [selected, getQueryById])

  const closeEditor = useCallback(
    (opts?: { discardNew?: boolean }) => {
      setEditorMode(null)
      setDraftQuery(null)
      // Local drafts never hit the catalog — nothing to delete.
      void opts
    },
    [],
  )

  const saveEditor = useCallback(() => {
    if (!editorMode || !draftQuery) return
    setSavingEditor(true)

    const bindSuggested = (wid: string | null, query: QueryDefinition, queryId: string) => {
      if (!wid || !widgets[wid]) return widgets
      const current = widgets[wid]
      const suggested = suggestBindings(current.type, query, current.bindings)
      return {
        ...widgets,
        [wid]: {
          ...current,
          dataSourceId: queryId,
          bindings: suggested,
          options: {
            ...(current.options ?? {}),
            indicatorId: undefined,
          },
        },
      }
    }

    if (editorMode.local || editorMode.kind === 'new') {
      const { id: _id, createdAt: _c, updatedAt: _u, ...input } = draftQuery
      void createQuery(input)
        .then((q) => {
          const nextWidgets = bindSuggested(selectedId, q, q.id)
          onChange({ layout, widgets: nextWidgets })
          setEditorMode(null)
          setDraftQuery(null)
        })
        .finally(() => setSavingEditor(false))
      return
    }

    void updateQuery(editorMode.queryId, {
      name: draftQuery.name,
      tableId: draftQuery.tableId,
      selectedColumns: draftQuery.selectedColumns,
      filters: draftQuery.filters,
      groupBy: draftQuery.groupBy,
      aggregations: draftQuery.aggregations,
      sort: draftQuery.sort,
      limit: draftQuery.limit,
      groupByGrains: draftQuery.groupByGrains,
      computedFields: draftQuery.computedFields,
      joins: draftQuery.joins,
    })
      .then(() => {
        // Refresh bindings for the selected widget if columns changed
        if (selectedId && widgets[selectedId]?.dataSourceId === editorMode.queryId) {
          const current = widgets[selectedId]
          const suggested = suggestBindings(current.type, draftQuery, current.bindings)
          onChange({
            layout,
            widgets: {
              ...widgets,
              [selectedId]: { ...current, bindings: suggested },
            },
          })
        }
        setEditorMode(null)
        setDraftQuery(null)
      })
      .finally(() => setSavingEditor(false))
  }, [
    editorMode,
    draftQuery,
    createQuery,
    updateQuery,
    selectedId,
    widgets,
    layout,
    onChange,
  ])

  const showKpiQueryMeasure =
    selected?.type === 'kpi' && kpiSource === 'query' && selectedQuery && resultCols.length > 0

  const primaryEntries = primaryPaletteEntries()
  const moreByGroup = morePaletteByGroup()

  const addWidgetButton = (e: (typeof primaryEntries)[number]) => (
    <button
      key={e.type}
      type="button"
      title={e.label}
      onClick={() => addWidget(e.type)}
      className="flex w-full items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2 text-left text-xs font-medium text-[var(--sea-ink)] transition hover:border-[var(--lagoon)] hover:bg-[rgba(79,184,178,0.08)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--bg-base)] text-[10px] text-[var(--sea-ink-soft)]">
        +
      </span>
      <span className="min-w-0 truncate">{e.shortLabel}</span>
    </button>
  )

  const addPanel = (
    <div className="flex h-full min-h-0 flex-col gap-3 p-2.5">
      <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        Add widget
      </p>
      <div className="flex shrink-0 flex-col gap-1.5">
        {primaryEntries.map(addWidgetButton)}
      </div>
      <button
        type="button"
        className="shrink-0 text-left text-[11px] font-medium text-[var(--lagoon-deep)] underline"
        onClick={() => setShowMoreWidgets((v) => !v)}
      >
        {showMoreWidgets ? 'Hide more' : `More types (${moreByGroup.reduce((n, g) => n + g.entries.length, 0)})`}
      </button>
      {showMoreWidgets && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-0.5">
          {moreByGroup.map(({ group, entries }) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                {group}
              </p>
              <div className="flex flex-col gap-1.5">{entries.map(addWidgetButton)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const gridChildren = useMemo(
    () =>
      layout.map((item) => {
        const cfg = widgets[item.i]
        if (!cfg) return null
        const stale = widgetHasStaleBindings(cfg)
        const selected = selectedId === item.i
        return (
          <div
            key={item.i}
            className={`overflow-hidden rounded-lg border bg-[var(--surface-strong)] ${
              selected
                ? stale
                  ? 'border-amber-500 ring-2 ring-amber-400/40'
                  : 'border-[var(--dash-accent,var(--lagoon))] ring-2 ring-[var(--dash-accent,var(--lagoon))]/30'
                : stale
                  ? 'border-amber-400'
                  : 'border-[var(--line)]'
            }`}
            onClick={() => {
              setSelectedId(item.i)
              setMobileTab('config')
            }}
          >
            <div className="drag-handle flex cursor-grab items-center justify-between border-b border-[var(--line)] bg-[var(--bg-base)]/50 px-2 py-1 active:cursor-grabbing">
              <span className="truncate text-xs font-medium text-[var(--sea-ink)]">{cfg.title}</span>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-[var(--sea-ink-soft)]">
                {stale ? (
                  <span className="rounded bg-amber-100 px-1 text-amber-900">bindings</span>
                ) : null}
                {cfg.type}
              </span>
            </div>
            <div className="h-[calc(100%-28px)] p-1">
              <WidgetRenderer config={cfg} paletteId={paletteId} />
            </div>
          </div>
        )
      }),
    [layout, widgets, selectedId, paletteId, widgetHasStaleBindings],
  )

  const configPanel = selected ? (
    <div className="space-y-3 p-3">
      {checklist && (
        <p
          className={`rounded-md border border-dashed px-2 py-1.5 text-xs ${
            staleKeys.length > 0
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-[var(--line)] bg-[var(--bg-base)]/60 text-[var(--sea-ink-soft)]'
          }`}
        >
          {checklist}
        </p>
      )}

      <div>
        <label className="text-sm font-medium text-[var(--sea-ink)]">Title</label>
        <input
          value={selected.title}
          onChange={(e) => updateSelectedField('title', e.target.value)}
          className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
        />
      </div>
      <p className="text-xs text-[var(--sea-ink-soft)]">
        Type: <span className="font-mono text-[var(--sea-ink)]">{selected.type}</span>
      </p>

      {selected.type === 'kpi' && (
        <div>
          <label className="text-sm font-medium text-[var(--sea-ink)]">Measure source</label>
          <select
            value={kpiSource}
            onChange={(e) => setKpiSource(e.target.value as KpiSource)}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          >
            <option value="query">Query field</option>
            <option value="indicator">MEAL indicator</option>
          </select>
          <p className="mt-1 text-[11px] text-[var(--sea-ink-soft)]">
            Bind to a query result field as-is, or show a pre-computed MEAL indicator value.
          </p>
        </div>
      )}

      {selected.type === 'text' ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[var(--sea-ink)]">Body</label>
            <textarea
              value={typeof selected.options?.body === 'string' ? selected.options.body : ''}
              onChange={(e) => updateOption('body', e.target.value)}
              rows={5}
              placeholder="Narrative, notes, or section intro…"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">Align</label>
              <select
                value={
                  selected.options?.align === 'center' || selected.options?.align === 'right'
                    ? selected.options.align
                    : 'left'
                }
                onChange={(e) => updateOption('align', e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">Size</label>
              <select
                value={
                  selected.options?.size === 'sm' || selected.options?.size === 'lg'
                    ? selected.options.size
                    : 'md'
                }
                onChange={(e) => updateOption('size', e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
        </div>
      ) : selected.type === 'kpi' && kpiSource === 'indicator' ? (
        <div>
          <label className="text-sm font-medium text-[var(--sea-ink)]">MEAL indicator</label>
          <select
            value={(selected.options?.indicatorId as string | undefined) ?? ''}
            onChange={(e) => setIndicatorId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          >
            <option value="">Select indicator…</option>
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>
          {indicators.length === 0 && (
            <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
              No indicators yet.{' '}
              <Link to="/projects" className="text-[var(--lagoon-deep)] underline">
                Manage projects
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
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
            {selectedQueryUsages.length > 1 && (
              <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                <p>{formatQueryUsageSummary(selectedQueryUsages)}</p>
                <ul className="mt-1 list-inside list-disc">
                  {formatQueryUsageLines(selectedQueryUsages).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={tables.length === 0 || savingEditor}
              onClick={openNewQuery}
            >
              New query
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!selected.dataSourceId || !selectedQuery}
              onClick={openEditQuery}
            >
              Edit query
            </Button>
          </div>

          {tables.length === 0 && (
            <p className="text-xs text-[var(--sea-ink-soft)]">
              No tables yet.{' '}
              <Link to="/data-management/import" className="text-[var(--lagoon-deep)] underline">
                Import data
              </Link>{' '}
              first.
            </p>
          )}
        </>
      )}



      {bindingSlots.length > 0 && selectedQuery && resultCols.length > 0 && (
        <div className="space-y-2">
          {bindingSlots.map((slot) => (
            <div key={slot.key}>
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                {slot.label}
                {slot.required ? <span className="text-red-600"> *</span> : null}
              </label>
              <select
                value={selected.bindings?.[slot.key] ?? ''}
                onChange={(e) => updateBinding(slot.key, e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
              >
                <option value="">{slot.required ? 'Select…' : 'Auto'}</option>
                {resultCols.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-0.5 text-[11px] text-[var(--sea-ink-soft)]">{slot.hint}</p>
            </div>
          ))}
        </div>
      )}

      {showKpiQueryMeasure && (
        <div>
          <label className="text-sm font-medium text-[var(--sea-ink)]">
            Measure field <span className="text-red-600">*</span>
          </label>
          <select
            value={selected.bindings?.yKey ?? ''}
            onChange={(e) => updateBinding('yKey', e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          >
            <option value="">Select…</option>
            {resultCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[var(--sea-ink-soft)]">
            Shows this field as produced by the query (no extra average).
          </p>
        </div>
      )}

      <Button asChild type="button" size="sm" variant="ghost" className="w-full">
        <Link to="/data-management">Manage all queries</Link>
      </Button>

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
    <p className="p-3 text-sm text-[var(--sea-ink-soft)]">
      Select a widget on the canvas to configure it.
    </p>
  )

  const canvasBody = (
    <div className="flex h-full min-h-[320px] flex-col gap-2">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5">
        <DashboardThemePicker theme={theme} onChange={setTheme} compact />
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--line)] p-2"
        style={dashboardThemeStyle(paletteId)}
      >
      {layout.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--sea-ink)]">Start with a widget</p>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Pick a type, then select or create a query for its data.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-wrap justify-center gap-2">
            {primaryEntries.map((e) => (
              <Button
                key={e.type}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addWidget(e.type)}
              >
                + {e.shortLabel}
              </Button>
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-[var(--dash-accent,var(--lagoon-deep))] underline"
            onClick={() => {
              setShowMoreWidgets(true)
              setMobileTab('add')
            }}
          >
            More chart types
          </button>
        </div>
      ) : (
        <GridWithWidth
          key={layoutKey}
          className="min-h-[320px] flex-1"
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
  )

  return (
    <div className="relative flex h-[min(720px,calc(100dvh-12rem))] min-h-[480px] flex-col">
      {/* Mobile tabs */}
      <div className="mb-2 flex gap-1 lg:hidden">
        {(
          [
            ['canvas', 'Canvas'],
            ['add', 'Add'],
            ['config', 'Config'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileTab(id)}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
              mobileTab === id
                ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.12)] text-[var(--lagoon-deep)]'
                : 'border-[var(--line)] text-[var(--sea-ink-soft)]'
            }`}
          >
            {label}
            {id === 'config' && selected ? ' ·' : ''}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
        {/* Compact add rail (desktop) */}
        <aside
          className={`flex w-48 shrink-0 flex-col overflow-hidden border-r border-[var(--line)] ${
            mobileTab === 'add' ? 'block' : 'hidden'
          } lg:flex`}
        >
          {addPanel}
        </aside>

        {/* Canvas */}
        <div
          className={`min-w-0 flex-1 overflow-auto p-2 ${
            mobileTab === 'canvas' ? 'block' : 'hidden'
          } lg:block`}
        >
          {canvasBody}
        </div>

        {/* Config — only when a widget is selected (desktop); always available via mobile tab */}
        <aside
          className={`w-full shrink-0 overflow-y-auto border-l border-[var(--line)] lg:w-[340px] ${
            mobileTab === 'config' ? 'block' : 'hidden'
          } ${selected ? 'lg:block' : 'lg:hidden'}`}
        >
          <p className="border-b border-[var(--line)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
            Widget config
          </p>
          {configPanel}
        </aside>

        {/* Query editor — focus mode: nearly full builder surface */}
        {editorMode && draftQuery && (
          <div className="absolute inset-0 z-30 flex items-stretch justify-center bg-black/45 p-0 sm:p-3">
            <div
              className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-[var(--surface-strong)] shadow-2xl sm:rounded-xl sm:border sm:border-[var(--line)]"
              role="dialog"
              aria-modal="true"
              aria-label={editorMode.kind === 'new' ? 'New query' : 'Edit query'}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--sea-ink)]">
                    {editorMode.kind === 'new' ? 'New query for widget' : 'Edit query'}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                    {editorMode.kind === 'new' || editorMode.local
                      ? 'Cancel discards this draft (nothing is saved yet). Done creates the shared query.'
                      : 'Saving updates every widget that uses this query.'}
                  </p>
                  {draftUsages.length > 0 && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                      <p>{formatQueryUsageSummary(draftUsages)}</p>
                      <ul className="mt-1 list-inside list-disc">
                        {formatQueryUsageLines(draftUsages).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => closeEditor({ discardNew: editorMode.kind === 'new' })}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="sm" disabled={savingEditor} onClick={saveEditor}>
                    {savingEditor
                      ? editorMode.local || editorMode.kind === 'new'
                        ? 'Creating…'
                        : 'Saving…'
                      : 'Done'}
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden p-4 sm:p-5">
                <QueryEditor
                  query={draftQuery}
                  tables={tables}
                  splitPreview
                  onColumnTypeChange={(columnName, type) => {
                    if (draftQuery.tableId) {
                      void updateColumnType(draftQuery.tableId, columnName, type)
                    }
                  }}
                  onChange={(patch) => {
                    setDraftQuery((prev) => {
                      if (!prev) return prev
                      const next = { ...prev, ...patch }
                      if (
                        patch.tableId &&
                        patch.tableId !== prev.tableId &&
                        selected &&
                        prev.name ===
                          suggestWidgetQueryName({
                            widgetTitle: selected.title,
                            widgetType: selected.type,
                            tableName: tables.find((t) => t.id === prev.tableId)?.name,
                          })
                      ) {
                        const tableName = tables.find((t) => t.id === patch.tableId)?.name
                        next.name = suggestWidgetQueryName({
                          widgetTitle: selected.title,
                          widgetType: selected.type,
                          tableName,
                        })
                      }
                      return next
                    })
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
