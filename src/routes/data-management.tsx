import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { LocalStorageMigrationBanner } from '#/components/workspace/LocalStorageMigrationBanner'
import { Button } from '#/components/ui/button'
import { downloadTableCsv } from '#/lib/api/export'
import { promoteTableBackend } from '#/lib/api/connections'
import { useOrgId, useWorkspaceReady, workspaceKeys } from '#/lib/api/workspace'
import { useQueryClient } from '@tanstack/react-query'
import { QueryBuilder, type Field, type RuleGroupType } from 'react-querybuilder'
import 'react-querybuilder/dist/query-builder.css'
import {
  AGGREGATION_OPERATORS,
  createDefaultAggregation,
  useWorkspaceData,
  useRunQueryResult,
} from '#/hooks/useWorkspaceData'
import type {
  AggregationOperator,
  DataFilter,
  DataFilterOperator,
  DataTable,
  QueryAggregation,
} from '#/types/data'

export const Route = createFileRoute('/data-management')({
  component: DataManagementPage,
})

/** Parent layout: nested `/data-management/import` renders via `<Outlet />`. */
function DataManagementPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (pathname === '/data-management/import') {
    return <Outlet />
  }
  return <QueryBuilderPage />
}

function QueryBuilderPage() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { tables, queries, createQuery, updateQuery, removeQuery, removeTable, loading } =
    useWorkspaceData()
  const [exporting, setExporting] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const [activeQueryId, setActiveQueryId] = useState<string>(queries[0]?.id ?? '')
  const activeQuery = queries.find((q) => q.id === activeQueryId) ?? queries[0] ?? null
  const { rows: previewRows, isLoading: previewLoading } = useRunQueryResult(activeQuery)

  // All hooks must run before any early return. These memos are null-safe so
  // they can be called unconditionally, even when no activeQuery exists yet.
  const activeTable = tables.find((t) => t.id === activeQuery?.tableId)
  const queryFields = useMemo<Field[]>(
    () =>
      (activeTable?.columns ?? []).map((c) => ({
        name: c.name,
        label: c.name,
      })),
    [activeTable],
  )
  const qbQuery = useMemo<RuleGroupType>(
    () => ({
      combinator: 'and',
      rules: (activeQuery?.filters ?? []).map((f) => ({
        id: f.id,
        field: f.column,
        operator: dataOperatorToQb(f.operator),
        value: f.value,
      })),
    }),
    [activeQuery],
  )

  const handleNewQuery = () => {
    const tableId = tables[0]?.id
    const firstCols = tables[0]?.columns.slice(0, 2).map((c) => c.name) ?? []
    if (!tableId) return
    void createQuery({
      name: `Query ${queries.length + 1}`,
      tableId,
      selectedColumns: firstCols,
      filters: [],
      groupBy: [],
      aggregations: [],
    }).then((q) => setActiveQueryId(q.id))
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Loading workspace data…
      </div>
    )
  }
  if (!activeQuery) {
    return (
      <div className="space-y-6">
        <LocalStorageMigrationBanner />
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Query builder</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
            Configure reusable queries from source tables. Widgets can bind to these queries and map
            their X/Y fields in the dashboard builder.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            {tables.length === 0
              ? 'No tables yet. Import data to start building queries.'
              : 'No queries yet. Create your first query to get started.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {tables.length === 0 ? (
              <Button asChild>
                <Link to="/data-management/import">Import data</Link>
              </Button>
            ) : (
              <Button type="button" onClick={handleNewQuery}>
                New query
              </Button>
            )}
          </div>
        </div>
        <TablesManager
          tables={tables}
          deletingTableId={deletingTableId}
          onDelete={(tableId) => {
            if (
              !window.confirm(
                'Delete this table? All queries bound to it will also be removed.',
              )
            )
              return
            setDeletingTableId(tableId)
            void removeTable(tableId).finally(() => setDeletingTableId(null))
          }}
        />
      </div>
    )
  }
  const selectedColumns = activeQuery.selectedColumns
  const groupBy = activeQuery.groupBy
  const aggregations = activeQuery.aggregations
  const previewDisplayRows = previewRows.slice(0, 50)

  return (
    <div className="space-y-6">
      <LocalStorageMigrationBanner />
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Query builder</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Configure reusable queries from source tables. Widgets can bind to these queries and map
          their X/Y fields in the dashboard builder.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px,1fr]">
        <aside className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--sea-ink)]">Queries</h2>
            <Button type="button" size="sm" onClick={handleNewQuery} disabled={tables.length === 0}>
              New query
            </Button>
          </div>
          <ul className="space-y-2">
            {queries.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setActiveQueryId(q.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    (activeQuery?.id ?? activeQueryId) === q.id
                      ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.12)]'
                      : 'border-[var(--line)] bg-[var(--surface)]'
                  }`}
                >
                  <p className="font-medium text-[var(--sea-ink)]">{q.name}</p>
                  <p className="text-xs text-[var(--sea-ink-soft)]">{q.id}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {!activeTable ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
            Create a query to get started.
          </div>
        ) : (
          <section className="space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Query name</label>
                <input
                  value={activeQuery.name}
                  onChange={(e) => void updateQuery(activeQuery.id, { name: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Source table</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={activeQuery.tableId}
                    onChange={(e) => void updateQuery(activeQuery.id, { tableId: e.target.value })}
                    className="flex h-9 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.storageBackend === 'parquet' ? ' (parquet)' : ''}
                      </option>
                    ))}
                  </select>
                  {workspaceReady && orgId && activeTable ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={exporting}
                      onClick={() => {
                        setExporting(true)
                        void downloadTableCsv(orgId, activeTable.id, activeTable.name).finally(() =>
                          setExporting(false),
                        )
                      }}
                    >
                      {exporting ? 'Exporting…' : 'Export CSV'}
                    </Button>
                  ) : null}
                </div>
                {activeTable && workspaceReady && orgId ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-[var(--bg-base)] px-2 py-1 font-mono text-[var(--sea-ink-soft)]">
                      {activeTable.storageBackend ?? 'jsonb'}
                      {activeTable.rowCount != null ? ` · ${activeTable.rowCount.toLocaleString()} rows` : ''}
                    </span>
                    {activeTable.storageBackend !== 'parquet' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={promoting}
                        onClick={() => {
                          setPromoting(true)
                          void promoteTableBackend(orgId, activeTable.id)
                            .then(() => {
                              if (orgId) {
                                void queryClient.invalidateQueries({ queryKey: workspaceKeys.tables(orgId) })
                              }
                            })
                            .finally(() => setPromoting(false))
                        }}
                      >
                        {promoting ? 'Promoting…' : 'Promote to Parquet'}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--sea-ink)]">Columns</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeTable.columns.map((col) => {
                  const checked = selectedColumns.includes(col.name)
                  return (
                    <label
                      key={col.name}
                      className="flex items-center gap-2 rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedColumns, col.name]
                            : selectedColumns.filter((c) => c !== col.name)
                          void updateQuery(activeQuery.id, { selectedColumns: next })
                        }}
                      />
                      <span>{col.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--sea-ink)]">Filters (React Query Builder)</p>
              <div className="rounded border border-[var(--line)] bg-[var(--surface)] p-2">
                <QueryBuilder
                  fields={queryFields}
                  query={qbQuery}
                  onQueryChange={(next) => {
                    void updateQuery(activeQuery.id, {
                      filters: qbToDataFilters(next),
                    })
                  }}
                  showCombinatorsBetweenRules
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--sea-ink)]">GROUP BY</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {selectedColumns.map((col) => {
                  const checked = groupBy.includes(col)
                  return (
                    <label
                      key={col}
                      className="flex items-center gap-2 rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...groupBy, col]
                            : groupBy.filter((x) => x !== col)
                          void updateQuery(activeQuery.id, { groupBy: next })
                        }}
                      />
                      <span>{col}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--sea-ink)]">Aggregations</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void updateQuery(activeQuery.id, {
                      aggregations: [
                        ...aggregations,
                        createDefaultAggregation(selectedColumns[0] ?? ''),
                      ],
                    })
                  }
                >
                  Add aggregation
                </Button>
              </div>
              {aggregations.length === 0 ? (
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  No aggregations. Query returns row-level records.
                </p>
              ) : (
                <div className="space-y-2">
                  {aggregations.map((agg) => (
                    <AggregationRow
                      key={agg.id}
                      agg={agg}
                      columns={activeTable.columns.map((c) => c.name)}
                      onChange={(patch) =>
                        void updateQuery(activeQuery.id, {
                          aggregations: aggregations.map((a) =>
                            a.id === agg.id ? { ...a, ...patch } : a,
                          ),
                        })
                      }
                      onRemove={() =>
                        void updateQuery(activeQuery.id, {
                          aggregations: aggregations.filter((a) => a.id !== agg.id),
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="destructive" size="sm" onClick={() => void removeQuery(activeQuery.id)}>
                Delete query
              </Button>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
              <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]">
                Preview ({previewDisplayRows.length} rows{previewLoading ? ', loading…' : ''})
              </p>
              <div className="max-h-[280px] overflow-auto">
                {previewDisplayRows.length === 0 ? (
                  <p className="text-xs text-[var(--sea-ink-soft)]">No rows returned.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[var(--sand)] text-xs uppercase text-[var(--sea-ink-soft)]">
                      <tr>
                        {Object.keys(previewDisplayRows[0] ?? {}).map((k) => (
                          <th key={k} className="px-2 py-1.5">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewDisplayRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-[var(--line)]">
                          {Object.keys(previewDisplayRows[0] ?? {}).map((k) => (
                            <td key={`${idx}-${k}`} className="px-2 py-1.5">
                              {String(row[k] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      <TablesManager
        tables={tables}
        deletingTableId={deletingTableId}
        onDelete={(tableId) => {
          if (
            !window.confirm(
              'Delete this table? All queries bound to it will also be removed.',
            )
          )
            return
          setDeletingTableId(tableId)
          void removeTable(tableId).finally(() => setDeletingTableId(null))
        }}
      />
    </div>
  )
}

function TablesManager({
  tables,
  deletingTableId,
  onDelete,
}: {
  tables: DataTable[]
  deletingTableId: string | null
  onDelete: (tableId: string) => void
}) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--sea-ink)]">Tables</h2>
          <p className="text-xs text-[var(--sea-ink-soft)]">
            Source datasets for queries. Deleting a table removes its bound queries too.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/data-management/import">Import data</Link>
        </Button>
      </div>
      {tables.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--sea-ink-soft)]">
          No tables yet. Use <span className="font-medium">Import data</span> to add one.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {tables.map((t) => {
            return (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--sea-ink)]">{t.name}</p>
                  <p className="text-xs text-[var(--sea-ink-soft)]">
                    {t.storageBackend ?? 'jsonb'}
                    {t.rowCount != null ? ` · ${t.rowCount.toLocaleString()} rows` : ''}
                    {` · ${t.columns.length} columns`}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={deletingTableId === t.id}
                  onClick={() => onDelete(t.id)}
                >
                  {deletingTableId === t.id ? 'Deleting…' : 'Delete'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function AggregationRow({
  agg,
  columns,
  onChange,
  onRemove,
}: {
  agg: QueryAggregation
  columns: string[]
  onChange: (patch: Partial<QueryAggregation>) => void
  onRemove: () => void
}) {
  return (
    <div className="grid gap-2 rounded border border-[var(--line)] bg-[var(--surface)] p-2 md:grid-cols-[110px,1fr,1fr,auto]">
      <select
        value={agg.operator}
        onChange={(e) => onChange({ operator: e.target.value as AggregationOperator })}
        className="h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
      >
        {AGGREGATION_OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <select
        value={agg.column}
        onChange={(e) => onChange({ column: e.target.value })}
        className="h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
      >
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        value={agg.alias}
        onChange={(e) => onChange({ alias: e.target.value })}
        className="h-8 rounded border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
        placeholder="alias"
      />
      <Button type="button" size="sm" variant="destructive" onClick={onRemove}>
        Remove
      </Button>
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

function qbToDataFilters(query: RuleGroupType): DataFilter[] {
  return query.rules
    .filter((r): r is { id?: string; field: string; operator: string; value: string } =>
      typeof r === 'object' && 'field' in r,
    )
    .map((rule, idx) => ({
      id: rule.id ?? `flt-${idx}`,
      column: rule.field,
      operator: qbOperatorToData(rule.operator),
      value: String(rule.value ?? ''),
    }))
}
