import { useEffect, useMemo, useState } from 'react'
import { ParameterMappingForm } from '#/components/dashboard/redash/ParameterMappingForm'
import { VisualizationEditorModal } from '#/components/data/VisualizationEditorModal'
import { Button } from '#/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useRunQueryResult, useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { filterByProjectScope, matchesProjectScope } from '#/lib/projectScope'
import {
  defaultParameterMappings,
  filterQueriesByName,
  pickDefaultVisualization,
  visualizationWidgetDraft,
} from '#/lib/addWidget'
import { previewQueryRows } from '#/lib/queryPreview'
import { usedParameters } from '#/lib/queryParameters'
import { toRedashResult } from '#/lib/redashResult'
import { cn } from '#/lib/utils'
import { REDASH_VIZ_TYPE_LABELS } from '#/lib/visualizationOrder'
import type { QueryDefinition } from '#/types/data'
import type { DashboardWidget, ParameterMapping, VisualizationDefinition } from '#/types/visualization'

export type AddWidgetModalProps = {
  open: boolean
  dashboardId: string
  existingWidgets: DashboardWidget[]
  onClose: () => void
}

type BrowseGroup = {
  queryId: string
  queryName: string
  query: QueryDefinition | null
  visualizations: VisualizationDefinition[]
}

export function AddWidgetModal({
  open,
  dashboardId,
  existingWidgets,
  onClose,
}: AddWidgetModalProps) {
  const { queries, tables } = useWorkspaceData()
  const { visualizations, listByQuery } = useWorkspaceVisualizations()
  const { createWidget } = useDashboardWidgets(dashboardId)
  const { selectedProjectId } = useSelectedProject()

  const [browseSearch, setBrowseSearch] = useState('')
  const [search, setSearch] = useState('')
  const [selectedQuery, setSelectedQuery] = useState<QueryDefinition | null>(null)
  const [visualizationId, setVisualizationId] = useState<string | null>(null)
  const [parameterMappings, setParameterMappings] = useState<Record<string, ParameterMapping>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vizEditorOpen, setVizEditorOpen] = useState(false)
  const [vizIdsBeforeCreate, setVizIdsBeforeCreate] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setBrowseSearch('')
    setSearch('')
    setSelectedQuery(null)
    setVisualizationId(null)
    setParameterMappings({})
    setSaving(false)
    setError(null)
    setVizEditorOpen(false)
  }, [open])

  const queryById = useMemo(
    () => new Map(queries.map((query) => [query.id, query])),
    [queries],
  )
  const scopedQueries = useMemo(
    () => filterByProjectScope(queries, selectedProjectId),
    [queries, selectedProjectId],
  )

  const browseGroups = useMemo((): BrowseGroup[] => {
    const q = browseSearch.trim().toLowerCase()
    const filtered = visualizations.filter((viz) => {
      const query = queryById.get(viz.queryId)
      if (!matchesProjectScope(query?.projectId, selectedProjectId)) return false
      const queryName = query?.name ?? ''
      if (!q) return true
      return (
        viz.name.toLowerCase().includes(q) ||
        queryName.toLowerCase().includes(q)
      )
    })

    const groups = new Map<string, BrowseGroup>()
    for (const viz of filtered) {
      const query = queryById.get(viz.queryId) ?? null
      const queryName = query?.name ?? 'Unknown query'
      const queryId = query?.id ?? viz.queryId
      const existing = groups.get(queryId)
      if (existing) {
        existing.visualizations.push(viz)
      } else {
        groups.set(queryId, {
          queryId,
          queryName,
          query,
          visualizations: [viz],
        })
      }
    }

    for (const query of scopedQueries) {
      if (groups.has(query.id)) continue
      if (q && !query.name.toLowerCase().includes(q)) continue
      groups.set(query.id, {
        queryId: query.id,
        queryName: query.name,
        query,
        visualizations: [],
      })
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        visualizations: group.visualizations.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.queryName.localeCompare(b.queryName))
  }, [visualizations, queryById, browseSearch, selectedProjectId, scopedQueries])

  const queryTabVisualizations = selectedQuery ? listByQuery(selectedQuery.id) : []
  const parameters = selectedQuery ? usedParameters(selectedQuery) : []
  const filteredQueries = filterQueriesByName(scopedQueries, search)

  const selectedTable = selectedQuery
    ? tables.find((t) => t.id === selectedQuery.tableId)
    : undefined
  const hasLocalRows = (selectedTable?.rows?.length ?? 0) > 0
  const localPreview = useMemo(() => {
    if (!selectedQuery || !selectedTable || !hasLocalRows) return null
    return previewQueryRows(selectedTable, selectedQuery, tables)
  }, [selectedQuery, selectedTable, hasLocalRows, tables])
  const serverPreview = useRunQueryResult(
    selectedQuery && vizEditorOpen && !hasLocalRows ? selectedQuery : null,
  )
  const previewRows = localPreview?.rows ?? serverPreview.rows
  const vizEditorData = useMemo(() => {
    if (!selectedQuery || !selectedTable) {
      return { columns: [], rows: [] }
    }
    return toRedashResult(previewRows, selectedQuery, selectedTable.columns)
  }, [selectedQuery, selectedTable, previewRows])

  const selectVisualization = (viz: VisualizationDefinition) => {
    const query = queryById.get(viz.queryId) ?? null
    setSelectedQuery(query)
    setVisualizationId(viz.id)
    setParameterMappings(
      query ? defaultParameterMappings(usedParameters(query)) : {},
    )
  }

  const selectQuery = (query: QueryDefinition) => {
    setSelectedQuery(query)
    setSearch(query.name)
    const vizs = listByQuery(query.id)
    setVisualizationId(pickDefaultVisualization(vizs)?.id ?? null)
    setParameterMappings(defaultParameterMappings(usedParameters(query)))
  }

  const openNewVisualization = (query: QueryDefinition) => {
    setSelectedQuery(query)
    setSearch(query.name)
    setParameterMappings(defaultParameterMappings(usedParameters(query)))
    setVizIdsBeforeCreate(new Set(listByQuery(query.id).map((v) => v.id)))
    setVizEditorOpen(true)
  }

  const handleVizEditorClose = () => {
    setVizEditorOpen(false)
    if (!selectedQuery) return
    const after = listByQuery(selectedQuery.id)
    const created =
      after.find((v) => !vizIdsBeforeCreate.has(v.id) && v.type !== 'TABLE') ??
      after.find((v) => !vizIdsBeforeCreate.has(v.id))
    if (created) {
      setVisualizationId(created.id)
      setParameterMappings(defaultParameterMappings(usedParameters(selectedQuery)))
    }
  }

  const handleAdd = async () => {
    if (!visualizationId) return
    setSaving(true)
    setError(null)
    try {
      await createWidget(
        visualizationWidgetDraft(dashboardId, existingWidgets, visualizationId, parameterMappings),
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="sm:max-w-2xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs defaultValue="browse-all">
              <TabsList>
                <TabsTrigger value="browse-all">Browse All</TabsTrigger>
                <TabsTrigger value="search-by-query">Search by Query</TabsTrigger>
              </TabsList>

              <TabsContent value="browse-all" className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[var(--sea-ink)]">
                    Choose Visualization
                  </label>
                  <Command className="mt-1">
                    <CommandInput
                      placeholder="Search visualizations or queries…"
                      value={browseSearch}
                      onValueChange={setBrowseSearch}
                      aria-label="Search visualizations or queries"
                    />
                    <CommandList className="max-h-64">
                      {browseGroups.length === 0 ? (
                        <CommandEmpty>No queries found in this project scope.</CommandEmpty>
                      ) : (
                        browseGroups.map((group) => (
                          <div key={group.queryId}>
                            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                              <span className="text-xs font-medium text-[var(--sea-ink-soft)]">
                                {group.queryName}
                              </span>
                              {group.query ? (
                                <button
                                  type="button"
                                  className="text-[11px] font-medium text-[var(--lagoon-deep)] hover:underline"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openNewVisualization(group.query!)
                                  }}
                                >
                                  + New visualization
                                </button>
                              ) : null}
                            </div>
                            {group.visualizations.length === 0 ? (
                              <div className="px-2 pb-2 text-xs text-[var(--sea-ink-soft)]">
                                No visualizations yet — create one to add a widget.
                              </div>
                            ) : (
                              group.visualizations.map((viz) => (
                                <CommandItem
                                  key={viz.id}
                                  value={`${group.queryName} ${viz.name}`}
                                  onSelect={() => selectVisualization(viz)}
                                  className={cn(
                                    visualizationId === viz.id &&
                                      'bg-[var(--surface)] text-[var(--sea-ink)]',
                                  )}
                                >
                                  <span className="flex min-w-0 flex-1 items-center gap-2">
                                    <span className="truncate">{viz.name}</span>
                                    <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--sea-ink-soft)]">
                                      {REDASH_VIZ_TYPE_LABELS[viz.type]}
                                    </span>
                                  </span>
                                  <span className="ml-2 shrink-0 text-xs text-[var(--sea-ink-soft)]">
                                    {group.queryName}
                                  </span>
                                </CommandItem>
                              ))
                            )}
                          </div>
                        ))
                      )}
                    </CommandList>
                  </Command>
                </div>
              </TabsContent>

              <TabsContent value="search-by-query" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--sea-ink)]">
                    Choose Query
                  </label>
                  <Command className="mt-1">
                    <CommandInput
                      placeholder="Search queries…"
                      value={search}
                      onValueChange={(value) => {
                        setSearch(value)
                        if (selectedQuery && value !== selectedQuery.name) {
                          setSelectedQuery(null)
                          setVisualizationId(null)
                          setParameterMappings({})
                        }
                      }}
                      aria-label="Search queries"
                    />
                    {!selectedQuery ? (
                      <CommandList>
                        {filteredQueries.length === 0 ? (
                          <CommandEmpty>No queries found.</CommandEmpty>
                        ) : (
                          filteredQueries.map((query) => (
                            <CommandItem
                              key={query.id}
                              onSelect={() => selectQuery(query)}
                            >
                              {query.name}
                            </CommandItem>
                          ))
                        )}
                      </CommandList>
                    ) : null}
                  </Command>
                </div>

                {selectedQuery ? (
                  <div className="space-y-2">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <label
                          className="text-sm font-medium text-[var(--sea-ink)]"
                          htmlFor="widget-visualization"
                        >
                          Visualization
                        </label>
                        <Select
                          value={visualizationId ?? undefined}
                          onValueChange={setVisualizationId}
                        >
                          <SelectTrigger id="widget-visualization" className="mt-1" aria-label="Visualization">
                            <SelectValue placeholder="Select a visualization" />
                          </SelectTrigger>
                          <SelectContent>
                            {queryTabVisualizations.map((viz) => (
                              <SelectItem key={viz.id} value={viz.id}>
                                {viz.name} ({REDASH_VIZ_TYPE_LABELS[viz.type]})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openNewVisualization(selectedQuery)}
                      >
                        New visualization
                      </Button>
                    </div>
                    <p className="text-xs text-[var(--sea-ink-soft)]">
                      Create any chart type (Chart, Gauge, Treemap, Map, …) for this query, then add
                      it to the dashboard.
                    </p>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>

            {selectedQuery && parameters.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]">Parameters</p>
                <ParameterMappingForm
                  parameters={parameters}
                  value={parameterMappings}
                  onChange={setParameterMappings}
                />
              </div>
            ) : null}

            {error ? <p className="text-xs text-red-700">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!visualizationId || saving}
            >
              {saving ? 'Adding…' : 'Add to Dashboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedQuery ? (
        <VisualizationEditorModal
          open={vizEditorOpen}
          query={selectedQuery}
          data={vizEditorData}
          visualization={null}
          onClose={handleVizEditorClose}
        />
      ) : null}
    </>
  )
}
