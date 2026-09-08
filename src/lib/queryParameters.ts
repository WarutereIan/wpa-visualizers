import type { QueryDefinition } from '#/types/data'
import type { ParameterMapping, QueryParameter } from '#/types/visualization'

export type ParameterValues = Record<string, string | number | null>

/** Params declared on the query that are actually used by at least one filter. */
export function usedParameters(query: QueryDefinition): QueryParameter[] {
  const params = query.parameters ?? []
  const referenced = new Set(
    query.filters.map(f => f.param).filter((p): p is string => p != null),
  )
  return params.filter(p => referenced.has(p.name))
}

/**
 * Resolve param-bound filters into literal filters.
 * Priority: provided value > parameter default. Filters whose param has
 * neither are DROPPED (Redash blocks execution instead; we degrade gracefully).
 */
export function applyParameters(query: QueryDefinition, values: ParameterValues): QueryDefinition {
  const paramByName = new Map((query.parameters ?? []).map(p => [p.name, p]))

  const filters = query.filters.flatMap(filter => {
    if (!filter.param) return [filter]

    const param = paramByName.get(filter.param)
    const raw = filter.param in values ? values[filter.param] : param?.default ?? null
    if (raw == null) return []

    const { param: _param, ...rest } = filter
    return [{ ...rest, value: String(raw) }]
  })

  return { ...query, filters }
}

/** Resolve a widget's mapping into the values passed to applyParameters. */
export function resolveWidgetParameters(
  parameters: QueryParameter[],
  mappings: Record<string, ParameterMapping> | undefined,
  dashboardValues: ParameterValues,
  widgetValues: ParameterValues,
): ParameterValues {
  const out: ParameterValues = {}

  for (const param of parameters) {
    const mapping = mappings?.[param.name]
    if (mapping) {
      switch (mapping.type) {
        case 'dashboard-level':
          out[param.name] = dashboardValues[mapping.mapTo] ?? null
          break
        case 'widget-level':
          out[param.name] = widgetValues[mapping.mapTo] ?? null
          break
        case 'static':
          out[param.name] = mapping.value ?? null
          break
      }
    } else {
      out[param.name] = widgetValues[param.name] ?? null
    }
  }

  return out
}
