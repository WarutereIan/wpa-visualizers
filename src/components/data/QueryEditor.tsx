import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  QueryBuilder,
  ValueEditor,
  type Field,
  type RuleGroupType,
  type ValueEditorProps,
} from 'react-querybuilder'
import 'react-querybuilder/dist/query-builder.css'
import { InsightPanel } from '#/components/data/InsightPanel'
import { QueryParametersEditor } from '#/components/data/QueryParametersEditor'
import { VisualizationTabs } from '#/components/data/VisualizationTabs'
import { Button } from '#/components/ui/button'
import {
  AGGREGATION_OPERATORS,
  createDefaultAggregation,
  useRunQueryResult,
  useWorkspaceData,
} from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import {
  defaultAggregationAlias,
  firstNumericColumn,
  isAggregationAllowed,
} from '#/lib/aggregationRules'
import { previewQueryRows } from '#/lib/queryPreview'
import { queryResultColumns } from '#/lib/queryResultColumns'
import { filterOperatorsForColumnType } from '#/lib/filterOperators'
import { slugAlias } from '#/lib/slugAlias'
import type {
  AggregationOperator,
  DataColumnDef,
  DataColumnType,
  DataFilter,
  DataFilterOperator,
  DataTable,
  QueryAggregation,
  QueryDefinition,
} from '#/types/data'
import type { QueryParameter } from '#/types/visualization'

export type QueryEditorProps = {
  query: QueryDefinition
  tables: DataTable[]
  onChange: (patch: Partial<QueryDefinition>) => void
  /** Tighter spacing for dashboard drawer. */
  compact?: boolean
  /** Side-by-side form + preview (desktop). */
  splitPreview?: boolean
  /** Optional slot under the source table (e.g. export / promote). */
  tableActions?: React.ReactNode
  /** Optional footer (e.g. Delete query). */
  footer?: React.ReactNode
  /** Inline column type edits for the active table. */
  onColumnTypeChange?: (columnName: string, type: DataColumnType) => void
  /** When set, visualizations can be added directly to this dashboard. */
  dashboardId?: string | null
  existingWidgets?: import('#/types/visualization').DashboardWidget[]
}

export function QueryEditor({
  query,
  tables,
  onChange,
  compact = false,
  splitPreview = false,
  tableActions,
  footer,
  onColumnTypeChange,
  dashboardId = null,
  existingWidgets = [],
}: QueryEditorProps) {
  const [openRail, setOpenRail] = useState<{
    insight: boolean
    filters: boolean
    data: boolean
    advanced: boolean
  }>(() => ({
    insight: true,
    filters: (query.filters?.length ?? 0) > 0 || (query.parameters?.length ?? 0) > 0,
    data: false,
    advanced:
      (query.joins?.length ?? 0) > 0 ||
      (query.computedFields?.length ?? 0) > 0 ||
      (query.sort?.length ?? 0) > 0 ||
      query.limit != null,
  }))
  const [showSchema, setShowSchema] = useState(false)
  const [showDataTable, setShowDataTable] = useState(() => !splitPreview)
  const [editorRequest, setEditorRequest] = useState<string | null>(null)
  const { queries: savedQueries } = useWorkspaceData()
  const { listByQuery, createVisualization, updateVisualization } = useWorkspaceVisualizations()
  const isSavedQuery = Boolean(query.id) && savedQueries.some((q) => q.id === query.id)
  const visualizations = listByQuery(query.id)

  const ensureChart = useCallback(
    (options: Record<string, unknown>, name?: string) => {
      if (!isSavedQuery) return
      const existing = listByQuery(query.id).find((v) => v.type === 'CHART')
      if (existing) {
        void updateVisualization(existing.id, {
          options: { ...existing.options, ...options },
          ...(name ? { name } : {}),
        })
        return
      }
      void createVisualization({
        queryId: query.id,
        type: 'CHART',
        name: name ?? 'Chart',
        options,
      })
    },
    [createVisualization, isSavedQuery, listByQuery, query.id, updateVisualization],
  )

  const openChartEditor = useCallback(() => {
    const chart = listByQuery(query.id).find((v) => v.type === 'CHART')
    setEditorRequest(chart?.id ?? '__new__')
  }, [listByQuery, query.id])

  const toggleRail = useCallback((key: keyof typeof openRail) => {
    setOpenRail((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const activeTable = tables.find((t) => t.id === query.tableId)
  const hasLocalRows = (activeTable?.rows?.length ?? 0) > 0
  const localPreview = useMemo(
    () => (activeTable && hasLocalRows ? previewQueryRows(activeTable, query, tables) : null),
    [activeTable, hasLocalRows, query, tables],
  )
  const serverPreview = useRunQueryResult(hasLocalRows ? null : query)
  const previewRows = localPreview?.rows ?? serverPreview.rows
  const previewLoading = localPreview ? false : serverPreview.isLoading
  const previewError = localPreview?.error ?? null
  const previewDisplayRows = previewRows.slice(0, compact ? 25 : 50)
  const resultFieldHint = queryResultColumns(query)

  const queryFields = useMemo<Field[]>(
    () =>
      (activeTable?.columns ?? []).map((c) => {
        const ops = filterOperatorsForColumnType(c.type)
        return {
          name: c.name,
          label: `${c.name} (${c.type})`,
          operators: ops.map((op) => ({
            name: dataOperatorToQb(op),
            label: op,
          })),
        }
      }),
    [activeTable],
  )

  const qbQuery = useMemo<RuleGroupType>(
    () => ({
      combinator: 'and',
      rules: (query.filters ?? []).map((f) => ({
        id: f.id,
        field: f.column,
        operator: dataOperatorToQb(f.operator),
        value: f.value,
      })),
    }),
    [query.filters],
  )

  const selectedColumns = query.selectedColumns ?? []
  const groupBy = query.groupBy ?? []
  const aggregations = query.aggregations ?? []
  const gap = compact ? 'space-y-4' : 'space-y-5'

  const setFilterParam = useCallback(
    (filterId: string, param: string | undefined) => {
      onChange({
        filters: query.filters.map((filter) =>
          filter.id === filterId ? { ...filter, param } : filter,
        ),
      })
    },
    [onChange, query.filters],
  )

  if (!activeTable) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        {tables.length === 0
          ? 'No tables available. Import data before building a query.'
          : 'Select a source table for this query.'}
      </div>
    )
  }

  const previewPanel = (
    <PreviewPanel
      resultFieldHint={resultFieldHint}
      previewDisplayRows={previewDisplayRows}
      previewLoading={previewLoading}
      previewError={previewError}
      compact={compact}
      sticky={splitPreview}
      showDataTable={showDataTable}
      onToggleDataTable={() => setShowDataTable((v) => !v)}
      visualizationTabs={
        isSavedQuery ? (
          <VisualizationTabs
            query={query}
            previewRows={previewRows}
            sourceColumns={activeTable.columns}
            dashboardId={dashboardId}
            existingWidgets={existingWidgets}
            dominant={splitPreview}
            editorRequest={editorRequest}
            onEditorRequestHandled={() => setEditorRequest(null)}
          />
        ) : (
          <p className="text-xs text-[var(--sea-ink-soft)]">
            Save this query to create charts and add them to dashboards.
          </p>
        )
      }
    />
  )

  const form = (
    <div className={gap}>
      <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <div>
          <label className="text-sm font-medium text-[var(--sea-ink)]">Query name</label>
          <input
            value={query.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--sea-ink)]">Source table</label>
          <select
            value={query.tableId}
            onChange={(e) => onChange({ tableId: e.target.value })}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          >
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.storageBackend === 'parquet' ? ' (parquet)' : ''}
              </option>
            ))}
          </select>
         {/*  <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="text-[11px] text-[var(--lagoon-deep)] underline"
              onClick={() => setShowSchema((v) => !v)}
            >
              {showSchema ? 'Hide schema' : 'Schema & types'}
            </button>
            {tableActions}
          </div> */}
        </div>
      </div>

      {showSchema && (
        <ul className="space-y-1 rounded-md border border-[var(--line)] bg-[var(--surface)] p-2">
          {activeTable.columns.map((c) => (
            <li
              key={c.name}
              className="flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <span className="font-mono text-[var(--sea-ink)]">{c.name}</span>
              {onColumnTypeChange ? (
                <select
                  value={c.type}
                  onChange={(e) =>
                    onColumnTypeChange(c.name, e.target.value as DataColumnType)
                  }
                  className="h-7 rounded border border-[var(--line)] bg-[var(--surface-strong)] px-2"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="date">date</option>
                </select>
              ) : (
                <TypeBadge type={c.type} />
              )}
            </li>
          ))}
        </ul>
      )}

     {/*  {resultFieldHint.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="w-full text-[11px] font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">
            Result fields
          </span>
          {resultFieldHint.map((f) => (
            <span
              key={f}
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[11px] text-[var(--sea-ink)]"
            >
              {f}
            </span>
          ))}
        </div>
      )} */}

<RailSection
        title="Data"
        open={openRail.data}
        onToggle={() => toggleRail('data')}
        summary="Columns, group by, aggregations"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-[var(--sea-ink)]">Columns</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const allNames = activeTable.columns.map((c) => c.name)
                const allSelected =
                  allNames.length > 0 && allNames.every((name) => selectedColumns.includes(name))
                onChange({ selectedColumns: allSelected ? [] : allNames })
              }}
            >
              {activeTable.columns.length > 0 &&
              activeTable.columns.every((c) => selectedColumns.includes(c.name))
                ? 'Clear all'
                : 'Select all'}
            </Button>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {activeTable.columns.map((col) => {
              const checked = selectedColumns.includes(col.name)
              return (
                <label
                  key={col.name}
                  className="flex min-w-0 items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    className="shrink-0"
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedColumns, col.name]
                        : selectedColumns.filter((c) => c !== col.name)
                      onChange({ selectedColumns: next })
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">{col.name}</span>
                  <TypeBadge type={col.type} />
                </label>
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-[var(--sea-ink)]">GROUP BY</p>
          <div className="mt-2 space-y-2">
            {selectedColumns.map((col) => {
              const checked = groupBy.includes(col)
              const colDef = activeTable.columns.find((c) => c.name === col)
              const grain = query.groupByGrains?.[col]
              return (
                <div
                  key={col}
                  className="flex flex-wrap items-center gap-2 rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...groupBy, col]
                          : groupBy.filter((x) => x !== col)
                        const grains = { ...(query.groupByGrains ?? {}) }
                        if (!e.target.checked) delete grains[col]
                        onChange({ groupBy: next, groupByGrains: grains })
                      }}
                    />
                    <span>{col}</span>
                    {colDef ? <TypeBadge type={colDef.type} /> : null}
                  </label>
                  {checked && colDef?.type === 'date' && (
                    <select
                      value={grain ?? ''}
                      onChange={(e) => {
                        const grains = { ...(query.groupByGrains ?? {}) }
                        const v = e.target.value
                        if (!v) delete grains[col]
                        else grains[col] = v as 'day' | 'week' | 'month' | 'quarter' | 'year'
                        onChange({ groupByGrains: grains })
                      }}
                      className="h-7 rounded border border-[var(--line)] bg-[var(--surface-strong)] px-2 text-xs"
                    >
                      <option value="">Exact value</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="quarter">Quarter</option>
                      <option value="year">Year</option>
                    </select>
                  )}
                </div>
              )
            })}
          </div>
          {selectedColumns.length === 0 && (
            <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
              Select columns above to group by them.
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--sea-ink)]">Aggregations</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const numeric = firstNumericColumn(activeTable.columns)
                const col = numeric ?? activeTable.columns[0]
                onChange({
                  aggregations: [
                    ...aggregations,
                    createDefaultAggregation(col?.name ?? '', col?.type),
                  ],
                })
              }}
            >
              Add aggregation
            </Button>
          </div>
          {aggregations.length === 0 ? (
            <p className="text-xs text-[var(--sea-ink-soft)]">
              No aggregations. Query returns row-level records. Result fields = selected columns.
            </p>
          ) : (
            <div className="space-y-2">
              {aggregations.map((agg) => (
                <AggregationRow
                  key={agg.id}
                  agg={agg}
                  columns={activeTable.columns}
                  onColumnTypeChange={onColumnTypeChange}
                  onChange={(patch) =>
                    onChange({
                      aggregations: aggregations.map((a) =>
                        a.id === agg.id ? { ...a, ...patch } : a,
                      ),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      aggregations: aggregations.filter((a) => a.id !== agg.id),
                    })
                  }
                />
              ))}
              <p className="text-xs text-[var(--sea-ink-soft)]">
                SUM/AVG only on number columns. Result fields = group-by keys plus each aggregation
                alias.
              </p>
            </div>
          )}
        </div>
      </RailSection>

      <RailSection
        title="Insight"
        open={openRail.insight}
        onToggle={() => toggleRail('insight')}
        summary="Chart, break-down, measure"
      >
        <InsightPanel
          query={query}
          columns={activeTable.columns}
          visualizations={visualizations}
          onQueryChange={onChange}
          onEnsureChart={ensureChart}
          onOpenEditor={isSavedQuery ? openChartEditor : undefined}
        />
      </RailSection>

      <RailSection
        title="Filters"
        open={openRail.filters}
        onToggle={() => toggleRail('filters')}
        summary={
          (query.filters?.length ?? 0) > 0
            ? `${query.filters.length} rule${query.filters.length === 1 ? '' : 's'}`
            : 'Optional'
        }
      >
        <QueryParametersEditor
          key={query.id}
          parameters={query.parameters ?? []}
          onChange={(parameters) => onChange({ parameters })}
        />
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-[var(--sea-ink-soft)]">
            Flat AND rules. Operators follow column type. Bind a filter to a declared parameter to
            supply its value at runtime.
          </p>
          <div className="rounded border border-[var(--line)] bg-[var(--surface)] p-2 [&_.ruleGroup]:space-y-2 [&_.ruleGroup-header]:mb-1">
            <QueryBuilder
              fields={queryFields}
              query={qbQuery}
              onQueryChange={(next) => onChange({ filters: qbToDataFilters(next, query.filters) })}
              showCombinatorsBetweenRules
              controlElements={{ addGroupAction: () => null, valueEditor: FilterValueEditor }}
              context={{
                parameters: query.parameters ?? [],
                filters: query.filters,
                onBindParam: setFilterParam,
              }}
            />
          </div>
        </div>
      </RailSection>

     

      <RailSection
        title="Advanced"
        open={openRail.advanced}
        onToggle={() => toggleRail('advanced')}
        summary="Joins, formulas, sort & limit"
      >
          <JoinsSection
            query={query}
            tables={tables}
            activeTable={activeTable}
            onChange={onChange}
          />

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--sea-ink)]">Computed fields</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    computedFields: [
                      ...(query.computedFields ?? []),
                      {
                        id: `cmp-${crypto.randomUUID().slice(0, 8)}`,
                        alias: 'ratio',
                        expression: '',
                      },
                    ],
                  })
                }
              >
                Add formula
              </Button>
            </div>
            <p className="text-[11px] text-[var(--sea-ink-soft)]">
              Post-aggregation formulas using result field names, e.g. sum_reached / sum_target
            </p>
            {(query.computedFields ?? []).map((field) => (
              <div
                key={field.id}
                className="grid gap-2 rounded border border-[var(--line)] bg-[var(--surface)] p-2 md:grid-cols-[1fr,2fr,auto]"
              >
                <input
                  value={field.alias}
                  onChange={(e) =>
                    onChange({
                      computedFields: (query.computedFields ?? []).map((f) =>
                        f.id === field.id ? { ...f, alias: e.target.value } : f,
                      ),
                    })
                  }
                  className="h-8 rounded border border-[var(--line)] bg-[var(--surface-strong)] px-2 text-sm"
                  placeholder="alias"
                />
                <input
                  value={field.expression}
                  onChange={(e) =>
                    onChange({
                      computedFields: (query.computedFields ?? []).map((f) =>
                        f.id === field.id ? { ...f, expression: e.target.value } : f,
                      ),
                    })
                  }
                  className="h-8 rounded border border-[var(--line)] bg-[var(--surface-strong)] px-2 font-mono text-sm"
                  placeholder="sum_a / sum_b"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    onChange({
                      computedFields: (query.computedFields ?? []).filter((f) => f.id !== field.id),
                    })
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">
                Sort by (result field)
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  value={query.sort?.[0]?.column ?? ''}
                  onChange={(e) => {
                    const column = e.target.value
                    if (!column) {
                      onChange({ sort: [] })
                      return
                    }
                    onChange({
                      sort: [
                        {
                          column,
                          direction: query.sort?.[0]?.direction ?? 'desc',
                        },
                      ],
                    })
                  }}
                  className="h-9 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
                >
                  <option value="">None</option>
                  {resultFieldHint.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={query.sort?.[0]?.direction ?? 'desc'}
                  disabled={!query.sort?.[0]?.column}
                  onChange={(e) => {
                    const column = query.sort?.[0]?.column
                    if (!column) return
                    onChange({
                      sort: [{ column, direction: e.target.value as 'asc' | 'desc' }],
                    })
                  }}
                  className="h-9 w-24 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
                >
                  <option value="asc">ASC</option>
                  <option value="desc">DESC</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]">Row limit</label>
              <input
                type="number"
                min={1}
                placeholder="No limit"
                value={query.limit ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  onChange({ limit: raw === '' ? null : Math.max(1, Number(raw) || 1) })
                }}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
              />
            </div>
          </div>
      </RailSection>

      {footer}

      {!splitPreview && previewPanel}
    </div>
  )

  if (!splitPreview) return form

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
      <div className="min-h-0 min-w-0 overflow-y-auto pr-1 lg:w-[min(38%,420px)] lg:shrink-0 lg:pr-2">
        {form}
      </div>
      <div className="min-h-[280px] w-full min-w-0 flex-1 lg:min-h-0 lg:overflow-hidden">
        {previewPanel}
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: DataColumnType }) {
  return (
    <span className="shrink-0 rounded bg-[var(--bg-base)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--sea-ink-soft)]">
      {type}
    </span>
  )
}

function RailSection({
  title,
  open,
  onToggle,
  summary,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  summary?: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--sea-ink)]">{title}</span>
        <span className="flex items-center gap-2 text-[11px] text-[var(--sea-ink-soft)]">
          {!open && summary ? <span className="truncate">{summary}</span> : null}
          <span aria-hidden>{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open ? <div className="border-t border-[var(--line)] px-3 py-3">{children}</div> : null}
    </div>
  )
}

function PreviewPanel({
  resultFieldHint,
  previewDisplayRows,
  previewLoading,
  previewError,
  compact,
  sticky,
  showDataTable,
  onToggleDataTable,
  visualizationTabs,
}: {
  resultFieldHint: string[]
  previewDisplayRows: Record<string, unknown>[]
  previewLoading: boolean
  previewError: string | null
  compact: boolean
  sticky: boolean
  showDataTable: boolean
  onToggleDataTable: () => void
  visualizationTabs?: React.ReactNode
}) {
  return (
    <div
      className={`flex min-h-0 flex-col rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4 ${
        sticky ? 'h-full' : ''
      }`}
    >
      <div className={sticky ? 'flex min-h-0 flex-1 flex-col gap-3' : 'space-y-3'}>
        <div className={sticky ? 'min-h-0 flex-1 overflow-hidden' : undefined}>
          {visualizationTabs}
        </div>

        <div className="shrink-0 border-t border-[var(--line)] pt-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="text-sm font-medium text-[var(--lagoon-deep)] underline"
              onClick={onToggleDataTable}
            >
              {showDataTable ? 'Hide data table' : 'Show data table'}
              <span className="ml-1 font-normal text-[var(--sea-ink-soft)] no-underline">
                ({previewDisplayRows.length} rows{previewLoading ? ', loading…' : ''})
              </span>
            </button>
            {resultFieldHint.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {resultFieldHint.slice(0, 6).map((f) => (
                  <span
                    key={f}
                    className="rounded border border-[var(--line)] bg-[var(--surface-strong)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--sea-ink-soft)]"
                  >
                    {f}
                  </span>
                ))}
                {resultFieldHint.length > 6 ? (
                  <span className="text-[10px] text-[var(--sea-ink-soft)]">
                    +{resultFieldHint.length - 6}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {previewError && (
            <p className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
              {previewError}
            </p>
          )}

          {showDataTable ? (
            <div
              className={`overflow-auto ${
                sticky ? 'max-h-[220px]' : compact ? 'max-h-[240px]' : 'max-h-[320px]'
              }`}
            >
              {previewDisplayRows.length === 0 && !previewError ? (
                <p className="text-xs text-[var(--sea-ink-soft)]">No rows returned.</p>
              ) : previewDisplayRows.length === 0 ? null : (
                <table className="w-max min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--sand)] text-xs uppercase text-[var(--sea-ink-soft)]">
                    <tr>
                      {Object.keys(previewDisplayRows[0] ?? {}).map((k) => (
                        <th key={k} className="whitespace-nowrap px-3 py-2 font-medium">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewDisplayRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-[var(--line)]">
                        {Object.keys(previewDisplayRows[0] ?? {}).map((k) => (
                          <td
                            key={`${idx}-${k}`}
                            className="max-w-[220px] truncate whitespace-nowrap px-3 py-2"
                            title={String(row[k] ?? '')}
                          >
                            {String(row[k] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function JoinsSection({
  query,
  tables,
  activeTable,
  onChange,
}: {
  query: QueryDefinition
  tables: DataTable[]
  activeTable: DataTable
  onChange: (patch: Partial<QueryDefinition>) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--sea-ink)]">Joins</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={tables.length < 2}
          onClick={() => {
            const other = tables.find((t) => t.id !== query.tableId) ?? tables[0]
            onChange({
              joins: [
                ...(query.joins ?? []),
                {
                  id: `jn-${crypto.randomUUID().slice(0, 8)}`,
                  tableId: other.id,
                  type: 'left',
                  leftColumn: activeTable.columns[0]?.name ?? '',
                  rightColumn: other.columns[0]?.name ?? '',
                  alias: slugAlias(other.name) || other.name,
                },
              ],
            })
          }}
        >
          Add join
        </Button>
      </div>
      <p className="text-[11px] text-[var(--sea-ink-soft)]">
        Joined columns appear as alias__column. Set the alias explicitly — it becomes the prefix.
      </p>
      {(query.joins ?? []).map((join) => {
        const right = tables.find((t) => t.id === join.tableId)
        return (
          <div
            key={join.id}
            className="grid gap-2 rounded border border-[var(--line)] bg-[var(--surface)] p-2 md:grid-cols-2 lg:grid-cols-3"
          >
            <select
              value={join.type}
              onChange={(e) =>
                onChange({
                  joins: (query.joins ?? []).map((j) =>
                    j.id === join.id ? { ...j, type: e.target.value as 'inner' | 'left' } : j,
                  ),
                })
              }
              className="h-8 rounded border border-[var(--line)] px-2 text-sm"
            >
              <option value="left">LEFT</option>
              <option value="inner">INNER</option>
            </select>
            <select
              value={join.tableId}
              onChange={(e) => {
                const t = tables.find((x) => x.id === e.target.value)
                onChange({
                  joins: (query.joins ?? []).map((j) =>
                    j.id === join.id
                      ? {
                          ...j,
                          tableId: e.target.value,
                          rightColumn: t?.columns[0]?.name ?? '',
                          alias: j.alias?.trim()
                            ? j.alias
                            : slugAlias(t?.name ?? '') || t?.name || j.alias,
                        }
                      : j,
                  ),
                })
              }}
              className="h-8 rounded border border-[var(--line)] px-2 text-sm"
            >
              {tables
                .filter((t) => t.id !== query.tableId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <input
              value={join.alias ?? ''}
              onChange={(e) =>
                onChange({
                  joins: (query.joins ?? []).map((j) =>
                    j.id === join.id ? { ...j, alias: e.target.value } : j,
                  ),
                })
              }
              onBlur={() => {
                const cleaned = slugAlias(join.alias ?? '') || join.alias
                if (cleaned !== join.alias) {
                  onChange({
                    joins: (query.joins ?? []).map((j) =>
                      j.id === join.id ? { ...j, alias: cleaned } : j,
                    ),
                  })
                }
              }}
              className="h-8 rounded border border-[var(--line)] px-2 text-sm"
              placeholder="alias"
              aria-label="Join alias"
            />
            <select
              value={join.leftColumn}
              onChange={(e) =>
                onChange({
                  joins: (query.joins ?? []).map((j) =>
                    j.id === join.id ? { ...j, leftColumn: e.target.value } : j,
                  ),
                })
              }
              className="h-8 rounded border border-[var(--line)] px-2 text-sm"
            >
              {activeTable.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {activeTable.name}.{c.name}
                </option>
              ))}
            </select>
            <select
              value={join.rightColumn}
              onChange={(e) =>
                onChange({
                  joins: (query.joins ?? []).map((j) =>
                    j.id === join.id ? { ...j, rightColumn: e.target.value } : j,
                  ),
                })
              }
              className="h-8 rounded border border-[var(--line)] px-2 text-sm"
            >
              {(right?.columns ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {right?.name}.{c.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() =>
                onChange({
                  joins: (query.joins ?? []).filter((j) => j.id !== join.id),
                })
              }
            >
              Remove
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function AggregationRow({
  agg,
  columns,
  onChange,
  onRemove,
  onColumnTypeChange,
}: {
  agg: QueryAggregation
  columns: DataColumnDef[]
  onChange: (patch: Partial<QueryAggregation>) => void
  onRemove: () => void
  onColumnTypeChange?: (columnName: string, type: DataColumnType) => void
}) {
  const measureColumns =
    agg.operator === 'count' ? columns : columns.filter((c) => c.type === 'number')

  const autoAlias = defaultAggregationAlias(agg.operator, agg.column)
  const aliasLooksAuto =
    !agg.alias ||
    slugAlias(agg.alias) === slugAlias(autoAlias) ||
    slugAlias(agg.alias) ===
      slugAlias(`${agg.operator}_${agg.column.replace(/\s+/g, '_')}`)

  const selectedCol = columns.find((c) => c.name === agg.column)
  const needsNumberFix =
    (agg.operator === 'sum' || agg.operator === 'avg') &&
    selectedCol &&
    selectedCol.type !== 'number' &&
    onColumnTypeChange

  const applyPatch = (patch: Partial<QueryAggregation>) => {
    const nextOp = patch.operator ?? agg.operator
    let nextCol = patch.column ?? agg.column
    const nextColType = columns.find((c) => c.name === nextCol)?.type

    if (!isAggregationAllowed(nextOp, nextColType)) {
      const firstOk =
        nextOp === 'count' ? columns[0] : columns.find((c) => c.type === 'number')
      nextCol = firstOk?.name ?? ''
    }

    const next: Partial<QueryAggregation> = { ...patch, operator: nextOp, column: nextCol }
    if (aliasLooksAuto && (patch.operator != null || patch.column != null)) {
      next.alias = defaultAggregationAlias(nextOp, nextCol)
    } else if (patch.alias != null) {
      next.alias = slugAlias(patch.alias) || patch.alias
    }
    onChange(next)
  }

  return (
    <div className="space-y-1">
      <div className="grid gap-2 rounded border border-[var(--line)] bg-[var(--surface)] p-2 md:grid-cols-[110px,1fr,1fr,auto]">
        <select
          value={agg.operator}
          onChange={(e) => applyPatch({ operator: e.target.value as AggregationOperator })}
          className="h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
        >
          {AGGREGATION_OPERATORS.map((op) => (
            <option
              key={op.value}
              value={op.value}
              disabled={
                (op.value === 'sum' || op.value === 'avg') &&
                !columns.some((c) => c.type === 'number')
              }
            >
              {op.label}
            </option>
          ))}
        </select>
        <select
          value={
            measureColumns.some((c) => c.name === agg.column)
              ? agg.column
              : (measureColumns[0]?.name ?? '')
          }
          onChange={(e) => applyPatch({ column: e.target.value })}
          className="h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
        >
          {measureColumns.length === 0 ? (
            <option value="">No number columns</option>
          ) : (
            measureColumns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))
          )}
        </select>
        <input
          value={agg.alias}
          onChange={(e) => applyPatch({ alias: e.target.value })}
          onBlur={() => {
            if (agg.alias) onChange({ alias: slugAlias(agg.alias) || agg.alias })
          }}
          className="h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
          placeholder="alias"
        />
        <Button type="button" size="sm" variant="destructive" onClick={onRemove}>
          Remove
        </Button>
      </div>
      {needsNumberFix && (
        <p className="text-[11px] text-[var(--sea-ink-soft)]">
          “{selectedCol.name}” is typed as {selectedCol.type}.{' '}
          <button
            type="button"
            className="text-[var(--lagoon-deep)] underline"
            onClick={() => onColumnTypeChange(selectedCol.name, 'number')}
          >
            Mark as number
          </button>
        </p>
      )}
    </div>
  )
}

function dataOperatorToQb(op: DataFilterOperator): string {
  switch (op) {
    case 'eq':
      return '='
    case 'neq':
      return '!='
    case 'contains':
      return 'contains'
    case 'gt':
      return '>'
    case 'gte':
      return '>='
    case 'lt':
      return '<'
    case 'lte':
      return '<='
    default:
      return '='
  }
}

function qbOperatorToData(op: string): DataFilterOperator {
  switch (op) {
    case '=':
      return 'eq'
    case '!=':
      return 'neq'
    case 'contains':
      return 'contains'
    case '>':
      return 'gt'
    case '>=':
      return 'gte'
    case '<':
      return 'lt'
    case '<=':
      return 'lte'
    default:
      return 'eq'
  }
}

type FilterBuilderContext = {
  parameters: QueryParameter[]
  filters: DataFilter[]
  onBindParam: (filterId: string, param: string | undefined) => void
}

function FilterValueEditor(props: ValueEditorProps) {
  const ctx = (props as ValueEditorProps & { context?: FilterBuilderContext }).context
  const filterId = String(props.rule.id ?? '')
  const filters: DataFilter[] = ctx?.filters ?? []
  const parameters: QueryParameter[] = ctx?.parameters ?? []
  const bound = filters.find((filter) => filter.id === filterId)?.param

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ValueEditor {...props} disabled={Boolean(bound) || props.disabled} />
      <label className="flex items-center gap-1 text-[11px] text-[var(--sea-ink-soft)]">
        bind to parameter
        <select
          aria-label={`Bind ${props.rule.field} to parameter`}
          value={bound ?? ''}
          className="h-7 rounded border border-[var(--line)] bg-[var(--surface-strong)] px-2 text-xs text-[var(--sea-ink)]"
          onChange={(event) => ctx?.onBindParam(filterId, event.target.value || undefined)}
        >
          <option value="">None</option>
          {parameters.map((param) => (
            <option key={param.name} value={param.name}>
              {param.title || param.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

/** Flat rules only — nested groups are not executed by the query engine. */
function qbToDataFilters(query: RuleGroupType, previous: DataFilter[] = []): DataFilter[] {
  return query.rules
    .filter(
      (r): r is { id?: string; field: string; operator: string; value: string } =>
        typeof r === 'object' && 'field' in r,
    )
    .map((rule, idx) => {
      const id = rule.id ?? `flt-${idx}`
      const prev = previous.find((filter) => filter.id === id)
      return {
        id,
        column: rule.field,
        operator: qbOperatorToData(rule.operator),
        value: String(rule.value ?? ''),
        ...(prev?.param ? { param: prev.param } : {}),
      }
    })
}
