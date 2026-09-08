import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useVisualizationResult } from '#/hooks/useVisualizationResult'
import type { ParameterValues } from '#/lib/queryParameters'
import type { QueryParameter } from '#/types/visualization'

export type ParameterInputProps = {
  parameter: QueryParameter
  value: ParameterValues[string]
  onChange: (next: ParameterValues[string]) => void
  disabled?: boolean
}

function toInputString(value: ParameterValues[string]): string {
  return value == null ? '' : String(value)
}

function parseDateRange(value: ParameterValues[string]): [string, string] {
  if (typeof value !== 'string' || !value) return ['', '']
  const [start = '', end = ''] = value.split(',')
  return [start, end]
}

function uniqueFirstColumnValues(rows: Array<Record<string, unknown>>, column: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of rows) {
    const raw = row[column]
    if (raw == null) continue
    const text = String(raw)
    if (!text || seen.has(text)) continue
    seen.add(text)
    out.push(text)
  }
  return out
}

function QueryParameterSelect({
  parameter,
  value,
  onChange,
  disabled,
}: ParameterInputProps) {
  const { result, isLoading } = useVisualizationResult(parameter.queryId ?? null, {}, 0)
  const column = result?.columns[0]?.name
  const options = column ? uniqueFirstColumnValues(result.rows, column) : []
  const current = toInputString(value)

  return (
    <Select
      value={current || undefined}
      onValueChange={onChange}
      disabled={disabled || isLoading || !parameter.queryId}
    >
      <SelectTrigger aria-label={parameter.title} className="rd-filter-control h-8 min-w-[10rem]">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select value'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ParameterInput({ parameter, value, onChange, disabled }: ParameterInputProps) {
  const label = parameter.title || parameter.name

  if (parameter.type === 'enum') {
    const options = parameter.enumOptions ?? []
    return (
      <Select value={toInputString(value) || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={label} className="rd-filter-control h-8 min-w-[10rem]">
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (parameter.type === 'query') {
    return (
      <QueryParameterSelect
        parameter={parameter}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    )
  }

  if (parameter.type === 'date') {
    return (
      <Input
        type="date"
        aria-label={label}
        className="rd-filter-control h-8"
        value={toInputString(value)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
      />
    )
  }

  if (parameter.type === 'date-range') {
    const [start, end] = parseDateRange(value)
    const emit = (nextStart: string, nextEnd: string) => {
      if (!nextStart && !nextEnd) {
        onChange(null)
        return
      }
      onChange(`${nextStart},${nextEnd}`)
    }
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Input
          type="date"
          aria-label={`${label} start`}
          className="rd-filter-control h-8"
          value={start}
          disabled={disabled}
          onChange={(event) => emit(event.target.value, end)}
        />
        <span className="text-xs text-[var(--sea-ink-soft)]">to</span>
        <Input
          type="date"
          aria-label={`${label} end`}
          className="rd-filter-control h-8"
          value={end}
          disabled={disabled}
          onChange={(event) => emit(start, event.target.value)}
        />
      </div>
    )
  }

  if (parameter.type === 'number') {
    return (
      <Input
        type="number"
        aria-label={label}
        className="rd-filter-control h-8"
        value={value == null ? '' : String(value)}
        disabled={disabled}
        onChange={(event) => {
          const raw = event.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
      />
    )
  }

  return (
    <Input
      type="text"
      aria-label={label}
      className="rd-filter-control h-8"
      value={toInputString(value)}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
