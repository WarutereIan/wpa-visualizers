import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction } from '#/lib/api/invoke'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export interface ValidationRule {
  id: string
  organizationId: string
  dataTableId: string | null
  columnName: string | null
  ruleType: string
  expression: Record<string, unknown>
  severity: string
}

export interface DataQualityIssue {
  id: string
  organizationId: string
  validationRuleId: string | null
  dataTableId: string | null
  rowId: string | null
  status: string
  createdAt: string
}

export function useValidationRules(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.validationRules(orgId) : ['validation-rules', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return []
      const { data, error } = await supabase
        .from('validation_rules')
        .select('*')
        .eq('organization_id', orgId)
      throwIfSupabaseError(error, 'api.fetchValidationRules', { orgId })
      return (data ?? []).map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        dataTableId: r.data_table_id,
        columnName: r.column_name,
        ruleType: r.rule_type,
        expression: (r.expression ?? {}) as Record<string, unknown>,
        severity: r.severity,
      })) as ValidationRule[]
    },
    enabled: Boolean(orgId),
  })
}

export function useDataQualityIssues(orgId: string | null, status?: string) {
  return useQuery({
    queryKey: orgId
      ? [...workspaceKeys.dqIssues(orgId), status ?? 'all']
      : ['dq-issues', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId) return []
      let q = supabase
        .from('data_quality_issues')
        .select('*')
        .eq('organization_id', orgId)
      if (status) q = q.eq('status', status)
      const { data, error } = await q.order('created_at', { ascending: false })
      throwIfSupabaseError(error, 'api.fetchDataQualityIssues', { orgId })
      return (data ?? []).map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        validationRuleId: r.validation_rule_id,
        dataTableId: r.data_table_id,
        rowId: r.row_id,
        status: r.status,
        createdAt: r.created_at,
      })) as DataQualityIssue[]
    },
    enabled: Boolean(orgId),
  })
}

export function useCreateValidationRule(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      dataTableId: string
      columnName: string
      ruleType: string
      expression: Record<string, unknown>
      severity?: string
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')
      const { data, error } = await supabase
        .from('validation_rules')
        .insert({
          organization_id: orgId,
          data_table_id: input.dataTableId,
          column_name: input.columnName,
          rule_type: input.ruleType,
          expression: input.expression,
          severity: input.severity ?? 'warning',
        })
        .select('*')
        .single()
      throwIfSupabaseError(error, 'api.createValidationRule', { orgId })
      return data
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.validationRules(orgId) })
      }
    },
  })
}

export function useUpdateIssueStatus(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('data_quality_issues')
        .update({
          status,
          resolved_at: status === 'resolved' || status === 'accepted' ? new Date().toISOString() : null,
        })
        .eq('id', id)
      throwIfSupabaseError(error, 'api.updateIssueStatus', { id })
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.dqIssues(orgId) })
      }
    },
  })
}

export function useRunValidation(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dataTableId: string) => {
      if (!orgId) throw new Error('No organization')
      return invokeEdgeFunction<{ issuesCreated: number }>('validate-data', {
        organizationId: orgId,
        dataTableId,
      })
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.dqIssues(orgId) })
      }
    },
  })
}
