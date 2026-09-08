import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

export type TagsEditorProps = {
  tags: string[]
  allTags: string[]
  onChange: (tags: string[]) => void
  readOnly?: boolean
}

export function TagsEditor({ tags, allTags, onChange, readOnly }: TagsEditorProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setDraft('')
      }
    }
    window.addEventListener('click', onDocClick)
    return () => window.removeEventListener('click', onDocClick)
  }, [open])

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase()
    return allTags
      .filter((tag) => !tags.includes(tag))
      .filter((tag) => (q ? tag.toLowerCase().includes(q) : true))
      .slice(0, 8)
  }, [allTags, tags, draft])

  const addTag = (raw: string) => {
    const next = raw.trim()
    if (!next || tags.includes(next)) return
    onChange([...tags, next])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="rd-tags" ref={rootRef}>
      {tags.map((tag) => (
        <span key={tag} className="rd-tag">
          {tag}
          {readOnly ? null : (
            <button
              type="button"
              className="rd-tag-remove"
              aria-label={`Remove tag ${tag}`}
              onClick={() => removeTag(tag)}
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {readOnly ? null : (
        <div className="rd-tags-add">
          <button
            type="button"
            className="rd-tag-add"
            onClick={(event) => {
              event.stopPropagation()
              setOpen((current) => !current)
            }}
          >
            <Plus className="size-3" />
            Add tag
          </button>
          {open ? (
            <div className="rd-tag-popover" onClick={(event) => event.stopPropagation()}>
              <input
                ref={inputRef}
                className="rd-tag-input"
                value={draft}
                placeholder="Add tag"
                aria-label="Add tag"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag(draft)
                  }
                  if (event.key === 'Escape') {
                    setOpen(false)
                    setDraft('')
                  }
                }}
              />
              {suggestions.length > 0 ? (
                <ul className="rd-tag-suggestions">
                  {suggestions.map((tag) => (
                    <li key={tag}>
                      <button type="button" onClick={() => addTag(tag)}>
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
