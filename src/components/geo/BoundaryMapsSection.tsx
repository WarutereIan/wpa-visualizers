import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { UploadGeoDialog } from '#/components/geo/UploadGeoDialog'
import { useWorkspaceGeoDatasets } from '#/hooks/useWorkspaceGeoDatasets'
import { formatByteSize } from '#/lib/geo/geoUpload'
import { BUILTIN_CHOROPLETH_MAPS } from '#/lib/geo/mapRegistry'

const BUILTIN_ENTRIES = Object.entries(BUILTIN_CHOROPLETH_MAPS)

export function BoundaryMapsSection() {
  const { datasets, isLoading, removeGeoDataset, workspaceReady } = useWorkspaceGeoDatasets()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete boundary map “${name}”? This cannot be undone.`)) return
    setDeletingId(id)
    setMessage(null)
    try {
      await removeGeoDataset(id)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete map')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Boundary maps</h2>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Built-in choropleth boundaries plus custom GeoJSON you upload.
            {workspaceReady
              ? ' Custom maps are stored for your organization.'
              : ' Demo mode keeps custom maps in this browser.'}
          </p>
        </div>
        <Button type="button" onClick={() => setUploadOpen(true)}>
          Upload GeoJSON
        </Button>
      </div>

      {message ? <p className="text-xs text-red-700">{message}</p> : null}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BUILTIN_ENTRIES.map(([id, entry]) => (
          <li key={id}>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
              <span className="font-semibold text-[var(--sea-ink)]">{entry.name}</span>
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                Built-in · join field <code>{entry.defaultTargetField}</code>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {isLoading ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading custom maps…</p>
      ) : datasets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-6 text-center text-sm text-[var(--sea-ink-soft)]">
          No custom maps yet. Upload a GeoJSON FeatureCollection to use it in choropleth charts.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <li key={dataset.id}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
                <span className="font-semibold text-[var(--sea-ink)]">{dataset.name}</span>
                <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                  Custom · {`${dataset.featureCount} feature${dataset.featureCount === 1 ? '' : 's'}`} ·{' '}
                  {formatByteSize(dataset.byteSize)} · join field{' '}
                  <code>{dataset.defaultTargetField}</code>
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                  Updated {new Date(dataset.updatedAt).toLocaleString()}
                </p>
                <div className="mt-3 border-t border-[var(--line)] pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === dataset.id}
                    onClick={() => void handleDelete(dataset.id, dataset.name)}
                  >
                    {deletingId === dataset.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <UploadGeoDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </section>
  )
}
