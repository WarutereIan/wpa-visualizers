import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgMember } from '../_shared/ingestCore.ts'
import { runQueryForTable } from '../_shared/indicatorQuery.ts'
import type { QueryDefinition } from '../_shared/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const cronSecret = Deno.env.get('CRON_SECRET')
    const headerSecret = req.headers.get('X-Cron-Secret')
    const authHeader = req.headers.get('Authorization')

    let orgId: string
    let serviceTriggered = false

    if (cronSecret && headerSecret === cronSecret) {
      // Invoked by scheduled-sync (service role). The caller is trusted; org
      // scoping is enforced by querying with organization_id filters below.
      serviceTriggered = true
      const body = await req.json().catch(() => ({}))
      orgId = (body as { organizationId?: string }).organizationId ?? ''
      if (!orgId) throw new Error('organizationId required')
    } else if (authHeader) {
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
      const body = await req.json()
      orgId = (body as { organizationId: string }).organizationId
      await assertOrgMember(admin, orgId, user.id)
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: indicators, error: indErr } = await admin
      .from('indicator_definitions')
      .select('id, period, source_query_id')
      .eq('organization_id', orgId)
      .not('source_query_id', 'is', null)

    if (indErr) throw indErr

    let refreshed = 0
    for (const indicator of indicators ?? []) {
      const { data: qrow } = await admin
        .from('query_definitions')
        .select('*')
        .eq('id', indicator.source_query_id)
        .eq('organization_id', orgId)
        .maybeSingle()
      if (!qrow) continue

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

      // Routes through the Parquet worker for promoted tables, the in-JS
      // engine for jsonb tables — fixes the silent fast-path death for large
      // datasets. Throws on failure; one bad indicator doesn't abort the batch.
      let rows: Record<string, unknown>[]
      try {
        rows = await runQueryForTable(admin, orgId, qrow.table_id, queryDef)
      } catch (err) {
        console.error(`refresh-aggregates: query failed for indicator ${indicator.id}`, err)
        continue
      }

      const scalar = extractScalar(rows, queryDef)
      if (scalar === null || !Number.isFinite(scalar)) continue

      const period = indicator.period ?? 'default'

      await admin.from('indicator_definitions').update({ current: scalar }).eq('id', indicator.id)

      await admin.from('indicator_values').upsert(
        {
          organization_id: orgId,
          indicator_id: indicator.id,
          period,
          disaggregation_key: {},
          value: scalar,
          row_count: rows.length,
          source_query_id: qrow.id,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'indicator_id,period,disaggregation_key' },
      )

      refreshed++
    }

    return new Response(JSON.stringify({ refreshed, serviceTriggered }), {
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
