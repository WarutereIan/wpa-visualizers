import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction, invokePublicEdgeFunction } from '#/lib/api/invoke'
import { workspaceKeys } from '#/lib/api/workspace'

export interface SharedLink {
  id: string
  token: string
  dashboardId: string | null
  snapshotId: string | null
  expiresAt: string | null
  embedAllowed: boolean
  createdAt: string
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

export type SharedLinkPayload =
  | {
      type: 'snapshot'
      embedAllowed: boolean
      snapshot: { id: string; layout: unknown; data: unknown; period: string | null; created_at: string }
    }
  | {
      type: 'dashboard'
      embedAllowed: boolean
      dashboard: {
        id: string
        name: string
        description: string | null
        layout: unknown
        widgets: unknown
      }
    }

export function fetchSharedLinkAccess(token: string, password?: string) {
  return invokePublicEdgeFunction<SharedLinkPayload>('shared-link-access', { token, password })
}
