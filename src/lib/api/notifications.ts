import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

export interface NotificationRow {
  id: string
  organizationId: string
  alertRuleId: string | null
  payload: {
    ruleName?: string
    indicatorName?: string
    current?: number
    threshold?: number
    op?: string
    channel?: string
  }
  readAt: string | null
  createdAt: string
}

export function useNotifications(orgId: string | null, userId: string | null) {
  return useQuery({
    queryKey:
      orgId && userId ? workspaceKeys.notifications(orgId, userId) : ['notifications', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId || !userId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('id, organization_id, alert_rule_id, payload, read_at, created_at')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      throwIfSupabaseError(error, 'api.fetchNotifications', { orgId })
      return (data ?? []).map((r) => ({
        id: r.id,
        organizationId: r.organization_id,
        alertRuleId: r.alert_rule_id,
        payload: (r.payload ?? {}) as NotificationRow['payload'],
        readAt: r.read_at,
        createdAt: r.created_at,
      })) as NotificationRow[]
    },
    enabled: Boolean(orgId && userId),
    refetchInterval: 60_000,
  })
}

export function useUnreadNotificationCount(orgId: string | null, userId: string | null) {
  return useQuery({
    queryKey:
      orgId && userId ? workspaceKeys.unreadNotifications(orgId, userId) : ['notifications-unread', 'none'],
    queryFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId || !userId) return 0
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .is('read_at', null)
      throwIfSupabaseError(error, 'api.countUnreadNotifications', { orgId })
      return count ?? 0
    },
    enabled: Boolean(orgId && userId),
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead(orgId: string | null, userId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId ?? '')
      throwIfSupabaseError(error, 'api.markNotificationRead', { notificationId })
    },
    onSuccess: () => {
      if (orgId && userId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.notifications(orgId, userId) })
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.unreadNotifications(orgId, userId) })
      }
    },
  })
}

export function useMarkAllNotificationsRead(orgId: string | null, userId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabase()
      if (!supabase || !orgId || !userId) throw new Error('Not signed in')
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .is('read_at', null)
      throwIfSupabaseError(error, 'api.markAllNotificationsRead', { orgId })
    },
    onSuccess: () => {
      if (orgId && userId) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.notifications(orgId, userId) })
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.unreadNotifications(orgId, userId) })
      }
    },
  })
}
