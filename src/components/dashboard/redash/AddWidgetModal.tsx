import { useEffect, useState } from 'react'
import { ParameterMappingForm } from '#/components/dashboard/redash/ParameterMappingForm'
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
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import {
  defaultParameterMappings,
  filterQueriesByName,
  pickDefaultVisualization,
  visualizationWidgetDraft,
} from '#/lib/addWidget'
import { usedParameters } from '#/lib/queryParameters'
import type { QueryDefinition } from '#/types/data'
import type { DashboardWidget, ParameterMapping } from '#/types/visualization'

export type AddWidgetModalProps = {
  open: boolean
  dashboardId: string
  existingWidgets: DashboardWidget[]
  onClose: () => void
}

export function AddWidgetModal({
  open,
  dashboardId,
  existingWidgets,
  onClose,
}: AddWidgetModalProps) {
  const { queries } = useWorkspaceData()
  const { listByQuery } = useWorkspaceVisualizations()
  const { createWidget } = useDashboardWidgets(dashboardId)

  const [search, setSearch] = useState('')
  const [selectedQuery, setSelectedQuery] = useState<QueryDefinition | null>(null)
  const [visualizationId, setVisualizationId] = useState<string | null>(null)
  const [parameterMappings, setParameterMappings] = useState<Record<string, ParameterMapping>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedQuery(null)
    setVisualizationId(null)
    setParameterMappings({})
    setSaving(false)
    setError(null)
  }, [open])

  const visualizations = selectedQuery ? listByQuery(selectedQuery.id) : []
  const parameters = selectedQuery ? usedParameters(selectedQuery) : []
  const filteredQueries = filterQueriesByName(queries, search)

  const selectQuery = (query: QueryDefinition) => {
    setSelectedQuery(query)
    setSearch(query.name)
    const vizs = listByQuery(query.id)
    setVisualizationId(pickDefaultVisualization(vizs)?.id ?? null)
    setParameterMappings(defaultParameterMappings(usedParameters(query)))
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--sea-ink)]">Choose Visualization</label>
            <Command className="mt-1">
              <CommandInput
                placeholder="Search queries…"
                value={search}
                onValueChange={(value) => {
                  setSearch(value)
                  if (selectedQuery && value !== selectedQuery.name) setSelectedQuery(null)
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
            <div>
              <label className="text-sm font-medium text-[var(--sea-ink)]" htmlFor="widget-visualization">
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
                  {visualizations.map((viz) => (
                    <SelectItem key={viz.id} value={viz.id}>
                      {viz.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

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
  )
}
