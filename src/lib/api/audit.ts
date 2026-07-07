import { useQuery } from '@tanstack/react-query'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export interface AuditLogEntry {
  id: string
  organizationId: string | null
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

async function fetchAuditLogs(orgId: string, limit = 100): Promise<AuditLogEntry[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, organization_id, user_id, action, entity_type, entity_id, metadata, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  throwIfSupabaseError(error, 'api.fetchAuditLogs', { orgId })
  return (data ?? []).map((r) => ({
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    createdAt: r.created_at,
  }))
}

export function useAuditLogs(orgId: string | null, limit = 100) {
  return useQuery({
    queryKey: orgId ? [...workspaceKeys.audit(orgId), limit] : ['audit', 'none'],
    queryFn: () => fetchAuditLogs(orgId!, limit),
    enabled: Boolean(orgId),
  })
}
