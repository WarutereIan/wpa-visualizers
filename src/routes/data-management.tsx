import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { LocalStorageMigrationBanner } from '#/components/workspace/LocalStorageMigrationBanner'
import { QueryEditor } from '#/components/data/QueryEditor'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { downloadTableCsv } from '#/lib/api/export'
import { promoteTableBackend } from '#/lib/api/connections'
import { useOrgId, useWorkspaceReady, workspaceKeys } from '#/lib/api/workspace'
import { useQueryClient } from '@tanstack/react-query'
import { useAllDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { ProjectMoveSelect } from '#/components/layout/ProjectScopeSelect'
import { filterByProjectScope } from '#/lib/projectScope'
import {
  findQueryUsages,
  formatQueryUsageLines,
  formatQueryUsageSummary,
} from '#/lib/queryUsage'
import type { DataTable } from '#/types/data'

type DataManagementSearch = {
  queryId?: string
}

export const Route = createFileRoute('/data-management')({
  validateSearch: (search: Record<string, unknown>): DataManagementSearch => ({
    queryId: typeof search.queryId === 'string' ? search.queryId : undefined,
  }),
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
  const search = Route.useSearch()
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const {
    tables,
    queries,
    createQuery,
    updateQuery,
    removeQuery,
    removeTable,
    updateTable,
    updateColumnType,
    loading,
  } = useWorkspaceData()
  const { selectedProjectId } = useSelectedProject()
  const scopedQueries = useMemo(
    () => filterByProjectScope(queries, selectedProjectId),
    [queries, selectedProjectId],
  )
  const scopedTables = useMemo(
    () => filterByProjectScope(tables, selectedProjectId),
    [tables, selectedProjectId],
  )
  const { dashboards } = useWorkspaceDashboards()
  const { visualizations } = useWorkspaceVisualizations()
  const { widgets } = useAllDashboardWidgets()
  const [exporting, setExporting] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null)
  const [showTables, setShowTables] = useState(false)
  const queryClient = useQueryClient()

  const [userSelectedQueryId, setActiveQueryId] = useState<string | null>(null)
  const activeQueryId =
    userSelectedQueryId && scopedQueries.some((q) => q.id === userSelectedQueryId)
      ? userSelectedQueryId
      : search.queryId && scopedQueries.some((q) => q.id === search.queryId)
        ? search.queryId
        : scopedQueries[0]?.id ?? ''
  const activeQuery = scopedQueries.find((q) => q.id === activeQueryId) ?? scopedQueries[0] ?? null
  const activeTable = tables.find((t) => t.id === activeQuery?.tableId)
  const usageScan = { visualizations, widgets }
  const activeUsages = activeQuery ? findQueryUsages(dashboards, activeQuery.id, usageScan) : []

  const handleNewQuery = () => {
    const sourceTables = scopedTables.length > 0 ? scopedTables : tables
    const tableId = sourceTables[0]?.id
    const firstCols = sourceTables[0]?.columns.slice(0, 2).map((c) => c.name) ?? []
    if (!tableId) return
    void createQuery({
      name: `Query ${queries.length + 1}`,
      tableId,
      selectedColumns: firstCols,
      filters: [],
      groupBy: [],
      aggregations: [],
      projectId: selectedProjectId,
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
            Manage reusable queries and source tables. You can also create or edit queries while
            configuring widgets in the dashboard builder.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            {tables.length === 0
              ? 'No tables yet. Import data to start building queries.'
              : 'No queries in this project scope yet. Create a query or switch project.'}
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
          tables={scopedTables}
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
          onColumnTypeChange={(tableId, columnName, type) => {
            void updateColumnType(tableId, columnName, type)
          }}
          onProjectChange={(tableId, projectId) => {
            void updateTable(tableId, { projectId })
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[520px] flex-col gap-3">
      <LocalStorageMigrationBanner />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Query builder</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--sea-ink-soft)]">
            Reusable queries for dashboards. Preview stays visible while you shape the result.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setShowTables((v) => !v)}>
            {showTables ? 'Hide tables' : 'Tables & types'}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/data-management/import">Import data</Link>
          </Button>
        </div>
      </div>

      {showTables && (
        <div className="shrink-0 overflow-y-auto max-h-56">
          <TablesManager
            tables={scopedTables}
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
            onColumnTypeChange={(tableId, columnName, type) => {
              void updateColumnType(tableId, columnName, type)
            }}
            onProjectChange={(tableId, projectId) => {
              void updateTable(tableId, { projectId })
            }}
          />
        </div>
      )}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--line)] px-3 py-2 sm:px-4">
          <label className="text-xs font-medium text-[var(--sea-ink-soft)]" htmlFor="active-query">
            Query
          </label>
          <Select
            value={activeQuery?.id ?? (activeQueryId || undefined)}
            onValueChange={(id) => setActiveQueryId(id)}
          >
            <SelectTrigger id="active-query" className="h-8 w-[min(100%,280px)]" aria-label="Select query">
              <SelectValue placeholder="Select a query" />
            </SelectTrigger>
            <SelectContent>
              {scopedQueries.map((q) => {
                const tableName = tables.find((t) => t.id === q.tableId)?.name
                return (
                  <SelectItem key={q.id} value={q.id}>
                    {q.name}
                    {tableName ? ` · ${tableName}` : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {activeQuery ? (
            <ProjectMoveSelect
              value={activeQuery.projectId ?? null}
              onChange={(projectId) => void updateQuery(activeQuery.id, { projectId })}
            />
          ) : null}
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            onClick={handleNewQuery}
            disabled={tables.length === 0}
          >
            New Query
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          {activeUsages.length > 1 && (
            <div className="mb-3 shrink-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>
                {formatQueryUsageSummary(activeUsages)} Changes here update every widget that uses
                this query.
              </p>
              <ul className="mt-1 list-inside list-disc">
                {formatQueryUsageLines(activeUsages).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-hidden">
            <QueryEditor
              query={activeQuery}
              tables={tables}
              splitPreview
              onColumnTypeChange={(columnName, type) => {
                void updateColumnType(activeQuery.tableId, columnName, type)
              }}
              onChange={(patch) => void updateQuery(activeQuery.id, patch)}
              tableActions={
                activeTable && workspaceReady && orgId ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-[var(--bg-base)] px-2 py-1 font-mono text-[var(--sea-ink-soft)]">
                      {activeTable.storageBackend ?? 'jsonb'}
                      {activeTable.rowCount != null
                        ? ` · ${activeTable.rowCount.toLocaleString()} rows`
                        : ''}
                    </span>
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
                                void queryClient.invalidateQueries({
                                  queryKey: workspaceKeys.tables(orgId),
                                })
                              }
                            })
                            .finally(() => setPromoting(false))
                        }}
                      >
                        {promoting ? 'Promoting…' : 'Promote to Parquet'}
                      </Button>
                    ) : null}
                  </div>
                ) : null
              }
              footer={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--sea-ink-soft)]">
                    {formatQueryUsageSummary(activeUsages)}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const summary = formatQueryUsageSummary(activeUsages)
                      const warn =
                        activeUsages.length > 0
                          ? `${summary} Bound widgets will lose their data source. Delete anyway?`
                          : 'Delete this query?'
                      if (!window.confirm(warn)) return
                      void removeQuery(activeQuery.id)
                    }}
                  >
                    Delete query
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function TablesManager({
  tables,
  deletingTableId,
  onDelete,
  onColumnTypeChange,
  onProjectChange,
}: {
  tables: DataTable[]
  deletingTableId: string | null
  onDelete: (tableId: string) => void
  onColumnTypeChange: (
    tableId: string,
    columnName: string,
    type: 'string' | 'number' | 'boolean' | 'date',
  ) => void
  onProjectChange: (tableId: string, projectId: string | null) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--sea-ink)]">Tables</h2>
          <p className="text-xs text-[var(--sea-ink-soft)]">
            Source datasets. Fix column types so SUM/AVG only apply to numbers.
          </p>
        </div>
      </div>
      {tables.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--sea-ink-soft)]">
          No tables yet. Use <span className="font-medium">Import data</span> to add one.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {tables.map((t) => {
            const open = expandedId === t.id
            return (
              <li key={t.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => setExpandedId(open ? null : t.id)}
                  >
                    <p className="font-medium text-[var(--sea-ink)]">{t.name}</p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">
                      {t.storageBackend ?? 'jsonb'}
                      {t.rowCount != null ? ` · ${t.rowCount.toLocaleString()} rows` : ''}
                      {` · ${t.columns.length} columns`}
                      <span className="ml-2 text-[var(--lagoon-deep)]">
                        {open ? 'Hide types' : 'Edit types'}
                      </span>
                    </p>
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={deletingTableId === t.id}
                    onClick={() => onDelete(t.id)}
                  >
                    {deletingTableId === t.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
                <div className="mt-2">
                  <ProjectMoveSelect
                    value={t.projectId ?? null}
                    onChange={(projectId) => onProjectChange(t.id, projectId)}
                  />
                </div>
                {open && (
                  <ul className="mt-2 space-y-1 rounded-md border border-[var(--line)] bg-[var(--surface)] p-2">
                    {t.columns.map((c) => (
                      <li
                        key={c.name}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-mono text-[var(--sea-ink)]">{c.name}</span>
                        <select
                          value={c.type}
                          onChange={(e) =>
                            onColumnTypeChange(
                              t.id,
                              c.name,
                              e.target.value as 'string' | 'number' | 'boolean' | 'date',
                            )
                          }
                          className="h-7 rounded border border-[var(--line)] bg-[var(--surface-strong)] px-2"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="date">date</option>
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
