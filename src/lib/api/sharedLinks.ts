import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction, invokePublicEdgeFunction } from '#/lib/api/invoke'
import {
  type DbDashboardWidget,
  type DbQueryDefinition,
  type DbVisualization,
} from '#/lib/api/mappers'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import { workspaceKeys } from '#/lib/api/workspace'
import type { DataRow } from '#/types/data'

export interface SharedLink {
  id: string
  token: string
  dashboardId: string | null
  snapshotId: string | null
  expiresAt: string | null
  embedAllowed: boolean
  createdAt: string
}

async function fetchActiveDashboardLink(
  orgId: string,
  dashboardId: string,
): Promise<SharedLink | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('shared_links')
    .select('id, token, dashboard_id, snapshot_id, expires_at, embed_allowed, created_at, revoked')
    .eq('organization_id', orgId)
    .eq('dashboard_id', dashboardId)
    .eq('revoked', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  throwIfSupabaseError(error, 'api.fetchActiveDashboardLink', { orgId, dashboardId })
  if (!data) return null
  return {
    id: data.id,
    token: data.token,
    dashboardId: data.dashboard_id,
    snapshotId: data.snapshot_id,
    expiresAt: data.expires_at,
    embedAllowed: data.embed_allowed,
    createdAt: data.created_at,
  }
}

export function useDashboardSharedLink(orgId: string | null, dashboardId: string | null) {
  return useQuery({
    queryKey:
      orgId && dashboardId
        ? [...workspaceKeys.sharedLinks(orgId), dashboardId]
        : ['workspace', 'shared-links', 'none'],
    queryFn: () => fetchActiveDashboardLink(orgId!, dashboardId!),
    enabled: Boolean(orgId && dashboardId),
  })
}

export function useCreateSharedLink(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      dashboardId?: string
      snapshotId?: string
      password?: string
      expiresAt?: string
      embedAllowed?: boolean
    }) => {
      if (!orgId) throw new Error('No organization')
      return invokeEdgeFunction<{
        id: string
        token: string
        expires_at: string | null
        embed_allowed: boolean
      }>('create-shared-link', { organizationId: orgId, ...input })
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.sharedLinks(orgId) })
      }
    },
  })
}

export function useRevokeDashboardSharedLink(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dashboardId: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('shared_links')
        .update({ revoked: true })
        .eq('organization_id', orgId)
        .eq('dashboard_id', dashboardId)
        .eq('revoked', false)
      throwIfSupabaseError(error, 'api.revokeDashboardSharedLink', { orgId, dashboardId })
    },
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.sharedLinks(orgId) })
      }
    },
  })
}

export type SharedSnapshotPayload = {
  type: 'snapshot'
  embedAllowed: boolean
  snapshot: { id: string; layout: unknown; data: unknown; period: string | null; created_at: string }
}

export type SharedLegacyDashboardPayload = {
  type: 'dashboard'
  embedAllowed: boolean
  dashboard: {
    id: string
    name: string
    description: string | null
    layout: unknown
    widgets: unknown
    updated_at?: string
  }
}

export type SharedRedashDashboardPayload = SharedLegacyDashboardPayload & {
  widgets: DbDashboardWidget[]
  visualizations: DbVisualization[]
  queries: DbQueryDefinition[]
  queryResults: Record<string, DataRow[]>
  queryErrors?: Record<string, string>
}

export type SharedLinkPayload =
  | SharedSnapshotPayload
  | SharedRedashDashboardPayload
  | SharedLegacyDashboardPayload

export function isRedashPublicDashboard(
  payload: SharedLinkPayload,
): payload is SharedRedashDashboardPayload {
  return payload.type === 'dashboard' && 'queryResults' in payload && Array.isArray(payload.widgets)
}

export function fetchSharedLinkAccess(token: string, password?: string) {
  return invokePublicEdgeFunction<SharedLinkPayload>('shared-link-access', { token, password })
}
