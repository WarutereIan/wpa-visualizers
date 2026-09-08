import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { ParameterMapping, ParameterMappingType, QueryParameter } from '#/types/visualization'

export const MAPPING_TYPE_LABELS: Record<ParameterMappingType, string> = {
  'dashboard-level': 'Dashboard parameter',
  'widget-level': 'Widget parameter',
  static: 'Static value',
}

const MAPPING_TYPES: ParameterMappingType[] = ['dashboard-level', 'widget-level', 'static']

export type ParameterMappingFormProps = {
  parameters: QueryParameter[]
  value: Record<string, ParameterMapping>
  onChange: (next: Record<string, ParameterMapping>) => void
}

function mappingFor(param: QueryParameter, value: Record<string, ParameterMapping>): ParameterMapping {
  return value[param.name] ?? { type: 'dashboard-level', mapTo: param.name }
}

export function ParameterMappingForm({ parameters, value, onChange }: ParameterMappingFormProps) {
  const patch = (param: QueryParameter, next: ParameterMapping) => {
    onChange({ ...value, [param.name]: next })
  }

  const setType = (param: QueryParameter, type: ParameterMappingType) => {
    patch(param, {
      type,
      mapTo: param.name,
      value: type === 'static' ? (param.default ?? null) : undefined,
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-left text-xs text-[var(--sea-ink-soft)]">
            <th className="px-2 py-2 font-medium">Title</th>
            <th className="px-2 py-2 font-medium">Keyword</th>
            <th className="px-2 py-2 font-medium">Type</th>
            <th className="px-2 py-2 font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param) => {
            const mapping = mappingFor(param, value)
            return (
              <tr key={param.name} className="border-b border-[var(--line)] last:border-0">
                <td className="px-2 py-2 align-middle">{param.title}</td>
                <td className="px-2 py-2 align-middle font-mono text-xs">{param.name}</td>
                <td className="px-2 py-2 align-middle">
                  <Select
                    value={mapping.type}
                    onValueChange={(next) => setType(param, next as ParameterMappingType)}
                  >
                    <SelectTrigger className="h-8 min-w-[10rem]" aria-label={`${param.title} mapping type`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAPPING_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {MAPPING_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2 align-middle">
                  {mapping.type === 'dashboard-level' ? (
                    <input
                      aria-label={`${param.title} dashboard parameter`}
                      value={mapping.mapTo}
                      onChange={(event) => patch(param, { ...mapping, mapTo: event.target.value })}
                      className="flex h-8 w-full min-w-[8rem] rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  ) : mapping.type === 'static' ? (
                    param.type === 'enum' && param.enumOptions?.length ? (
                      <Select
                        value={String(mapping.value ?? '')}
                        onValueChange={(next) => patch(param, { ...mapping, value: next })}
                      >
                        <SelectTrigger className="h-8 min-w-[8rem]" aria-label={`${param.title} static value`}>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {param.enumOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        aria-label={`${param.title} static value`}
                        type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                        value={mapping.value ?? ''}
                        onChange={(event) => {
                          const raw = event.target.value
                          patch(param, {
                            ...mapping,
                            value: param.type === 'number' ? (raw === '' ? null : Number(raw)) : raw,
                          })
                        }}
                        className="flex h-8 w-full min-w-[8rem] rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    )
                  ) : (
                    <span className="text-xs text-[var(--sea-ink-soft)]">Set on widget</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
