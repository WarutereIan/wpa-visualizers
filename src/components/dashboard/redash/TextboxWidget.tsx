import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { Pencil, X } from 'lucide-react'
import type { DashboardWidget } from '#/types/visualization'

const markdown = new MarkdownIt({ html: true, linkify: true, breaks: true })

/** Render widget markdown the way Redash does: markdown-it, then DOMPurify. */
export function renderMarkdown(source: string): string {
  const raw = markdown.render(source)
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(raw)
}

export type TextboxWidgetProps = {
  widget: DashboardWidget
  editing: boolean
  onEdit: () => void
  onRemove: () => void
}

export function TextboxWidget({ widget, editing, onEdit, onRemove }: TextboxWidgetProps) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    setHtml(renderMarkdown(widget.text ?? ''))
  }, [widget.text])

  return (
    <div className={`rd-tile ${editing ? 'is-editing' : ''}`}>
      {editing ? (
        <div className="rd-tile-actions">
          <button type="button" className="rd-tile-action" title="Edit" aria-label="Edit textbox" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            className="rd-tile-action rd-tile-remove"
            title="Remove"
            aria-label="Remove textbox"
            onClick={onRemove}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      <header className={`rd-tile-header rd-drag-handle ${editing ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <span className="rd-tile-title">Text</span>
      </header>
      <div className="rd-tile-body">
        {html ? (
          <div className="rd-textbox-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="rd-muted">Empty textbox</div>
        )}
      </div>
    </div>
  )
}
