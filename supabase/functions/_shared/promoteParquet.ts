import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { promoteRowsToParquet } from './duckdbWorker.ts'

export const PARQUET_ROW_THRESHOLD = Number(Deno.env.get('JSONB_PARQUET_THRESHOLD') ?? '50000')

export async function promoteTableToParquet(
  admin: SupabaseClient,
  orgId: string,
  tableId: string,
): Promise<{ promoted: boolean; rowCount: number }> {
  const { data: table, error: tableError } = await admin
    .from('data_tables')
    .select('id, storage_backend, row_count')
    .eq('id', tableId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (tableError || !table) throw new Error('Table not found')
  if (table.storage_backend === 'parquet') {
    return { promoted: false, rowCount: Number(table.row_count ?? 0) }
  }

  const { data: rawRows, error: rowError } = await admin
    .from('data_table_rows')
    .select('row_data')
    .eq('organization_id', orgId)
    .eq('data_table_id', tableId)

  if (rowError) throw rowError
  const rows = (rawRows ?? []).map((r) => r.row_data as Record<string, unknown>)
  if (rows.length === 0) throw new Error('No rows to promote')

  await promoteRowsToParquet(orgId, tableId, rows)

  const { error: promoteError } = await admin.rpc('promote_storage_backend', {
    target_table: tableId,
    target: 'parquet',
  })
  if (promoteError) throw promoteError

  await admin
    .from('data_table_rows')
    .delete()
    .eq('organization_id', orgId)
    .eq('data_table_id', tableId)

  return { promoted: true, rowCount: rows.length }
}

export async function promoteTableToParquetIfNeeded(
  admin: SupabaseClient,
  orgId: string,
  tableId: string,
  rowCount: number,
): Promise<void> {
  if (rowCount < PARQUET_ROW_THRESHOLD) return
  try {
    await promoteTableToParquet(admin, orgId, tableId)
  } catch (err) {
    console.error('Auto-promote to parquet failed:', err)
  }
}
