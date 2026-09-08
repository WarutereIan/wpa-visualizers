import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import type { ParameterType, QueryParameter } from '#/types/visualization'

const PARAM_TYPES: ParameterType[] = ['text', 'number', 'enum', 'date', 'date-range', 'query']

export type QueryParametersEditorProps = {
  parameters: QueryParameter[]
  onChange: (next: QueryParameter[]) => void
}

function emptyParameter(existing: QueryParameter[]): QueryParameter {
  const used = new Set(existing.map((item) => item.name))
  let index = existing.length + 1
  let name = `param_${index}`
  while (used.has(name)) {
    index += 1
    name = `param_${index}`
  }
  return { name, title: 'Parameter', type: 'text', default: null }
}

function patchAt(
  parameters: QueryParameter[],
  index: number,
  patch: Partial<QueryParameter>,
): QueryParameter[] {
  return parameters.map((item, i) => (i === index ? { ...item, ...patch } : item))
}

export function QueryParametersEditor({ parameters, onChange }: QueryParametersEditorProps) {
  const [draft, setDraft] = useState(parameters)
  const dirty = JSON.stringify(draft) !== JSON.stringify(parameters)

  useEffect(() => {
    if (!dirty) setDraft(parameters)
  }, [parameters, dirty])

  const emit = (next: QueryParameter[]) => {
    setDraft(next)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--sea-ink)]">Parameters</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => emit([...draft, emptyParameter(draft)])}
        >
          Add parameter
        </Button>
      </div>
      <p className="text-[11px] text-[var(--sea-ink-soft)]">
        Declare parameters, then bind a filter to one. Bound filters take their value at runtime.
      </p>
      {draft.length === 0 ? (
        <p className="text-xs text-[var(--sea-ink-soft)]">No parameters declared.</p>
      ) : (
        <div className="space-y-3">
          {draft.map((param, index) => (
            <div
              key={`${param.name}-${index}`}
              className="grid gap-2 rounded border border-[var(--line)] bg-[var(--surface)] p-2 md:grid-cols-2"
            >
              <label className="space-y-1 text-xs text-[var(--sea-ink-soft)]">
                Name
                <Input
                  value={param.name}
                  aria-label={`${param.title || param.name} name`}
                  className="h-8 font-mono"
                  onChange={(event) => emit(patchAt(draft, index, { name: event.target.value }))}
                />
              </label>
              <label className="space-y-1 text-xs text-[var(--sea-ink-soft)]">
                Title
                <Input
                  value={param.title}
                  aria-label={`${param.name} title`}
                  className="h-8"
                  onChange={(event) => emit(patchAt(draft, index, { title: event.target.value }))}
                />
              </label>
              <label className="space-y-1 text-xs text-[var(--sea-ink-soft)]">
                Type
                <Select
                  value={param.type}
                  onValueChange={(next) =>
                    emit(patchAt(draft, index, { type: next as ParameterType }))
                  }
                >
                  <SelectTrigger className="h-8" aria-label={`${param.name} type`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARAM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1 text-xs text-[var(--sea-ink-soft)]">
                Default
                <Input
                  value={param.default ?? ''}
                  aria-label={`${param.name} default`}
                  className="h-8"
                  type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                  onChange={(event) => {
                    const raw = event.target.value
                    emit(
                      patchAt(draft, index, {
                        default:
                          param.type === 'number'
                            ? raw === ''
                              ? null
                              : Number(raw)
                            : raw || null,
                      }),
                    )
                  }}
                />
              </label>
              {param.type === 'enum' ? (
                <label className="space-y-1 text-xs text-[var(--sea-ink-soft)] md:col-span-2">
                  Enum options (one per line)
                  <Textarea
                    value={(param.enumOptions ?? []).join('\n')}
                    aria-label={`${param.name} enum options`}
                    className="min-h-20"
                    onChange={(event) =>
                      emit(
                        patchAt(draft, index, {
                          enumOptions: event.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean),
                        }),
                      )
                    }
                  />
                </label>
              ) : null}
              {param.type === 'query' ? (
                <label className="space-y-1 text-xs text-[var(--sea-ink-soft)] md:col-span-2">
                  Query ID
                  <Input
                    value={param.queryId ?? ''}
                    aria-label={`${param.name} query id`}
                    className="h-8 font-mono"
                    onChange={(event) =>
                      emit(patchAt(draft, index, { queryId: event.target.value || undefined }))
                    }
                  />
                </label>
              ) : null}
              <div className="md:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => emit(draft.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
