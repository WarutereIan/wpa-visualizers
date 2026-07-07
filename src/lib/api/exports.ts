import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export type ExportTargetType = 'dashboard' | 'snapshot' | 'report'
export type ExportFormat = 'pdf' | 'pptx' | 'csv' | 'png' | 'svg'
export type ExportStatus = 'queued' | 'running' | 'success' | 'failed'

export interface ExportJob {
  id: string
  organizationId: string
  targetType: ExportTargetType
  targetId: string | null
  format: ExportFormat
  status: ExportStatus
  resultUrl: string | null
  error: string | null
  createdAt: string
  completedAt: string | null
}

export interface Report {
  id: string
  name: string
  period: string | null
  status: string
  blocks: unknown[]
  createdAt: string
}

function mapExportJob(r: Record<string, unknown>): ExportJob {
  return {
    id: r.id as string,
    organizationId: r.organization_id as string,
    targetType: r.target_type as ExportTargetType,
    targetId: (r.target_id as string | null) ?? null,
    format: r.format as ExportFormat,
    status: r.status as ExportStatus,
    resultUrl: (r.result_url as string | null) ?? null,
    error: (r.error as string | null) ?? null,
    createdAt: r.created_at as string,
    completedAt: (r.completed_at as string | null) ?? null,
  }
}

export function useExportJobs(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.exportJobs(orgId) : ['export-jobs', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return []
      const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50)
      throwIfSupabaseError(error, 'api.fetchExportJobs', { orgId })
      return (data ?? []).map((r) => mapExportJob(r as unknown as Record<string, unknown>)) as ExportJob[]
    },
    enabled: Boolean(orgId),
    refetchInterval: (query) => {
      const rows = query.state.data as ExportJob[] | undefined
      return rows?.some((j) => j.status === 'queued' || j.status === 'running') ? 5000 : false
    },
  })
}

export function useCreateExportJob(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      targetType: ExportTargetType
      targetId: string
      format: Exclude<ExportFormat, 'svg'>
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('export_jobs')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          target_type: input.targetType,
          target_id: input.targetId,
          format: input.format,
          status: 'queued',
        })
        .select('*')
        .single()
      throwIfSupabaseError(error, 'api.createExportJob', { orgId })
      return mapExportJob(data as unknown as Record<string, unknown>)
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.exportJobs(orgId) })
      }
    },
  })
}

export function useReports(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.reports(orgId) : ['reports', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return []
      const { data, error } = await supabase
        .from('reports')
        .select('id, name, period, status, blocks, created_at')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
      throwIfSupabaseError(error, 'api.fetchReports', { orgId })
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        period: r.period,
        status: r.status,
        blocks: r.blocks ?? [],
        createdAt: r.created_at,
      })) as Report[]
    },
    enabled: Boolean(orgId),
  })
}

export function useCreateReport(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; period?: string }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')
      const { data, error } = await supabase
        .from('reports')
        .insert({
          organization_id: orgId,
          name: input.name.trim(),
          period: input.period ?? null,
        })
        .select('*')
        .single()
      throwIfSupabaseError(error, 'api.createReport', { orgId })
      return data
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(orgId) })
      }
    },
  })
}
