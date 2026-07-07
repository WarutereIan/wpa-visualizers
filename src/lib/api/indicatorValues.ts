import { useQuery } from '@tanstack/react-query'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export interface IndicatorValue {
  indicatorId: string
  period: string
  value: number | null
  rowCount: number | null
  computedAt: string
}

async function fetchLatestIndicatorValue(
  orgId: string,
  indicatorId: string,
): Promise<IndicatorValue | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('indicator_values')
    .select('indicator_id, period, value, row_count, computed_at')
    .eq('organization_id', orgId)
    .eq('indicator_id', indicatorId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  throwIfSupabaseError(error, 'api.fetchIndicatorValue', { orgId, indicatorId })
  if (!data) return null

  return {
    indicatorId: data.indicator_id,
    period: data.period,
    value: data.value != null ? Number(data.value) : null,
    rowCount: data.row_count,
    computedAt: data.computed_at,
  }
}

/** Pre-computed indicator value — fast path for KPI widgets (<3s dashboard loads). */
export function useIndicatorValue(orgId: string | null, indicatorId: string | undefined) {
  return useQuery({
    queryKey: ['indicator-value', orgId, indicatorId],
    queryFn: () => fetchLatestIndicatorValue(orgId!, indicatorId!),
    enabled: Boolean(orgId && indicatorId),
    staleTime: 60_000,
  })
}
