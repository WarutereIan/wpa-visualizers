import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { inferColumnsFromRows } from './inferColumns.ts'
import { assertOrgMember } from '../_shared/ingestCore.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ROW_BATCH = 500

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

    const { organizationId, name, rows } = await req.json() as {
      organizationId: string
      name: string
      rows: Record<string, unknown>[]
    }

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: 'rows must be a non-empty array' }), {
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

    const columns = inferColumnsFromRows(rows)
    const { data: table, error: tableError } = await userClient
      .from('data_tables')
      .insert({
        organization_id: organizationId,
        name: name.trim() || 'Imported Table',
        storage_backend: 'jsonb',
        row_count: rows.length,
      })
      .select('*')
      .single()

    if (tableError) throw tableError

    const columnPayload = columns.map((col, ordinal) => ({
      data_table_id: table.id,
      name: col.name,
      data_type: col.type,
      ordinal,
    }))

    const { error: colError } = await userClient.from('data_table_columns').insert(columnPayload)
    if (colError) throw colError

    for (let i = 0; i < rows.length; i += ROW_BATCH) {
      const chunk = rows.slice(i, i + ROW_BATCH).map((row_data) => ({
        organization_id: organizationId,
        data_table_id: table.id,
        row_data,
      }))
      const { error: rowError } = await userClient.from('data_table_rows').insert(chunk)
      if (rowError) throw rowError
    }

    return new Response(JSON.stringify({ tableId: table.id, rowCount: rows.length }), {
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
