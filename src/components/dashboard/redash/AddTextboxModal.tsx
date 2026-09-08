import { useEffect, useState } from 'react'
import { renderMarkdown } from '#/components/dashboard/redash/TextboxWidget'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Textarea } from '#/components/ui/textarea'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { textboxWidgetDraft } from '#/lib/addWidget'
import type { DashboardWidget } from '#/types/visualization'

export type AddTextboxModalProps = {
  open: boolean
  dashboardId: string
  existingWidgets: DashboardWidget[]
  onClose: () => void
  editWidget: DashboardWidget | null
}

export function AddTextboxModal({
  open,
  dashboardId,
  existingWidgets,
  onClose,
  editWidget,
}: AddTextboxModalProps) {
  const { createWidget, updateWidget } = useDashboardWidgets(dashboardId)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = editWidget != null

  useEffect(() => {
    if (!open) return
    setText(editWidget?.text ?? '')
    setSaving(false)
    setError(null)
  }, [open, editWidget])

  useEffect(() => {
    setPreview(renderMarkdown(text))
  }, [text])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (editWidget) {
        await updateWidget(editWidget.id, { text })
      } else {
        await createWidget(textboxWidgetDraft(dashboardId, existingWidgets, text))
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Textbox' : 'Add Textbox'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            aria-label="Textbox markdown"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={8}
            placeholder="This text supports markdown…"
          />
          <div>
            <p className="mb-1 text-sm font-medium text-[var(--sea-ink)]">Preview</p>
            {preview ? (
              <div
                className="rd-textbox-body min-h-16 rounded-md border border-[var(--line)] bg-[var(--surface)]"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            ) : (
              <p className="text-xs text-[var(--sea-ink-soft)]">Nothing to preview.</p>
            )}
          </div>
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save' : 'Add to Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
