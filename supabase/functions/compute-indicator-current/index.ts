import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { runQueryDefinition } from '../_shared/queryEngine.ts'
import { assertOrgMember } from '../_shared/ingestCore.ts'
import type { QueryDefinition } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractScalar(rows: Record<string, unknown>[], query: QueryDefinition): number | null {
  if (rows.length === 0) return null

  const aggregations = query.aggregations ?? []
  if (aggregations.length > 0) {
    const alias = (aggregations[0].alias?.trim() || `${aggregations[0].operator}_${aggregations[0].column || 'all'}`).trim()
    const val = rows[0]?.[alias]
    return typeof val === 'number' ? val : val != null ? Number(val) : null
  }

  const cols = query.selectedColumns ?? []
  for (const col of cols) {
    const val = rows[0]?.[col]
    if (typeof val === 'number' && Number.isFinite(val)) return val
    const n = Number(val)
    if (Number.isFinite(n)) return n
  }

  for (const val of Object.values(rows[0] ?? {})) {
    if (typeof val === 'number' && Number.isFinite(val)) return val
    const n = Number(val)
    if (Number.isFinite(n)) return n
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { organizationId, indicatorId } = await req.json() as {
      organizationId: string
      indicatorId: string
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await assertOrgMember(admin, organizationId, user.id)

    const { data: indicator, error: indError } = await admin
      .from('indicator_definitions')
      .select('*')
      .eq('id', indicatorId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (indError || !indicator) {
      return new Response(JSON.stringify({ error: 'Indicator not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!indicator.source_query_id) {
      return new Response(JSON.stringify({ error: 'Indicator has no source query' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: qrow, error: qerr } = await admin
      .from('query_definitions')
      .select('*')
      .eq('id', indicator.source_query_id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (qerr || !qrow) {
      return new Response(JSON.stringify({ error: 'Source query not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const queryDef: QueryDefinition = {
      id: qrow.id,
      name: qrow.name,
      tableId: qrow.table_id,
      selectedColumns: qrow.selected_columns ?? [],
      filters: qrow.filters ?? [],
      groupBy: qrow.group_by ?? [],
      aggregations: qrow.aggregations ?? [],
      createdAt: qrow.created_at,
      updatedAt: qrow.updated_at,
    }

    const { data: table } = await admin
      .from('data_tables')
      .select('id, name')
      .eq('id', qrow.table_id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    const { data: columns } = await admin
      .from('data_table_columns')
      .select('name, data_type, ordinal')
      .eq('data_table_id', qrow.table_id)
      .order('ordinal')

    const { data: rawRows, error: rawError } = await admin
      .from('data_table_rows')
      .select('row_data')
      .eq('organization_id', organizationId)
      .eq('data_table_id', qrow.table_id)
      .limit(50_000)

    if (rawError) throw rawError

    const rows = runQueryDefinition(
      {
        id: table?.id ?? qrow.table_id,
        name: table?.name ?? 'Table',
        columns: (columns ?? []).map((c) => ({
          name: c.name,
          type: c.data_type as 'string' | 'number' | 'boolean',
        })),
        rows: (rawRows ?? []).map((r) => r.row_data as Record<string, string | number | boolean | null>),
      },
      queryDef,
    )

    const scalar = extractScalar(rows, queryDef)
    if (scalar === null || !Number.isFinite(scalar)) {
      return new Response(JSON.stringify({ error: 'Could not derive numeric current from query results' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: updateError } = await admin
      .from('indicator_definitions')
      .update({ current: scalar, updated_at: new Date().toISOString() })
      .eq('id', indicatorId)
      .eq('organization_id', organizationId)

    if (updateError) throw updateError

    // Mirror the computed value into indicator_values so the trend history /
    // indicator-visualization catalog stays current alongside indicator_definitions.current.
    const period = indicator.period ?? 'default'
    const { error: trendError } = await admin.from('indicator_values').upsert(
      {
        organization_id: organizationId,
        indicator_id: indicatorId,
        period,
        disaggregation_key: {},
        value: scalar,
        row_count: rows.length,
        source_query_id: indicator.source_query_id,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'indicator_id,period,disaggregation_key' },
    )
    if (trendError) {
      console.error('compute-indicator-current: indicator_values upsert failed', trendError)
    }

    return new Response(JSON.stringify({ indicatorId, current: scalar }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message === 'Forbidden' ? 403 : 500
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
