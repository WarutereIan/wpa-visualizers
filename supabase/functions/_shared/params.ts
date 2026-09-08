import type { QueryDefinition, QueryParameter } from './types.ts'

export type ParameterValues = Record<string, string | number | null>

export type ParameterMappingType = 'dashboard-level' | 'widget-level' | 'static'

export interface ParameterMapping {
  type: ParameterMappingType
  mapTo: string
  value?: string | number | null
}

/**
 * Resolve param-bound filters into literal filters.
 * Priority: provided value > parameter default. Filters whose param has
 * neither are DROPPED (matches src/lib/queryParameters.ts applyParameters).
 */
export function applyParameters(query: QueryDefinition, values: ParameterValues): QueryDefinition {
  const paramByName = new Map((query.parameters ?? []).map((p) => [p.name, p]))

  const filters = query.filters.flatMap((filter) => {
    if (!filter.param) return [filter]

    const param = paramByName.get(filter.param)
    const raw = filter.param in values ? values[filter.param] : param?.default ?? null
    if (raw == null) return []

    const { param: _param, ...rest } = filter
    return [{ ...rest, value: String(raw) }]
  })

  return { ...query, filters }
}

/**
 * First-load public defaults for a widget's query.
 * static → mapping.value; dashboard-level / widget-level / unmapped → parameter default.
 */
export function resolvePublicDefaultValues(
  parameters: QueryParameter[],
  mappings: Record<string, ParameterMapping> | undefined,
): ParameterValues {
  const out: ParameterValues = {}
  for (const param of parameters) {
    const mapping = mappings?.[param.name]
    if (mapping?.type === 'static') {
      out[param.name] = mapping.value ?? null
    } else {
      out[param.name] = param.default ?? null
    }
  }
  return out
}

export function parameterMappingsFromWidgetOptions(
  options: unknown,
): Record<string, ParameterMapping> | undefined {
  if (!options || typeof options !== 'object') return undefined
  const mappings = (options as { parameterMappings?: Record<string, ParameterMapping> }).parameterMappings
  if (!mappings || typeof mappings !== 'object') return undefined
  return mappings
}
