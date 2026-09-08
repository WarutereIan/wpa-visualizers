import { useEffect, useMemo, useRef, useState } from 'react'
import { VisualizationEditorModal } from '#/components/data/VisualizationEditorModal'
import { useVizLib } from '#/components/data/vizLibClient'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { toRedashResult } from '#/lib/redashResult'
import { DEFAULT_TABLE_VISUALIZATION, sortQueryVisualizations } from '#/lib/visualizationOrder'
import type { DataColumnDef, DataRow, QueryDefinition } from '#/types/data'
import type { VisualizationDefinition } from '#/types/visualization'

const NEW_TAB = '__new'
const pendingDefaultTable = new Set<string>()

export type VisualizationTabsProps = {
  query: QueryDefinition
  previewRows: DataRow[]
  sourceColumns: DataColumnDef[]
}

export function VisualizationTabs({ query, previewRows, sourceColumns }: VisualizationTabsProps) {
  const { Renderer, error: vizError } = useVizLib()
  const { listByQuery, createVisualization } = useWorkspaceVisualizations()
  const visualizations = sortQueryVisualizations(listByQuery(query.id))
  const data = useMemo(
    () => toRedashResult(previewRows, query, sourceColumns),
    [previewRows, query, sourceColumns],
  )

  const [activeId, setActiveId] = useState<string>('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<VisualizationDefinition | null>(null)
  const knownIds = useRef(new Set<string>())

  useEffect(() => {
    if (visualizations.some((v) => v.type === 'TABLE')) return
    if (pendingDefaultTable.has(query.id)) return
    pendingDefaultTable.add(query.id)
    void createVisualization({
      queryId: query.id,
      ...DEFAULT_TABLE_VISUALIZATION,
    }).finally(() => {
      pendingDefaultTable.delete(query.id)
    })
  }, [createVisualization, query.id, visualizations])

  useEffect(() => {
    const added = visualizations.find((v) => !knownIds.current.has(v.id))
    knownIds.current = new Set(visualizations.map((v) => v.id))
    if (added && added.type !== 'TABLE') {
      setActiveId(added.id)
      return
    }
    if (visualizations.length === 0) return
    if (!visualizations.some((v) => v.id === activeId)) {
      setActiveId(visualizations[0].id)
    }
  }, [activeId, visualizations])

  const active = visualizations.find((v) => v.id === activeId) ?? visualizations[0]

  const openCreate = () => {
    setEditing(null)
    setEditorOpen(true)
  }

  const openEdit = (viz: VisualizationDefinition) => {
    setEditing(viz)
    setEditorOpen(true)
  }

  return (
    <div className="mt-3 flex min-h-0 flex-col border-t border-[var(--line)] pt-3">
      <Tabs
        value={active?.id ?? ''}
        onValueChange={(value) => {
          if (value === NEW_TAB) {
            openCreate()
            return
          }
          setActiveId(value)
        }}
        className="gap-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="h-auto w-auto flex-1 border-b-0">
            {visualizations.map((viz) => (
              <TabsTrigger key={viz.id} value={viz.id}>
                {viz.name || viz.type}
              </TabsTrigger>
            ))}
            <TabsTrigger value={NEW_TAB} className="text-[var(--lagoon-deep)]">
              + New Visualization
            </TabsTrigger>
          </TabsList>
          {active ? (
            <Button type="button" size="sm" variant="outline" onClick={() => openEdit(active)}>
              Edit
            </Button>
          ) : null}
        </div>

        {visualizations.map((viz) => (
          <TabsContent key={viz.id} value={viz.id} className="min-h-[220px]">
            {vizError ? (
              <pre className="whitespace-pre-wrap text-xs text-red-700">{vizError}</pre>
            ) : !Renderer ? (
              <p className="text-xs text-[var(--sea-ink-soft)]">Loading visualization…</p>
            ) : (
              <div className="min-h-[220px]">
                <Renderer
                  type={viz.type}
                  options={viz.options}
                  data={data}
                  visualizationName={viz.name}
                />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <VisualizationEditorModal
        open={editorOpen}
        query={query}
        data={data}
        visualization={editing}
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
