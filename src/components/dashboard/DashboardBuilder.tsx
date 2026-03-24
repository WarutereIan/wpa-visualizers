import { useCallback, useEffect, useState } from 'react'
import type { DashboardDefinition } from '#/types/dashboard'
import { DashboardCanvas } from '#/components/dashboard/DashboardCanvas'
import { Button } from '#/components/ui/button'

export function DashboardBuilder({
  draft,
  onSave,
  onCancel,
}: {
  draft: DashboardDefinition
  onSave: (next: DashboardDefinition) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState(draft.name)
  const [description, setDescription] = useState(draft.description ?? '')
  const [layout, setLayout] = useState(draft.layout)
  const [widgets, setWidgets] = useState(draft.widgets)

  useEffect(() => {
    setName(draft.name)
    setDescription(draft.description ?? '')
    setLayout(draft.layout)
    setWidgets(draft.widgets)
  }, [draft.id, draft.updatedAt])

  const handleCanvasChange = useCallback(
    (next: { layout: typeof layout; widgets: typeof widgets }) => {
      setLayout(next.layout)
      setWidgets(next.widgets)
    },
    [],
  )

  const handleSave = () => {
    onSave({
      ...draft,
      name,
      description,
      layout,
      widgets,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="db-name" className="text-sm font-medium text-[var(--sea-ink)]">
            Dashboard name
          </label>
          <input
            id="db-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-3 text-sm"
          />
        </div>
        <div className="flex items-end gap-2 sm:justify-end">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleSave}>
            Save dashboard
          </Button>
        </div>
      </div>
      <div>
        <label htmlFor="db-desc" className="text-sm font-medium text-[var(--sea-ink)]">
          Description
        </label>
        <textarea
          id="db-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <DashboardCanvas
        layout={layout}
        widgets={widgets}
        onChange={handleCanvasChange}
        layoutKey={draft.id}
      />
    </div>
  )
}
