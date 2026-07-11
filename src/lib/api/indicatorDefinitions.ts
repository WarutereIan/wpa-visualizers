import { useQuery } from '@tanstack/react-query'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import { mapDbIndicator, type DbIndicator } from '#/lib/api/mappers'
import type { Indicator } from '#/types/outputsIndicators'

// Re-export so existing importers keep working.
export type { Indicator as IndicatorDefinition } from '#/types/outputsIndicators'

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
      if (!supabase || !orgId) return [] as Indicator[]
      const { data, error } = await supabase
        .from('indicator_definitions')
        .select('*')
        .eq('organization_id', orgId)
        .order('name')
      throwIfSupabaseError(error, 'api.fetchIndicatorDefinitions', { orgId })
      return (data ?? []).map((r) => mapDbIndicator(r as DbIndicator)) as Indicator[]
    },
    enabled: Boolean(orgId),
  })
}

export function useIndicatorTrends(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.indicatorTrends(orgId) : ['indicator-trends', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return [] as IndicatorTrendPoint[]
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
