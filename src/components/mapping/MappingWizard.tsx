import { useMemo, useState } from 'react'
import type { MappingDefinition, MappingSource } from '#/types/mapping'
import type { VisualizationDefinition } from '#/types/visualization'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { useChoroplethMaps } from '#/hooks/useChoroplethMaps'
import { useVisualizationResult } from '#/hooks/useVisualizationResult'
import { guessGeoColumns } from '#/lib/geo'
import {
  getDefaultChoroplethOptions,
  type ChoroplethAvailableMaps,
} from '#/lib/geo/mapRegistry'
import {
  isChoroplethMappingConfigured,
  mappingFieldsFromOptions,
} from '#/lib/geo/choroplethMapping'
import { ChoroplethAuthoringHint } from '#/components/data/ChoroplethAuthoringHint'
import { Button } from '#/components/ui/button'

const LABELS = ['Basics', 'Source', 'Configure', 'Review'] as const

const EMPTY_DATASET_FIELDS = {
  dataTableId: null as string | null,
  latitudeColumn: null as string | null,
  longitudeColumn: null as string | null,
  labelColumn: null as string | null,
}

const EMPTY_CHOROPLETH_FIELDS = {
  queryId: null as string | null,
  visualizationId: null as string | null,
  mapType: null as string | null,
  keyColumn: null as string | null,
  valueColumn: null as string | null,
  targetField: null as string | null,
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function targetFieldKeys(maps: ChoroplethAvailableMaps, mapType: string | null | undefined): string[] {
  if (!mapType) return []
  return Object.keys(maps[mapType]?.fieldNames ?? {})
}

function defaultTargetField(maps: ChoroplethAvailableMaps, mapType: string | null | undefined): string | null {
  const keys = targetFieldKeys(maps, mapType)
  if (keys.includes('code')) return 'code'
  return keys[0] ?? null
}

export interface MappingWizardProps {
  initialDraft: MappingDefinition
  onComplete: (next: MappingDefinition) => void
  onCancel: () => void
  title: string
  subtitle?: string
}

export function MappingWizard({
  initialDraft,
  onComplete,
  onCancel,
  title,
  subtitle,
}: MappingWizardProps) {
  const maxStep = LABELS.length - 1
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<MappingDefinition>(initialDraft)
  const { tables, queries } = useWorkspaceData()
  const { listByQuery } = useWorkspaceVisualizations()
  const choroplethMaps = useChoroplethMaps()
  const choroplethQueryId = draft.source === 'choropleth' ? (draft.queryId ?? null) : null
  const { result: choroplethPreview, isLoading: choroplethPreviewLoading, error: choroplethPreviewError } =
    useVisualizationResult(choroplethQueryId, {}, 0)

  const selectedTable = draft.dataTableId
    ? tables.find((t) => t.id === draft.dataTableId)
    : undefined
  const columnNames = selectedTable?.columns.map((c) => c.name) ?? []
  const selectedQuery = draft.queryId ? queries.find((q) => q.id === draft.queryId) : undefined
  const choroplethVisualizations = draft.queryId
    ? listByQuery(draft.queryId).filter((v) => v.type === 'CHOROPLETH')
    : []
  const previewColumns = choroplethPreview?.columns.map((c) => c.name) ?? []
  const mapFieldNames = draft.mapType ? choroplethMaps[draft.mapType]?.fieldNames ?? {} : {}

  const currentKind = ['basics', 'source', 'configure', 'review'][stepIndex] as
    | 'basics'
    | 'source'
    | 'configure'
    | 'review'

  const canGoNext = useMemo(() => {
    if (currentKind === 'basics') return draft.name.trim().length > 0
    if (currentKind === 'source') return true
    if (currentKind === 'configure') {
      if (draft.source === 'dataset_table') {
        if (!draft.dataTableId) return false
        const lat = draft.latitudeColumn?.trim()
        const lng = draft.longitudeColumn?.trim()
        if (!lat || !lng || lat === lng) return false
        const names = selectedTable?.columns.map((c) => c.name) ?? []
        return names.includes(lat) && names.includes(lng)
      }
      if (draft.source === 'external_url')
        return Boolean(draft.externalMapUrl?.trim()) && isValidHttpUrl(draft.externalMapUrl!)
      if (draft.source === 'baseline_embed') return true
      if (draft.source === 'choropleth') {
        if (!isChoroplethMappingConfigured(draft)) return false
        if (!(draft.mapType && draft.mapType in choroplethMaps)) return false
        const fields = targetFieldKeys(choroplethMaps, draft.mapType)
        if (!draft.targetField || !fields.includes(draft.targetField)) return false
        if (choroplethPreviewLoading || choroplethPreviewError) return false
        if (previewColumns.length === 0) return false
        return (
          previewColumns.includes(draft.keyColumn!) && previewColumns.includes(draft.valueColumn!)
        )
      }
    }
    return true
  }, [
    currentKind,
    draft,
    selectedTable,
    tables,
    choroplethMaps,
    choroplethPreviewLoading,
    choroplethPreviewError,
    previewColumns,
  ])

  const goNext = () => {
    if (!canGoNext) return
    if (stepIndex < maxStep) setStepIndex((s) => s + 1)
  }

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1)
  }

  const finish = () => {
    onComplete({
      ...draft,
      updatedAt: new Date().toISOString(),
    })
  }

  const applyVisualization = (viz: VisualizationDefinition | null) => {
    const fromViz = viz ? mappingFieldsFromOptions(viz.options) : null
    setDraft((d) => ({
      ...d,
      visualizationId: viz?.id ?? null,
      mapType: fromViz?.mapType ?? d.mapType,
      keyColumn: fromViz?.keyColumn ?? d.keyColumn,
      valueColumn: fromViz?.valueColumn ?? d.valueColumn,
      targetField: fromViz?.targetField ?? d.targetField,
    }))
  }

  const setSource = (source: MappingSource) => {
    setDraft((d) => {
      if (source === 'dataset_table') {
        const tid = d.dataTableId ?? tables[0]?.id ?? null
        const names = tables.find((t) => t.id === tid)?.columns.map((c) => c.name) ?? []
        const g = guessGeoColumns(names)
        return {
          ...d,
          source,
          ...EMPTY_CHOROPLETH_FIELDS,
          dataTableId: tid,
          externalMapUrl: null,
          latitudeColumn: g.latitude,
          longitudeColumn: g.longitude,
          labelColumn: null,
        }
      }
      if (source === 'choropleth') {
        const defaults = getDefaultChoroplethOptions(choroplethMaps)
        const mapType =
          d.mapType && d.mapType in choroplethMaps ? d.mapType : ((defaults.mapType as string) ?? null)
        return {
          ...d,
          source,
          ...EMPTY_DATASET_FIELDS,
          externalMapUrl: null,
          queryId: d.queryId,
          visualizationId: d.visualizationId,
          mapType,
          keyColumn: d.keyColumn,
          valueColumn: d.valueColumn,
          targetField: d.targetField ?? defaultTargetField(choroplethMaps, mapType),
        }
      }
      return {
        ...d,
        source,
        ...EMPTY_DATASET_FIELDS,
        ...EMPTY_CHOROPLETH_FIELDS,
        externalMapUrl: source === 'external_url' ? d.externalMapUrl : null,
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{subtitle}</p>
        )}
      </div>

      <nav aria-label="Wizard progress" className="flex flex-wrap gap-2">
        {LABELS.map((label, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                active
                  ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.15)] text-[var(--lagoon-deep)]'
                  : done
                    ? 'border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)]'
                    : 'border-[var(--line)] text-[var(--sea-ink-soft)]'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active || done ? 'bg-[var(--lagoon)] text-white' : 'bg-[var(--sand)]'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {label}
            </div>
          )
        })}
      </nav>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:p-6">
        {currentKind === 'basics' && (
          <div className="mx-auto max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Mapping details</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Name this mapping. You can open it anytime from the sidebar.
            </p>
            <div>
              <label htmlFor="map-wiz-name" className="text-sm font-medium text-[var(--sea-ink)]">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                id="map-wiz-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                placeholder="e.g. Indicators by district"
              />
            </div>
            <div>
              <label htmlFor="map-wiz-desc" className="text-sm font-medium text-[var(--sea-ink)]">
                Description
              </label>
              <textarea
                id="map-wiz-desc"
                value={draft.description ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {currentKind === 'source' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">What to show</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Choose a dataset with coordinates, a regional choropleth, an external map URL, or the
              program baseline map.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              <li>
                <button
                  type="button"
                  onClick={() => setSource('dataset_table')}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    draft.source === 'dataset_table'
                      ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--lagoon)]/50'
                  }`}
                >
                  <span className="font-semibold text-[var(--sea-ink)]">Dataset table</span>
                  <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                    Plot rows on an interactive map (Leaflet) using latitude and longitude columns.
                  </p>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSource('choropleth')}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    draft.source === 'choropleth'
                      ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--lagoon)]/50'
                  }`}
                >
                  <span className="font-semibold text-[var(--sea-ink)]">Choropleth (regions)</span>
                  <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                    Color regions from a query using the same choropleth renderer as dashboards.
                  </p>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSource('external_url')}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    draft.source === 'external_url'
                      ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--lagoon)]/50'
                  }`}
                >
                  <span className="font-semibold text-[var(--sea-ink)]">External map URL</span>
                  <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                    Embed any https map or dashboard in an iframe.
                  </p>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSource('baseline_embed')}
                  className={`w-full rounded-xl border-2 p-4 text-left transition ${
                    draft.source === 'baseline_embed'
                      ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--lagoon)]/50'
                  }`}
                >
                  <span className="font-semibold text-[var(--sea-ink)]">Baseline map</span>
                  <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                    Same embed as the quick Baseline mapping page (env URL).
                  </p>
                </button>
              </li>
            </ul>
          </div>
        )}

        {currentKind === 'configure' && (
          <div className="mx-auto max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Configure</h2>

            {draft.source === 'dataset_table' && (
              <>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Pick a table from the data layer. Import more under Data management → Data import.
                </p>
                {tables.length === 0 ? (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    No tables available yet. Import data first, then return to this wizard.
                  </p>
                ) : (
                  <>
                    <div>
                      <label htmlFor="map-table" className="text-sm font-medium text-[var(--sea-ink)]">
                        Table <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="map-table"
                        value={draft.dataTableId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value || null
                          const names =
                            tables.find((t) => t.id === id)?.columns.map((c) => c.name) ?? []
                          const g = guessGeoColumns(names)
                          setDraft((d) => ({
                            ...d,
                            dataTableId: id,
                            labelColumn: null,
                            latitudeColumn: g.latitude,
                            longitudeColumn: g.longitude,
                          }))
                        }}
                        className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                      >
                        <option value="">Select…</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedTable && columnNames.length > 0 && (
                      <>
                        <div>
                          <label
                            htmlFor="map-lat-col"
                            className="text-sm font-medium text-[var(--sea-ink)]"
                          >
                            Latitude column <span className="text-red-600">*</span>
                          </label>
                          <select
                            id="map-lat-col"
                            value={draft.latitudeColumn ?? ''}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                latitudeColumn: e.target.value || null,
                              }))
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                          >
                            <option value="">Select…</option>
                            {columnNames.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                            WGS84 latitude (−90…90). Numbers or parseable strings.
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="map-lng-col"
                            className="text-sm font-medium text-[var(--sea-ink)]"
                          >
                            Longitude column <span className="text-red-600">*</span>
                          </label>
                          <select
                            id="map-lng-col"
                            value={draft.longitudeColumn ?? ''}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                longitudeColumn: e.target.value || null,
                              }))
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                          >
                            <option value="">Select…</option>
                            {columnNames.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                            WGS84 longitude (−180…180).
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="map-label-col"
                            className="text-sm font-medium text-[var(--sea-ink)]"
                          >
                            Label column (optional)
                          </label>
                          <select
                            id="map-label-col"
                            value={draft.labelColumn ?? ''}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                labelColumn: e.target.value || null,
                              }))
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                          >
                            <option value="">None</option>
                            {columnNames.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                            Used for marker titles and popups (e.g. district or site name).
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {draft.source === 'choropleth' && (
              <>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Pick a query, join its region key to a boundary map, and choose the value to color.
                </p>
                <ChoroplethAuthoringHint />
                {queries.length === 0 ? (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    No queries yet. Create a query under Data management, then return to this wizard.
                  </p>
                ) : (
                  <>
                    <div>
                      <label htmlFor="map-query" className="text-sm font-medium text-[var(--sea-ink)]">
                        Query <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="map-query"
                        value={draft.queryId ?? ''}
                        onChange={(e) => {
                          const id = e.target.value || null
                          setDraft((d) => ({
                            ...d,
                            queryId: id,
                            visualizationId: null,
                            keyColumn: null,
                            valueColumn: null,
                          }))
                        }}
                        className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                      >
                        <option value="">Select…</option>
                        {queries.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {draft.queryId ? (
                      <div>
                        <label
                          htmlFor="map-choropleth-viz"
                          className="text-sm font-medium text-[var(--sea-ink)]"
                        >
                          Saved visualization (optional)
                        </label>
                        <select
                          id="map-choropleth-viz"
                          value={draft.visualizationId ?? ''}
                          onChange={(e) => {
                            const id = e.target.value || null
                            const viz = choroplethVisualizations.find((v) => v.id === id) ?? null
                            applyVisualization(viz)
                          }}
                          className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                        >
                          <option value="">Configure inline</option>
                          {choroplethVisualizations.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name || 'Choropleth'}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                          Link an existing choropleth visualization, or leave blank to use the fields
                          below.
                        </p>
                      </div>
                    ) : null}

                    {draft.queryId && choroplethPreviewError ? (
                      <p className="text-sm text-red-700">{choroplethPreviewError}</p>
                    ) : null}
                    {draft.queryId && choroplethPreviewLoading ? (
                      <p className="text-sm text-[var(--sea-ink-soft)]">Running query for columns…</p>
                    ) : null}

                    {draft.queryId && !choroplethPreviewLoading && previewColumns.length > 0 ? (
                      <>
                        <div>
                          <label
                            htmlFor="map-key-col"
                            className="text-sm font-medium text-[var(--sea-ink)]"
                          >
                            Key column <span className="text-red-600">*</span>
                          </label>
                          <select
                            id="map-key-col"
                            value={draft.keyColumn ?? ''}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, keyColumn: e.target.value || null }))
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                          >
                            <option value="">Select…</option>
                            {previewColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                            Query column that matches a GeoJSON property (usually a region code or name).
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="map-value-col"
                            className="text-sm font-medium text-[var(--sea-ink)]"
                          >
                            Value column <span className="text-red-600">*</span>
                          </label>
                          <select
                            id="map-value-col"
                            value={draft.valueColumn ?? ''}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, valueColumn: e.target.value || null }))
                            }
                            className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                          >
                            <option value="">Select…</option>
                            {previewColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : null}

                    <div>
                      <label htmlFor="map-type" className="text-sm font-medium text-[var(--sea-ink)]">
                        Map <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="map-type"
                        value={draft.mapType ?? ''}
                        onChange={(e) => {
                          const mapType = e.target.value || null
                          setDraft((d) => ({
                            ...d,
                            mapType,
                            targetField:
                              mapType && d.targetField && targetFieldKeys(choroplethMaps, mapType).includes(d.targetField)
                                ? d.targetField
                                : defaultTargetField(choroplethMaps, mapType),
                          }))
                        }}
                        className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                      >
                        <option value="">Select…</option>
                        {Object.entries(choroplethMaps).map(([id, entry]) => (
                          <option key={id} value={id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {draft.mapType ? (
                      <div>
                        <label
                          htmlFor="map-target-field"
                          className="text-sm font-medium text-[var(--sea-ink)]"
                        >
                          Target field <span className="text-red-600">*</span>
                        </label>
                        <select
                          id="map-target-field"
                          value={draft.targetField ?? ''}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, targetField: e.target.value || null }))
                          }
                          className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                        >
                          <option value="">Select…</option>
                          {Object.entries(mapFieldNames).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                          GeoJSON property that must match the key column values.
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}

            {draft.source === 'external_url' && (
              <>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Enter a full <code className="rounded bg-[var(--surface)] px-1">https://</code>{' '}
                  URL. The page must allow embedding (some sites block iframes).
                </p>
                <div>
                  <label htmlFor="map-url" className="text-sm font-medium text-[var(--sea-ink)]">
                    Map URL <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="map-url"
                    type="url"
                    value={draft.externalMapUrl ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, externalMapUrl: e.target.value || null }))
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                    placeholder="https://…"
                  />
                </div>
              </>
            )}

            {draft.source === 'baseline_embed' && (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                No extra settings. The baseline map uses{' '}
                <code className="rounded bg-[var(--surface)] px-1">VITE_BASELINE_MAP_URL</code> when
                set, otherwise a default OpenStreetMap embed.
              </p>
            )}
          </div>
        )}

        {currentKind === 'review' && (
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Review</h2>
            <dl className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Name</dt>
                <dd className="text-[var(--sea-ink)]">{draft.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Description</dt>
                <dd className="text-[var(--sea-ink)]">
                  {draft.description?.trim() ? draft.description : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Source</dt>
                <dd className="text-[var(--sea-ink)]">
                  {draft.source === 'dataset_table' && 'Dataset table'}
                  {draft.source === 'choropleth' && 'Choropleth (regions)'}
                  {draft.source === 'external_url' && 'External URL'}
                  {draft.source === 'baseline_embed' && 'Baseline map embed'}
                </dd>
              </div>
              {draft.source === 'dataset_table' && (
                <>
                  <div>
                    <dt className="font-medium text-[var(--sea-ink-soft)]">Table</dt>
                    <dd className="text-[var(--sea-ink)]">
                      {selectedTable?.name ?? draft.dataTableId ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--sea-ink-soft)]">Coordinates</dt>
                    <dd className="text-[var(--sea-ink)]">
                      {draft.latitudeColumn ?? '—'}, {draft.longitudeColumn ?? '—'}
                    </dd>
                  </div>
                </>
              )}
              {draft.source === 'choropleth' && (
                <>
                  <div>
                    <dt className="font-medium text-[var(--sea-ink-soft)]">Query</dt>
                    <dd className="text-[var(--sea-ink)]">
                      {selectedQuery?.name ?? draft.queryId ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--sea-ink-soft)]">Map</dt>
                    <dd className="text-[var(--sea-ink)]">
                      {draft.mapType ? (choroplethMaps[draft.mapType]?.name ?? draft.mapType) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-[var(--sea-ink-soft)]">Join</dt>
                    <dd className="text-[var(--sea-ink)]">
                      {draft.keyColumn ?? '—'} → {draft.targetField ?? '—'} · value{' '}
                      {draft.valueColumn ?? '—'}
                    </dd>
                  </div>
                </>
              )}
              {draft.source === 'external_url' && (
                <div>
                  <dt className="font-medium text-[var(--sea-ink-soft)]">URL</dt>
                  <dd className="break-all text-[var(--sea-ink)]">{draft.externalMapUrl ?? '—'}</dd>
                </div>
              )}
            </dl>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Saved mappings are stored in your browser until a server API is connected.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          {stepIndex < maxStep ? (
            <Button type="button" onClick={goNext} disabled={!canGoNext}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={finish}>
              Create mapping
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
