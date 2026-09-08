import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { GeoJsonLeafletPreview } from '#/components/geo/GeoJsonLeafletPreview'
import { useWorkspaceGeoDatasets } from '#/hooks/useWorkspaceGeoDatasets'
import {
  ACCEPTED_GEO_FILE,
  formatByteSize,
  nameFromGeoFile,
  validateGeoFile,
} from '#/lib/geo/geoUpload'
import {
  pickDefaultTargetField,
  type GeoJsonFeatureCollection,
} from '#/lib/geo/geojsonValidate'
import { cn } from '#/lib/utils'

export type UploadGeoDialogProps = {
  open: boolean
  onClose: () => void
}

type PreviewState = {
  collection: GeoJsonFeatureCollection
  propertyKeys: string[]
  featureCount: number
  byteSize: number
  fileName: string
}

export function UploadGeoDialog({ open, onClose }: UploadGeoDialogProps) {
  const { addGeoDataset } = useWorkspaceGeoDatasets()
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState(false)
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [name, setName] = useState('')
  const [targetField, setTargetField] = useState('code')

  useEffect(() => {
    if (!open) return
    setDragOver(false)
    setReading(false)
    setSaving(false)
    setError(null)
    setPreview(null)
    setName('')
    setTargetField('code')
  }, [open])

  const ingestFile = async (file: File) => {
    setError(null)
    setReading(true)
    try {
      const result = await validateGeoFile(file)
      if (!result.ok) {
        setPreview(null)
        setError(result.error)
        return
      }
      const nextName = nameFromGeoFile(file.name)
      const nextField = pickDefaultTargetField(result.propertyKeys)
      setPreview({
        collection: result.collection,
        propertyKeys: result.propertyKeys,
        featureCount: result.featureCount,
        byteSize: result.byteSize,
        fileName: file.name,
      })
      setName((current) => current.trim() || nextName)
      setTargetField(nextField)
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : 'Could not read that file')
    } finally {
      setReading(false)
    }
  }

  const handleSave = async () => {
    if (!preview) return
    const trimmed = name.trim() || nameFromGeoFile(preview.fileName)
    setSaving(true)
    setError(null)
    try {
      await addGeoDataset({
        name: trimmed,
        defaultTargetField: targetField,
        geojson: preview.collection,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save map')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Upload boundary map</DialogTitle>
          <DialogDescription>
            Add a GeoJSON FeatureCollection for choropleth charts. Join fields are detected from
            feature properties (prefer <code>code</code>, then <code>name</code>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept={ACCEPTED_GEO_FILE}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void ingestFile(file)
              event.target.value = ''
            }}
          />

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              const file = event.dataTransfer.files[0]
              if (file) void ingestFile(file)
            }}
            className={cn(
              'cursor-pointer rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)] transition',
              dragOver && 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]',
            )}
          >
            {reading
              ? 'Reading GeoJSON…'
              : preview
                ? `${preview.fileName} · ${preview.featureCount} feature${preview.featureCount === 1 ? '' : 's'} · ${formatByteSize(preview.byteSize)}`
                : 'Drop a .geojson or .json file here, or click to choose'}
          </div>

          {preview ? (
            <>
              <GeoJsonLeafletPreview data={preview.collection} labelField={targetField} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="geo-upload-name" className="text-sm font-medium text-[var(--sea-ink)]">
                    Name
                  </label>
                  <Input
                    id="geo-upload-name"
                    className="mt-1"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Districts 2024"
                  />
                </div>
                <div>
                  <label
                    htmlFor="geo-upload-target"
                    className="text-sm font-medium text-[var(--sea-ink)]"
                  >
                    Default join field
                  </label>
                  {preview.propertyKeys.length > 0 ? (
                    <Select value={targetField} onValueChange={setTargetField}>
                      <SelectTrigger id="geo-upload-target" className="mt-1" aria-label="Default join field">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {preview.propertyKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
                      No feature properties found. Join field will default to <code>code</code>.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}

          {error ? <p className="text-xs text-red-700">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!preview || saving || reading}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
