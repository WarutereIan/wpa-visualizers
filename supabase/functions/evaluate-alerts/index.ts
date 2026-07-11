import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgMember } from '../_shared/ingestCore.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

function evaluateCondition(
  condition: { op?: string; threshold?: number; unit?: string },
  current: number,
  target: number | null,
): boolean {
  const op = condition.op ?? 'lt'
  let value = condition.threshold ?? 0
  if (condition.unit === 'percent_of_target' && target && target > 0) {
    value = (condition.threshold ?? 0) * target / 100
  }
  switch (op) {
    case 'lt':
      return current < value
    case 'lte':
      return current <= value
    case 'gt':
      return current > value
    case 'gte':
      return current >= value
    case 'eq':
      return current === value
    default:
      return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    const headerSecret = req.headers.get('X-Cron-Secret')
    const authHeader = req.headers.get('Authorization')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    let orgId: string | undefined
    const isCron = cronSecret && headerSecret === cronSecret
    if (isCron) {
      const body = await req.json().catch(() => ({}))
      orgId = (body as { organizationId?: string }).organizationId
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
      const body = await req.json().catch(() => ({}))
      orgId = (body as { organizationId?: string }).organizationId
      if (!orgId) {
        return new Response(JSON.stringify({ error: 'organizationId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await assertOrgMember(admin, orgId, user.id)
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let rulesQuery = admin.from('alert_rules').select('*').eq('enabled', true)
    if (orgId) rulesQuery = rulesQuery.eq('organization_id', orgId)
    const { data: rules, error: rulesErr } = await rulesQuery
    if (rulesErr) throw rulesErr

    let fired = 0
    for (const rule of rules ?? []) {
      if (!rule.indicator_id) continue

      // NOTE: reads indicator_definitions.current which may be stale if refresh-aggregates
      // has not run since the latest data. For freshest values, re-run rule.source_query_id
      // via runQueryForTable — deferred to keep this function cheap on the cron path.
      const { data: indicator } = await admin
        .from('indicator_definitions')
        .select('id, name, current, target, organization_id')
        .eq('id', rule.indicator_id)
        .maybeSingle()
      if (!indicator || indicator.current == null) continue

      const condition = (rule.condition ?? {}) as { op?: string; threshold?: number; unit?: string }
      if (!evaluateCondition(condition, Number(indicator.current), indicator.target != null ? Number(indicator.target) : null)) {
        continue
      }

      const suppressionMs = (rule.suppression_minutes ?? 0) * 60_000
      if (rule.last_fired_at && Date.now() - new Date(rule.last_fired_at).getTime() < suppressionMs) {
        continue
      }

      const { data: members } = await admin
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', rule.organization_id)
        .in('role', ['owner', 'admin', 'editor', 'data_manager'])

      const channel = rule.channel ?? 'in_app'
      // Only in_app channel creates notification rows in this MVP.
      // email/teams/slack/whatsapp dispatch is a follow-up; we still record an in-app
      // notification so the breach is visible, but flag the channel in the payload.
      let delivered = 0
      for (const m of members ?? []) {
        const { error: insErr } = await admin.from('notifications').insert({
          organization_id: rule.organization_id,
          user_id: m.user_id,
          alert_rule_id: rule.id,
          payload: {
            ruleName: rule.name,
            indicatorName: indicator.name,
            current: indicator.current,
            threshold: condition.threshold,
            op: condition.op,
            channel,
          },
        })
        if (!insErr) delivered++
      }

      // Only suppress (update last_fired_at) when at least one notification landed.
      if (delivered > 0) {
        await admin
          .from('alert_rules')
          .update({ last_fired_at: new Date().toISOString() })
          .eq('id', rule.id)
        fired++
      }
    }

    return new Response(JSON.stringify({ fired }), {
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
