import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgRole } from '../_shared/orgAuth.ts'
import { runQueryForTable } from '../_shared/indicatorQuery.ts'
import { mapQueryDefinitionFromDb, type QueryDefinition } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { organizationId, dashboardId, period } = (await req.json()) as {
      organizationId: string
      dashboardId: string
      period?: string
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

    await assertOrgRole(admin, organizationId, user.id, ['owner', 'admin', 'editor', 'data_manager'])

    const { data: dashboard, error: dashErr } = await admin
      .from('dashboards')
      .select('id, name, layout, widgets')
      .eq('id', dashboardId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (dashErr || !dashboard) {
      return new Response(JSON.stringify({ error: 'Dashboard not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const widgets = (dashboard.widgets ?? {}) as Record<
      string,
      { dataSourceId?: string; options?: Record<string, unknown> }
    >
    type FrozenWidget = { queryId?: string; rows?: unknown[]; error?: string }
    type FrozenIndicator = { value: number | null; period: string | null; computed_at: string }
    const frozenData: {
      widgets: Record<string, FrozenWidget>
      indicators: Record<string, FrozenIndicator>
    } = { widgets: {}, indicators: {} }

    for (const [widgetId, widget] of Object.entries(widgets)) {
      if (widget.dataSourceId) {
        const { data: qrow } = await admin
          .from('query_definitions')
          .select('*')
          .eq('id', widget.dataSourceId)
          .eq('organization_id', organizationId)
          .maybeSingle()
        if (qrow) {
          const queryDef = mapQueryDefinitionFromDb(qrow as Record<string, unknown>)
          try {
            const rows = await runQueryForTable(admin, organizationId, qrow.table_id, queryDef)
            frozenData.widgets[widgetId] = { queryId: qrow.id, rows }
          } catch (err) {
            frozenData.widgets[widgetId] = {
              queryId: qrow.id,
              error: err instanceof Error ? err.message : 'Query failed',
            }
          }
        }
      }
      const indicatorId = widget.options?.indicatorId
      if (typeof indicatorId === 'string' && indicatorId) {
        let ivQuery = admin
          .from('indicator_values')
          .select('value, period, computed_at')
          .eq('organization_id', organizationId)
          .eq('indicator_id', indicatorId)
        // Prefer the snapshot period when provided; fall back to latest.
        if (period) ivQuery = ivQuery.eq('period', period)
        const { data: iv } = await ivQuery
          .order('computed_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (iv) frozenData.indicators[indicatorId] = iv
      }
    }

    const { data: snapshot, error: snapErr } = await admin
      .from('dashboard_snapshots')
      .insert({
        organization_id: organizationId,
        dashboard_id: dashboardId,
        period: period ?? null,
        layout: dashboard.layout,
        data: frozenData,
        created_by: user.id,
      })
      .select('id, created_at')
      .single()

    if (snapErr) throw snapErr

    return new Response(JSON.stringify({ snapshotId: snapshot.id, createdAt: snapshot.created_at }), {
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

