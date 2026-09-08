import { Link } from '@tanstack/react-router'
import { useVizLib } from '#/components/data/vizLibClient'
import { Button } from '#/components/ui/button'
import { useVisualizationResult } from '#/hooks/useVisualizationResult'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { buildChoroplethRendererOptions } from '#/lib/geo/choroplethMapping'
import type { MappingDefinition } from '#/types/mapping'

export interface ChoroplethMappingViewProps {
  mapping: MappingDefinition
  onDelete?: () => void
}

export function ChoroplethMappingView({ mapping, onDelete }: ChoroplethMappingViewProps) {
  const { Renderer, error: vizError } = useVizLib()
  const { visualizations } = useWorkspaceVisualizations()
  const visualization = mapping.visualizationId
    ? (visualizations.find((item) => item.id === mapping.visualizationId) ?? null)
    : null
  const { result, query, isLoading, error } = useVisualizationResult(mapping.queryId ?? null, {}, 0)
  const options = buildChoroplethRendererOptions(mapping, visualization)
  const resolvedMapType = typeof options.mapType === 'string' ? options.mapType : mapping.mapType
  const resolvedKey = typeof options.keyColumn === 'string' ? options.keyColumn : mapping.keyColumn
  const resolvedTarget =
    typeof options.targetField === 'string' ? options.targetField : mapping.targetField

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">{mapping.name}</h1>
          {mapping.description?.trim() ? (
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{mapping.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/mappings">All mappings</Link>
          </Button>
          {onDelete ? (
            <Button type="button" variant="outline" size="sm" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {!mapping.queryId ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
          This choropleth mapping has no query. Recreate it with the wizard and choose a query.
        </div>
      ) : vizError ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-red-700">
          {vizError}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-red-700">
          {error}
        </div>
      ) : isLoading || !result ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
          {isLoading ? 'Loading choropleth…' : 'No data'}
        </div>
      ) : !Renderer ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center text-sm text-[var(--sea-ink-soft)]">
          Loading visualization…
        </div>
      ) : (
        <>
          <p className="text-xs text-[var(--sea-ink-soft)]">
            Choropleth
            {query?.name ? (
              <>
                {' · '}
                <span className="font-medium text-[var(--sea-ink)]">{query.name}</span>
              </>
            ) : null}
            {resolvedMapType ? (
              <>
                {' · '}
                <span className="font-medium text-[var(--sea-ink)]">{resolvedMapType}</span>
              </>
            ) : null}
            {' · '}
            <span className="font-medium text-[var(--sea-ink)]">{resolvedKey ?? 'key'}</span>
            {' → '}
            <span className="font-medium text-[var(--sea-ink)]">{resolvedTarget ?? 'target'}</span>
          </p>
          <div className="relative h-[min(70vh,640px)] min-h-[420px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
            <div className="absolute inset-0 [&_.visualization-renderer]:h-full [&_.visualization-renderer-wrapper]:h-full [&_.map-visualization-container]:h-full">
              <Renderer
                type="CHOROPLETH"
                options={options}
                data={result}
                visualizationName={mapping.name}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
