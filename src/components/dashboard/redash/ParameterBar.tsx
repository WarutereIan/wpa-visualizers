import { useEffect, useMemo, useState } from 'react'
import { ParameterInput } from '#/components/dashboard/redash/ParameterInput'
import type { ParameterValues } from '#/lib/queryParameters'
import type { QueryParameter } from '#/types/visualization'

export type ParameterBarProps = {
  parameters: QueryParameter[]
  values: ParameterValues
  onApply: (values: ParameterValues) => void
  disabled?: boolean
}

function valuesEqual(a: ParameterValues, b: ParameterValues): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

export function ParameterBar({ parameters, values, onApply, disabled }: ParameterBarProps) {
  const [staged, setStaged] = useState<ParameterValues>(values)

  useEffect(() => {
    setStaged(values)
  }, [values])

  const dirty = useMemo(() => !disabled && !valuesEqual(staged, values), [disabled, staged, values])

  if (parameters.length === 0) return null

  return (
    <div className="rd-parameter-bar">
      <div className="rd-filters">
        {parameters.map((parameter) => (
          <label key={parameter.name} className="rd-filter">
            <span className="rd-filter-label">{parameter.title || parameter.name}</span>
            <ParameterInput
              parameter={parameter}
              value={staged[parameter.name] ?? parameter.default ?? null}
              disabled={disabled}
              onChange={(next) => setStaged((prev) => ({ ...prev, [parameter.name]: next }))}
            />
          </label>
        ))}
        {dirty ? (
          <button
            type="button"
            className="rd-btn rd-btn-primary"
            onClick={() => onApply(staged)}
          >
            Apply Changes
          </button>
        ) : null}
      </div>
    </div>
  )
}
