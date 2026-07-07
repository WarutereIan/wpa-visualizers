import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { csvAdapter } from './connectors/csv.ts'
import { dynamics365Adapter } from './connectors/dynamics365.ts'
import { koboAdapter } from './connectors/kobo.ts'
import { surveyctoAdapter } from './connectors/surveycto.ts'
import { promoteTableToParquetIfNeeded } from './promoteParquet.ts'
import type { ConnectorAdapter } from './connectors/types.ts'
import type { DataRow } from './connectors/types.ts'
import { currentMonthKey, planLimitFor } from './planLimits.ts'
import { readConnectionSecret, storeConnectionSecret } from './vault.ts'

const ROW_BATCH = 500

const adapters: Record<string, ConnectorAdapter> = {
  csv: csvAdapter,
  excel: csvAdapter,
  kobo: koboAdapter,
  surveycto: surveyctoAdapter,
  dynamics365: dynamics365Adapter,
}

function inferColumnsFromRows(rows: DataRow[]) {
  const first = rows[0] ?? {}
  return Object.keys(first).map((name) => {
    const sample = rows.find((r) => r[name] !== null && r[name] !== undefined)?.[name]
    const type = typeof sample
    return {
      name,
      type: type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : 'string',
    }
  })
}

export async function assertOrgMember(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) throw new Error('Forbidden')
}

const ROLE_RANK: Record<string, number> = {
  guest: 0,
  viewer: 1,
  partner: 1,
  editor: 2,
  data_manager: 2,
  admin: 3,
  owner: 4,
}

/** Throws `Forbidden` unless the user's org role is at least one of `allowedRoles`. */
export async function assertOrgRole(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  allowedRoles: string[],
): Promise<void> {
  const { data, error } = await admin
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) throw new Error('Forbidden')
  const userRank = ROLE_RANK[data.role] ?? 0
  const minRequired = Math.max(...allowedRoles.map((r) => ROLE_RANK[r] ?? 0))
  if (userRank < minRequired) throw new Error('Forbidden')
}

export async function checkPlanLimit(
  admin: SupabaseClient,
  orgId: string,
  incomingRows: number,
): Promise<void> {
  const [{ data: org }, { data: usage }] = await Promise.all([
    admin.from('organizations').select('plan').eq('id', orgId).maybeSingle(),
    admin
      .from('organization_usage')
      .select('rows_synced')
      .eq('organization_id', orgId)
      .eq('month', currentMonthKey())
      .maybeSingle(),
  ])
  const limit = planLimitFor(org?.plan)
  const used = Number(usage?.rows_synced ?? 0)
  if (used + incomingRows > limit) {
    throw new Error(`Plan limit exceeded (${used + incomingRows} > ${limit} rows/month)`)
  }
}

export async function writeTableRows(
  admin: SupabaseClient,
  orgId: string,
  tableName: string,
  rows: DataRow[],
  connectionId: string | null,
): Promise<{ tableId: string; rowCount: number }> {
  const columns = inferColumnsFromRows(rows)

  const { data: table, error: tableError } = await admin
    .from('data_tables')
    .insert({
      organization_id: orgId,
      name: tableName.trim() || 'Imported Table',
      storage_backend: 'jsonb',
      row_count: rows.length,
      source_connection_id: connectionId,
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

  const { error: colError } = await admin.from('data_table_columns').insert(columnPayload)
  if (colError) throw colError

  for (let i = 0; i < rows.length; i += ROW_BATCH) {
    const chunk = rows.slice(i, i + ROW_BATCH).map((row_data) => ({
      organization_id: orgId,
      data_table_id: table.id,
      row_data,
    }))
    const { error: rowError } = await admin.from('data_table_rows').insert(chunk)
    if (rowError) throw rowError
  }

  return { tableId: table.id, rowCount: rows.length }
}

export async function runIngest(opts: {
  admin: SupabaseClient
  orgId: string
  userId: string
  connectionId?: string
  connection?: {
    name: string
    sourceType: string
    endpointUrl?: string | null
    syncSchedule?: string
    credentials?: Record<string, unknown>
    tableName: string
    rows?: DataRow[]
  }
}): Promise<{ jobId: string; tableId: string; rowCount: number; connectionId: string }> {
  const { admin, orgId, userId } = opts

  let connectionId = opts.connectionId ?? null
  let sourceType: string
  let endpointUrl: string | null = null
  let credentials: Record<string, string> = {}
  let tableName: string
  let secretId: string | null = null

  if (connectionId) {
    const { data: conn, error } = await admin
      .from('data_source_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (error || !conn) throw new Error('Connection not found')
    sourceType = conn.source_type
    endpointUrl = conn.endpoint_url
    tableName = conn.name
    secretId = conn.credentials_secret_id
    credentials = await readConnectionSecret(admin, secretId)
  } else if (opts.connection) {
    sourceType = opts.connection.sourceType
    endpointUrl = opts.connection.endpointUrl ?? null
    tableName = opts.connection.tableName
    const creds = { ...(opts.connection.credentials ?? {}) }
    if (opts.connection.rows) {
      creds.__rows = JSON.stringify(opts.connection.rows)
    }
    secretId = await storeConnectionSecret(admin, opts.connection.name, creds)
    credentials = Object.fromEntries(
      Object.entries(creds).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
    )

    const { data: created, error: createErr } = await admin
      .from('data_source_connections')
      .insert({
        organization_id: orgId,
        source_type: sourceType,
        name: opts.connection.name,
        endpoint_url: endpointUrl,
        credentials_secret_id: secretId,
        sync_schedule: opts.connection.syncSchedule ?? 'manual',
        last_sync_status: 'running',
      })
      .select('*')
      .single()
    if (createErr) throw createErr
    connectionId = created.id
  } else {
    throw new Error('connectionId or connection payload required')
  }

  const adapter = adapters[sourceType]
  if (!adapter) throw new Error(`Connector not implemented: ${sourceType}`)

  const { data: job, error: jobErr } = await admin
    .from('import_jobs')
    .insert({
      organization_id: orgId,
      connection_id: connectionId,
      source_type: sourceType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  if (jobErr) throw jobErr

  try {
    const rows = await adapter.fetchRows({ endpointUrl, credentials })
    if (rows.length === 0) throw new Error('No rows returned from connector')

    await checkPlanLimit(admin, orgId, rows.length)

    const { tableId, rowCount } = await writeTableRows(
      admin,
      orgId,
      opts.connection?.tableName ?? tableName,
      rows,
      connectionId,
    )

    await promoteTableToParquetIfNeeded(admin, orgId, tableId, rowCount)

    const schemaSnapshot = { columns: inferColumnsFromRows(rows) }

    await admin
      .from('data_source_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_error: null,
        schema_snapshot: schemaSnapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId!)

    await admin
      .from('import_jobs')
      .update({
        status: 'success',
        row_count: rowCount,
        result_table_id: tableId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    await admin.rpc('bump_org_usage', {
      org_id: orgId,
      month_str: currentMonthKey(),
      delta: rowCount,
    })

    return { jobId: job.id, tableId, rowCount, connectionId: connectionId! }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ingest failed'
    await admin
      .from('import_jobs')
      .update({
        status: 'failed',
        error_log: [{ message, at: new Date().toISOString(), userId }],
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
    if (connectionId) {
      await admin
        .from('data_source_connections')
        .update({
          last_sync_status: 'failed',
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId)
    }
    throw err
  }
}
