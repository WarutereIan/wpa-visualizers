import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction } from '#/lib/api/invoke'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import type {
  ConnectionSourceType,
  DataSourceConnection,
  ImportJob,
  OrganizationUsage,
  SyncSchedule,
} from '#/types/connections'
import type { DataRow } from '#/types/data'

type DbConnection = {
  id: string
  organization_id: string
  project_id: string | null
  source_type: ConnectionSourceType
  name: string
  endpoint_url: string | null
  credentials_secret_id: string | null
  sync_schedule: SyncSchedule
  schema_snapshot: Record<string, unknown> | null
  last_sync_at: string | null
  last_sync_status: DataSourceConnection['lastSyncStatus']
  last_error: string | null
  created_at: string
  updated_at: string
}

function mapConnection(row: DbConnection, stripSecrets = true): DataSourceConnection {
  const conn: DataSourceConnection = {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    sourceType: row.source_type,
    name: row.name,
    endpointUrl: row.endpoint_url,
    syncSchedule: row.sync_schedule,
    schemaSnapshot: row.schema_snapshot,
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  if (!stripSecrets) conn.credentialsSecretId = row.credentials_secret_id
  return conn
}

async function fetchConnections(orgId: string): Promise<DataSourceConnection[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('data_source_connections')
    .select(
      'id, organization_id, project_id, source_type, name, endpoint_url, sync_schedule, schema_snapshot, last_sync_at, last_sync_status, last_error, created_at, updated_at',
    )
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  throwIfSupabaseError(error, 'api.fetchConnections', { orgId })
  return ((data ?? []) as DbConnection[]).map((r) => mapConnection(r))
}

export function useConnections(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.connections(orgId) : ['workspace', 'connections', 'none'],
    queryFn: () => fetchConnections(orgId!),
    enabled: Boolean(orgId),
  })
}

export function useTriggerIngest(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      connectionId?: string
      connection?: {
        name: string
        sourceType: ConnectionSourceType
        endpointUrl?: string | null
        syncSchedule?: SyncSchedule
        credentials?: Record<string, unknown>
        tableName: string
        rows?: DataRow[]
      }
    }) => {
      if (!orgId) throw new Error('No organization')
      const result = await invokeEdgeFunction<{
        jobId: string
        tableId: string
        rowCount: number
        connectionId: string
      }>('ingest', { organizationId: orgId, ...input })

      void invokeEdgeFunction('refresh-aggregates', { organizationId: orgId }).catch(() => {})
      return result
    },
    onSuccess: () => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.connections(orgId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.importJobs(orgId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.tables(orgId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.meal(orgId) })
    },
  })
}

export function useDeleteConnection(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('data_source_connections')
        .delete()
        .eq('id', connectionId)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteConnection', { orgId, connectionId })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.connections(orgId) })
    },
  })
}

export function useOrganizationUsage(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.usage(orgId) : ['workspace', 'usage', 'none'],
    queryFn: async (): Promise<OrganizationUsage | null> => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return null
      const month = new Date().toISOString().slice(0, 7)
      const { data, error } = await supabase
        .from('organization_usage')
        .select('*')
        .eq('organization_id', orgId)
        .eq('month', month)
        .maybeSingle()
      throwIfSupabaseError(error, 'api.fetchUsage', { orgId })
      if (!data) return { organizationId: orgId, month, rowsSynced: 0 }
      return {
        organizationId: data.organization_id,
        month: data.month,
        rowsSynced: Number(data.rows_synced),
      }
    },
    enabled: Boolean(orgId),
  })
}

export async function promoteTableBackend(orgId: string, tableId: string): Promise<void> {
  await invokeEdgeFunction<{ promoted: boolean; rowCount: number }>('promote-to-parquet', {
    organizationId: orgId,
    tableId,
  })
}

export type { ImportJob }
export { fetchConnections }
