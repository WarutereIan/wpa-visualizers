import { useQuery } from '@tanstack/react-query'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import type { ConnectionSourceType, ImportJob, ImportJobStatus } from '#/types/connections'

type DbImportJob = {
  id: string
  organization_id: string
  connection_id: string | null
  source_type: ConnectionSourceType
  status: ImportJobStatus
  row_count: number
  error_log: unknown[]
  result_table_id: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

function mapJob(row: DbImportJob): ImportJob {
  return {
    id: row.id,
    organizationId: row.organization_id,
    connectionId: row.connection_id,
    sourceType: row.source_type,
    status: row.status,
    rowCount: Number(row.row_count),
    errorLog: row.error_log ?? [],
    resultTableId: row.result_table_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

async function fetchImportJobs(orgId: string, connectionId?: string): Promise<ImportJob[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  let query = supabase
    .from('import_jobs')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (connectionId) query = query.eq('connection_id', connectionId)

  const { data, error } = await query
  throwIfSupabaseError(error, 'api.fetchImportJobs', { orgId, connectionId })
  return ((data ?? []) as DbImportJob[]).map(mapJob)
}

export function useImportJobs(orgId: string | null, connectionId?: string | null) {
  return useQuery({
    queryKey:
      orgId && connectionId
        ? [...workspaceKeys.importJobs(orgId), connectionId]
        : orgId
          ? workspaceKeys.importJobs(orgId)
          : ['workspace', 'import-jobs', 'none'],
    queryFn: () => fetchImportJobs(orgId!, connectionId ?? undefined),
    enabled: Boolean(orgId),
  })
}
