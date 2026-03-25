import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { MappingDefinition } from '#/types/mapping'
import { getBaselineMapUrl } from '#/lib/env'
import { guessGeoColumns } from '#/lib/geo'
import { useDataStore } from '#/stores/dataStore'
import { Button } from '#/components/ui/button'
import { DatasetLeafletMap } from '#/components/mapping/DatasetLeafletMap'

const MAX_MAP_ROWS = 500

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export interface MappingViewerProps {
  mapping: MappingDefinition
  /** Shown for dataset and iframe views when provided */
  onDelete?: () => void
}

export function MappingViewer({ mapping, onDelete }: MappingViewerProps) {
  const getTableById = useDataStore((s) => s.getTableById)

  const iframeSrc = useMemo(() => {
    if (mapping.source === 'baseline_embed') return getBaselineMapUrl()
    if (mapping.source === 'external_url' && mapping.externalMapUrl) {
      const u = mapping.externalMapUrl.trim()
      return isValidHttpUrl(u) ? u : null
    }
    return null
  }, [mapping])

  if (mapping.source === 'dataset_table') {
    const table = mapping.dataTableId ? getTableById(mapping.dataTableId) : undefined
    if (!table) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-[var(--sea-ink)]">{mapping.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/mappings">All mappings</Link>
              </Button>
              {onDelete && (
                <Button type="button" variant="outline" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
            The linked dataset was removed or is unavailable. Import data under Data management → Data
            import, or delete this mapping.
          </div>
        </div>
      )
    }

    const columnNames = table.columns.map((c) => c.name)
    const inferred = guessGeoColumns(columnNames)
    const latCol =
      (mapping.latitudeColumn && columnNames.includes(mapping.latitudeColumn)
        ? mapping.latitudeColumn
        : null) ?? inferred.latitude
    const lngCol =
      (mapping.longitudeColumn && columnNames.includes(mapping.longitudeColumn)
        ? mapping.longitudeColumn
        : null) ?? inferred.longitude
    const labelCol =
      mapping.labelColumn && columnNames.includes(mapping.labelColumn)
        ? mapping.labelColumn
        : null

    const rows = table.rows.slice(0, MAX_MAP_ROWS)

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
            {onDelete && (
              <Button type="button" variant="outline" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>

        {!latCol || !lngCol ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--sea-ink)]">
            This mapping has no latitude/longitude columns set, and none could be inferred. Edit the
            mapping (recreate with the wizard) and choose columns that contain WGS84 coordinates.
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Map: OpenStreetMap · {rows.length} row{rows.length === 1 ? '' : 's'}
              {table.rows.length > rows.length
                ? ` (showing first ${rows.length} of ${table.rows.length})`
                : null}
              {' · '}
              <span className="font-medium text-[var(--sea-ink)]">{latCol}</span>
              {' / '}
              <span className="font-medium text-[var(--sea-ink)]">{lngCol}</span>
            </p>
            <DatasetLeafletMap
              key={`${table.id}-${latCol}-${lngCol}`}
              rows={rows}
              latitudeColumn={latCol}
              longitudeColumn={lngCol}
              labelColumn={labelCol}
              className="rounded-xl shadow-sm"
            />
          </>
        )}
      </div>
    )
  }

  if (!iframeSrc) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">{mapping.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/mappings">All mappings</Link>
            </Button>
            {onDelete && (
              <Button type="button" variant="outline" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
          {mapping.source === 'external_url'
            ? 'Add a valid http(s) URL for this mapping.'
            : 'Unable to load map preview.'}
        </div>
      </div>
    )
  }

  return (
    <div className="relative -mx-4 -mt-4 -mb-6 flex h-[calc(100dvh-3.5rem-2rem)] min-h-0 max-w-none flex-col md:-mx-6 md:-mt-6 md:-mb-6 md:h-[calc(100dvh-3.5rem-3rem)]">
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2 md:left-6 md:right-6">
        <div className="pointer-events-auto flex max-w-[70%] flex-col rounded-lg border border-[var(--line)] bg-[var(--header-bg)]/95 px-3 py-2 shadow-sm backdrop-blur-sm">
          <span className="truncate text-sm font-semibold text-[var(--sea-ink)]">{mapping.name}</span>
          {mapping.description?.trim() ? (
            <span className="line-clamp-1 text-xs text-[var(--sea-ink-soft)]">{mapping.description}</span>
          ) : null}
        </div>
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="shadow-sm" asChild>
            <Link to="/mappings">All mappings</Link>
          </Button>
          {onDelete && (
            <Button type="button" variant="outline" size="sm" className="bg-[var(--header-bg)]/95 shadow-sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-[var(--line)] shadow-sm">
        <iframe
          title={mapping.name}
          src={iframeSrc}
          className="h-full min-h-0 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
