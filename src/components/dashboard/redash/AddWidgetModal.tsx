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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useRunQueryResult, useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { filterByProjectScope, matchesProjectScope } from '#/lib/projectScope'
import {
  defaultParameterMappings,
  filterQueriesByName,
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
  const [selectedVizIds, setSelectedVizIds] = useState<string[]>([])
  const [collapsedQueryIds, setCollapsedQueryIds] = useState<Set<string>>(() => new Set())
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
    setSelectedVizIds([])
    setCollapsedQueryIds(new Set())
    setParameterMappings({})
    setSaving(false)
    setError(null)
    setVizEditorOpen(false)
  }, [open])

  const queryById = useMemo(
    () => new Map(queries.map((query) => [query.id, query])),
    [queries],
  )
  const vizById = useMemo(
    () => new Map(visualizations.map((viz) => [viz.id, viz])),
    [visualizations],
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
  const filteredQueries = filterQueriesByName(scopedQueries, search)

  const selectedVizList = useMemo(
    () => selectedVizIds.map((id) => vizById.get(id)).filter(Boolean) as VisualizationDefinition[],
    [selectedVizIds, vizById],
  )
  const selectedQueryIds = useMemo(
    () => [...new Set(selectedVizList.map((viz) => viz.queryId))],
    [selectedVizList],
  )
  const parametersQuery =
    selectedQueryIds.length === 1 ? (queryById.get(selectedQueryIds[0]) ?? null) : null
  const parameters = parametersQuery ? usedParameters(parametersQuery) : []

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

  const syncMappingsForSelection = (nextIds: string[]) => {
    const nextVizs = nextIds
      .map((id) => vizById.get(id))
      .filter(Boolean) as VisualizationDefinition[]
    const queryIds = [...new Set(nextVizs.map((viz) => viz.queryId))]
    if (queryIds.length === 1) {
      const query = queryById.get(queryIds[0])
      setParameterMappings(query ? defaultParameterMappings(usedParameters(query)) : {})
    } else {
      setParameterMappings({})
    }
  }

  useEffect(() => {
    syncMappingsForSelection(selectedVizIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remap when selection or viz catalog changes
  }, [selectedVizIds, vizById, queryById])

  const toggleVisualization = (viz: VisualizationDefinition) => {
    setSelectedVizIds((prev) => {
      const exists = prev.includes(viz.id)
      return exists ? prev.filter((id) => id !== viz.id) : [...prev, viz.id]
    })
    setSelectedQuery(queryById.get(viz.queryId) ?? null)
  }

  const toggleGroupSelection = (group: BrowseGroup) => {
    const ids = group.visualizations.map((viz) => viz.id)
    if (ids.length === 0) return
    setSelectedVizIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id))
      return allSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    })
    if (group.query) setSelectedQuery(group.query)
  }

  const toggleCollapsed = (queryId: string) => {
    setCollapsedQueryIds((prev) => {
      const next = new Set(prev)
      if (next.has(queryId)) next.delete(queryId)
      else next.add(queryId)
      return next
    })
  }

  const selectQuery = (query: QueryDefinition) => {
    setSelectedQuery(query)
    setSearch(query.name)
    setSelectedVizIds([])
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
      setSelectedVizIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
    }
  }

  const handleAdd = async () => {
    if (selectedVizIds.length === 0) return
    setSaving(true)
    setError(null)
    try {
      let placed = [...existingWidgets]
      for (const vizId of selectedVizIds) {
        const viz = vizById.get(vizId)
        const query = viz ? queryById.get(viz.queryId) : null
        const mappings =
          parametersQuery && query && query.id === parametersQuery.id
            ? parameterMappings
            : defaultParameterMappings(query ? usedParameters(query) : [])
        const created = await createWidget(
          visualizationWidgetDraft(dashboardId, placed, vizId, mappings),
        )
        placed = [...placed, created]
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const addLabel =
    selectedVizIds.length === 0
      ? 'Add to Dashboard'
      : selectedVizIds.length === 1
        ? 'Add to Dashboard'
        : `Add ${selectedVizIds.length} to Dashboard`

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
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium text-[var(--sea-ink)]">
                      Choose visualizations
                    </label>
                    {selectedVizIds.length > 0 ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--lagoon-deep)] hover:underline"
                        onClick={() => {
                          setSelectedVizIds([])
                          setParameterMappings({})
                        }}
                      >
                        Clear selection ({selectedVizIds.length})
                      </button>
                    ) : null}
                  </div>
                  <Command className="mt-1">
                    <CommandInput
                      placeholder="Search visualizations or queries…"
                      value={browseSearch}
                      onValueChange={setBrowseSearch}
                      aria-label="Search visualizations or queries"
                    />
                    <CommandList className="max-h-[28rem]">
                      {browseGroups.length === 0 ? (
                        <CommandEmpty>No queries found in this project scope.</CommandEmpty>
                      ) : (
                        browseGroups.map((group) => {
                          const collapsed = collapsedQueryIds.has(group.queryId)
                          const groupIds = group.visualizations.map((viz) => viz.id)
                          const selectedInGroup = groupIds.filter((id) =>
                            selectedVizIds.includes(id),
                          ).length
                          const allGroupSelected =
                            groupIds.length > 0 && selectedInGroup === groupIds.length

                          return (
                            <div
                              key={group.queryId}
                              className="border-b border-[var(--line)] last:border-b-0"
                            >
                              <div className="flex items-center gap-2 bg-[var(--surface)]/60 px-2 py-2.5">
                                <button
                                  type="button"
                                  className="flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[var(--surface)]"
                                  onClick={() => toggleCollapsed(group.queryId)}
                                  aria-expanded={!collapsed}
                                >
                                  <span
                                    className="w-4 shrink-0 text-sm text-[var(--sea-ink-soft)]"
                                    aria-hidden
                                  >
                                    {collapsed ? '▸' : '▾'}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--sea-ink)]">
                                    {group.queryName}
                                  </span>
                                  <span className="shrink-0 text-xs text-[var(--sea-ink-soft)]">
                                    {group.visualizations.length} widget
                                    {group.visualizations.length === 1 ? '' : 's'}
                                    {selectedInGroup > 0 ? ` · ${selectedInGroup} selected` : ''}
                                  </span>
                                </button>
                                {groupIds.length > 0 ? (
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--lagoon-deep)] hover:bg-[var(--surface)] hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      toggleGroupSelection(group)
                                    }}
                                  >
                                    {allGroupSelected ? 'Clear' : 'Select all'}
                                  </button>
                                ) : null}
                                {group.query ? (
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--lagoon-deep)] hover:bg-[var(--surface)] hover:underline"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      openNewVisualization(group.query!)
                                    }}
                                  >
                                    + New
                                  </button>
                                ) : null}
                              </div>

                              {!collapsed ? (
                                group.visualizations.length === 0 ? (
                                  <div className="px-3 pb-2 text-xs text-[var(--sea-ink-soft)]">
                                    No visualizations yet — create one to add a widget.
                                  </div>
                                ) : (
                                  group.visualizations.map((viz) => {
                                    const checked = selectedVizIds.includes(viz.id)
                                    return (
                                      <CommandItem
                                        key={viz.id}
                                        value={`${group.queryName} ${viz.name} ${viz.id}`}
                                        onSelect={() => toggleVisualization(viz)}
                                        className={cn(
                                          'cursor-pointer',
                                          checked && 'bg-[var(--surface)] text-[var(--sea-ink)]',
                                        )}
                                      >
                                        <span className="flex min-w-0 flex-1 items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            readOnly
                                            tabIndex={-1}
                                            className="shrink-0"
                                            aria-hidden
                                          />
                                          <span className="truncate">{viz.name}</span>
                                          <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--sea-ink-soft)]">
                                            {REDASH_VIZ_TYPE_LABELS[viz.type]}
                                          </span>
                                        </span>
                                      </CommandItem>
                                    )
                                  })
                                )
                              ) : null}
                            </div>
                          )
                        })
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
                          setSelectedVizIds([])
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
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium text-[var(--sea-ink)]">
                        Visualizations
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openNewVisualization(selectedQuery)}
                      >
                        New visualization
                      </Button>
                    </div>
                    {queryTabVisualizations.length === 0 ? (
                      <p className="text-xs text-[var(--sea-ink-soft)]">
                        No visualizations yet. Create one, then add it to the dashboard.
                      </p>
                    ) : (
                      <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-[var(--line)] p-2">
                        {queryTabVisualizations.map((viz) => {
                          const checked = selectedVizIds.includes(viz.id)
                          return (
                            <li key={viz.id}>
                              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--surface)]">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleVisualization(viz)}
                                />
                                <span className="min-w-0 flex-1 truncate">{viz.name}</span>
                                <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--sea-ink-soft)]">
                                  {REDASH_VIZ_TYPE_LABELS[viz.type]}
                                </span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>

            {parametersQuery && parameters.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]">Parameters</p>
                <ParameterMappingForm
                  parameters={parameters}
                  value={parameterMappings}
                  onChange={setParameterMappings}
                />
              </div>
            ) : selectedQueryIds.length > 1 ? (
              <p className="text-xs text-[var(--sea-ink-soft)]">
                Multiple queries selected — each widget will use default parameter mappings.
              </p>
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
              disabled={selectedVizIds.length === 0 || saving}
            >
              {saving ? 'Adding…' : addLabel}
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
