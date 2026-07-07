import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgRole } from '../_shared/ingestCore.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type RuleExpression = {
  min?: number
  max?: number
  pattern?: string
  otherColumn?: string
  expected?: string
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number(value)
    return value.trim() !== '' && Number.isFinite(n) ? n : null
  }
  return null
}

function checkRowRule(
  ruleType: string,
  expression: RuleExpression,
  value: unknown,
): boolean {
  if (value === null || value === undefined) {
    return ruleType === 'required'
  }
  if (ruleType === 'required') return false
  if (ruleType === 'range') {
    const n = toNumber(value)
    if (n == null) return false
    if (expression.min != null && n < expression.min) return true
    if (expression.max != null && n > expression.max) return true
    return false
  }
  if (ruleType === 'format' && typeof value === 'string' && expression.pattern) {
    try {
      return !new RegExp(expression.pattern).test(value)
    } catch {
      return false
    }
  }
  return false
}

function checkCrossField(
  expression: RuleExpression,
  rowData: Record<string, unknown>,
): boolean {
  const other = expression.otherColumn
  if (!other) return false
  const expected = expression.expected
  const a = rowData[expression.otherColumn ?? '']
  // Equality check between a column value and an expected literal.
  return expected != null && String(a) !== String(expected)
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

    const { organizationId, dataTableId, sampleLimit = 500 } = (await req.json().catch(() => ({}))) as {
      organizationId?: string
      dataTableId?: string
      sampleLimit?: number
    }
    if (!organizationId || !dataTableId) {
      return new Response(JSON.stringify({ error: 'organizationId and dataTableId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const limit = Math.max(0, Math.min(Number(sampleLimit) || 500, 2000))

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

    const { data: rules, error: rulesErr } = await admin
      .from('validation_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('data_table_id', dataTableId)
    if (rulesErr) throw rulesErr
    if (!rules?.length) {
      return new Response(JSON.stringify({ issuesCreated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rows, error: rowErr } = await admin
      .from('data_table_rows')
      .select('id, row_data')
      .eq('organization_id', organizationId)
      .eq('data_table_id', dataTableId)
      .limit(limit)
    if (rowErr) throw rowErr

    const rowList = rows ?? []
    const uniquenessRules = rules.filter((r) => r.rule_type === 'uniqueness' && r.column_name)
    // Precompute seen values per uniqueness rule to detect duplicates.
    const uniquenessSeen = new Map<string, Map<string, string>>()
    for (const rule of uniquenessRules) {
      uniquenessSeen.set(rule.id, new Map())
    }

    let issuesCreated = 0
    for (const row of rowList) {
      const rowData = (row.row_data ?? {}) as Record<string, unknown>
      for (const rule of rules) {
        const col = rule.column_name
        const value = col ? rowData[col] : null
        const expression = (rule.expression ?? {}) as RuleExpression
        let violated = false

        if (rule.rule_type === 'uniqueness' && col) {
          const seen = uniquenessSeen.get(rule.id)!
          const key = value == null ? '' : String(value)
          if (seen.has(key)) {
            violated = true
          } else {
            seen.set(key, String(row.id))
          }
        } else if (rule.rule_type === 'cross_field') {
          violated = checkCrossField(expression, rowData)
        } else {
          violated = checkRowRule(rule.rule_type, expression, value)
        }

        if (violated) {
          // Dedup: skip if an open issue already exists for this rule + row.
          const { data: existing } = await admin
            .from('data_quality_issues')
            .select('id')
            .eq('validation_rule_id', rule.id)
            .eq('row_id', String(row.id))
            .eq('status', 'open')
            .limit(1)
          if (existing && existing.length > 0) continue

          const { error: insErr } = await admin.from('data_quality_issues').insert({
            organization_id: organizationId,
            validation_rule_id: rule.id,
            data_table_id: dataTableId,
            row_id: String(row.id),
            status: 'open',
          })
          if (!insErr) issuesCreated++
        }
      }
    }

    return new Response(JSON.stringify({ issuesCreated }), {
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
