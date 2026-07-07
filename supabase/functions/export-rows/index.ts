import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgMember } from '../_shared/ingestCore.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAGE_SIZE = 1000

function escapeCsvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(escapeCsvCell).join(',')
  const lines = rows.map((row) => columns.map((col) => escapeCsvCell(row[col])).join(','))
  return [header, ...lines].join('\n')
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

    const body = await req.json()
    const {
      organizationId,
      tableId,
      format = 'csv',
      offset = 0,
      limit = PAGE_SIZE,
    } = body as {
      organizationId: string
      tableId: string
      format?: 'csv' | 'json'
      offset?: number
      limit?: number
    }

    if (!organizationId || !tableId) {
      return new Response(JSON.stringify({ error: 'organizationId and tableId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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

    const { data: table, error: tableError } = await userClient
      .from('data_tables')
      .select('id, name, row_count')
      .eq('id', tableId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (tableError || !table) {
      return new Response(JSON.stringify({ error: 'Table not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: columns, error: colError } = await userClient
      .from('data_table_columns')
      .select('name, ordinal')
      .eq('data_table_id', tableId)
      .order('ordinal')

    if (colError) throw colError

    const columnNames = (columns ?? []).map((c) => c.name)
    const safeLimit = Math.min(Math.max(1, limit), PAGE_SIZE)
    const safeOffset = Math.max(0, offset)

    const { data: rowBatch, error: rowError } = await userClient
      .from('data_table_rows')
      .select('row_data')
      .eq('organization_id', organizationId)
      .eq('data_table_id', tableId)
      .order('id')
      .range(safeOffset, safeOffset + safeLimit - 1)

    if (rowError) throw rowError

    const rows = (rowBatch ?? []).map((r) => r.row_data as Record<string, unknown>)
    const total = table.row_count ?? rows.length
    const hasMore = safeOffset + rows.length < total

    if (format === 'json') {
      return new Response(
        JSON.stringify({
          tableName: table.name,
          columns: columnNames,
          rows,
          offset: safeOffset,
          limit: safeLimit,
          hasMore,
          total,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const csv = rowsToCsv(rows, columnNames.length ? columnNames : Object.keys(rows[0] ?? {}))
    return new Response(
      JSON.stringify({
        tableName: table.name,
        columns: columnNames,
        csv,
        offset: safeOffset,
        limit: safeLimit,
        hasMore,
        total,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message === 'Forbidden' ? 403 : 500
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
