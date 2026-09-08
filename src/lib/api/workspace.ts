import { useAuthStore } from '#/stores/authStore'
import { isSupabaseConfigured } from '#/lib/env'

/** True when the user is signed in with a provisioned organization. */
export function useWorkspaceReady(): boolean {
  const initialized = useAuthStore((s) => s.initialized)
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  return isSupabaseConfigured() && initialized && Boolean(user && organization?.id)
}

export function useOrgId(): string | null {
  return useAuthStore((s) => s.organization?.id ?? null)
}

export const workspaceKeys = {
  all: ['workspace'] as const,
  tables: (orgId: string) => [...workspaceKeys.all, 'tables', orgId] as const,
  table: (orgId: string, tableId: string) =>
    [...workspaceKeys.tables(orgId), tableId] as const,
  queries: (orgId: string) => [...workspaceKeys.all, 'queries', orgId] as const,
  query: (orgId: string, queryId: string) =>
    [...workspaceKeys.queries(orgId), queryId] as const,
  queryResult: (orgId: string, queryId: string) =>
    [...workspaceKeys.all, 'query-result', orgId, queryId] as const,
  dashboards: (orgId: string) => [...workspaceKeys.all, 'dashboards', orgId] as const,
  dashboard: (orgId: string, dashboardId: string) =>
    [...workspaceKeys.dashboards(orgId), dashboardId] as const,
  visualizations: (orgId: string, queryId?: string) =>
    queryId
      ? ([...workspaceKeys.all, 'visualizations', orgId, queryId] as const)
      : ([...workspaceKeys.all, 'visualizations', orgId] as const),
  widgets: (orgId: string, dashboardId: string) =>
    [...workspaceKeys.all, 'widgets', orgId, dashboardId] as const,
  widgetsAll: (orgId: string) => [...workspaceKeys.all, 'widgets', orgId] as const,
  widgetsByVisualization: (orgId: string, visualizationId: string) =>
    [...workspaceKeys.all, 'widgets-by-viz', orgId, visualizationId] as const,
  favorites: (orgId: string) => [...workspaceKeys.all, 'favorites', orgId] as const,
  mappings: (orgId: string) => [...workspaceKeys.all, 'mappings', orgId] as const,
  mapping: (orgId: string, mappingId: string) =>
    [...workspaceKeys.mappings(orgId), mappingId] as const,
  geoDatasets: (orgId: string) => [...workspaceKeys.all, 'geo-datasets', orgId] as const,
  userPreferences: (userId: string) =>
    [...workspaceKeys.all, 'user-preferences', userId] as const,
  dashboardViewState: (userId: string, dashboardId: string) =>
    [...workspaceKeys.all, 'dashboard-view-state', userId, dashboardId] as const,
  meal: (orgId: string) => [...workspaceKeys.all, 'meal', orgId] as const,
  connections: (orgId: string) => [...workspaceKeys.all, 'connections', orgId] as const,
  importJobs: (orgId: string) => [...workspaceKeys.all, 'import-jobs', orgId] as const,
  usage: (orgId: string) => [...workspaceKeys.all, 'usage', orgId] as const,
  snapshots: (orgId: string) => [...workspaceKeys.all, 'snapshots', orgId] as const,
  sharedLinks: (orgId: string) => [...workspaceKeys.all, 'shared-links', orgId] as const,
  exportJobs: (orgId: string) => [...workspaceKeys.all, 'export-jobs', orgId] as const,
  reports: (orgId: string) => [...workspaceKeys.all, 'reports', orgId] as const,
  audit: (orgId: string) => [...workspaceKeys.all, 'audit', orgId] as const,
  validationRules: (orgId: string) => [...workspaceKeys.all, 'validation-rules', orgId] as const,
  dqIssues: (orgId: string) => [...workspaceKeys.all, 'dq-issues', orgId] as const,
  indicatorDefs: (orgId: string) => [...workspaceKeys.all, 'indicator-defs', orgId] as const,
  indicatorTrends: (orgId: string) => [...workspaceKeys.all, 'indicator-trends', orgId] as const,
  notifications: (orgId: string, userId: string) =>
    [...workspaceKeys.all, 'notifications', orgId, userId] as const,
  unreadNotifications: (orgId: string, userId: string) =>
    [...workspaceKeys.all, 'notifications-unread', orgId, userId] as const,
}
