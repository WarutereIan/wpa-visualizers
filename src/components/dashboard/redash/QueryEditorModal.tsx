import { useEffect, useMemo, useState } from 'react'
import { QueryEditor } from '#/components/data/QueryEditor'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { ProjectMoveSelect } from '#/components/layout/ProjectScopeSelect'
import { filterByProjectScope } from '#/lib/projectScope'

export type QueryEditorModalProps = {
  open: boolean
  initialQueryId?: string | null
  onClose: () => void
}

export function QueryEditorModal({ open, initialQueryId, onClose }: QueryEditorModalProps) {
  const { tables, queries, createQuery, updateQuery, updateColumnType, loading } =
    useWorkspaceData()
  const { selectedProjectId } = useSelectedProject()
  const scopedQueries = useMemo(
    () => filterByProjectScope(queries, selectedProjectId),
    [queries, selectedProjectId],
  )
  const scopedTables = useMemo(
    () => filterByProjectScope(tables, selectedProjectId),
    [tables, selectedProjectId],
  )

  const [activeQueryId, setActiveQueryId] = useState<string>(scopedQueries[0]?.id ?? '')

  useEffect(() => {
    if (!open) return
    if (initialQueryId && scopedQueries.some((q) => q.id === initialQueryId)) {
      setActiveQueryId(initialQueryId)
    } else if (scopedQueries[0]) {
      setActiveQueryId(scopedQueries[0].id)
    } else {
      setActiveQueryId('')
    }
  }, [open, initialQueryId, scopedQueries])

  const activeQuery = scopedQueries.find((q) => q.id === activeQueryId) ?? scopedQueries[0] ?? null

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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton
        className="inset-3 top-3 left-3 flex h-[calc(100dvh-1.5rem)] max-h-none w-[calc(100vw-1.5rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogHeader className="shrink-0 gap-3 border-b border-[var(--line)] px-4 py-3">
          <DialogTitle>Query Editor</DialogTitle>
          {!loading ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm font-medium text-[var(--sea-ink)]">Query</label>
              <Select
                value={activeQueryId || undefined}
                onValueChange={setActiveQueryId}
                disabled={scopedQueries.length === 0}
              >
                <SelectTrigger className="w-[min(100%,280px)]" aria-label="Select query">
                  <SelectValue placeholder="No queries" />
                </SelectTrigger>
                <SelectContent>
                  {scopedQueries.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                onClick={handleNewQuery}
                disabled={tables.length === 0}
              >
                New Query
              </Button>
              {activeQuery ? (
                <ProjectMoveSelect
                  value={activeQuery.projectId ?? null}
                  onChange={(projectId) => void updateQuery(activeQuery.id, { projectId })}
                />
              ) : null}
            </div>
          ) : null}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-[var(--sea-ink-soft)]">
            Loading workspace data…
          </div>
        ) : activeQuery ? (
          <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
            <QueryEditor
              query={activeQuery}
              tables={tables}
              compact
              splitPreview
              onChange={(patch) => void updateQuery(activeQuery.id, patch)}
              onColumnTypeChange={(columnName, type) => {
                void updateColumnType(activeQuery.tableId, columnName, type)
              }}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              {tables.length === 0
                ? 'No tables yet. Import data to start building queries.'
                : 'No queries yet. Create your first query to get started.'}
            </p>
            {tables.length > 0 ? (
              <Button type="button" onClick={handleNewQuery}>
                New Query
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
