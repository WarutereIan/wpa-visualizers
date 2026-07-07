import { useQuery } from '@tanstack/react-query'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export interface IndicatorDefinition {
  id: string
  organizationId: string
  projectId: string | null
  name: string
  type: string
  sourceQueryId: string | null
  period: string | null
  baseline: number | null
  target: number | null
}

export interface IndicatorTrendPoint {
  indicatorId: string
  period: string
  value: number | null
  computedAt: string
}

export function useIndicatorDefinitions(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.indicatorDefs(orgId) : ['indicator-defs', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return []
      const { data, error } = await supabase
        .from('indicator_definitions')
        .select('id, organization_id, project_id, name, type, source_query_id, period, baseline, target')
        .eq('organization_id', orgId)
        .order('name')
      throwIfSupabaseError(error, 'api.fetchIndicatorDefinitions', { orgId })
      return (data ?? []).map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        projectId: r.project_id,
        name: r.name,
        type: r.type,
        sourceQueryId: r.source_query_id,
        period: r.period,
        baseline: r.baseline != null ? Number(r.baseline) : null,
        target: r.target != null ? Number(r.target) : null,
      })) as IndicatorDefinition[]
    },
    enabled: Boolean(orgId),
  })
}

export function useIndicatorTrends(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.indicatorTrends(orgId) : ['indicator-trends', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return []
      const { data, error } = await supabase
        .from('indicator_values')
        .select('indicator_id, period, value, computed_at')
        .eq('organization_id', orgId)
        .order('computed_at', { ascending: true })
        .limit(2000)
      throwIfSupabaseError(error, 'api.fetchIndicatorTrends', { orgId })
      return (data ?? []).map((r) => ({
        indicatorId: r.indicator_id,
        period: r.period,
        value: r.value != null ? Number(r.value) : null,
        computedAt: r.computed_at,
      })) as IndicatorTrendPoint[]
    },
    enabled: Boolean(orgId),
  })
}
