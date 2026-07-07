export type ConnectionSourceType =
  | 'kobo'
  | 'excel'
  | 'surveycto'
  | 'dynamics365'
  | 'google_forms'
  | 'google_sheets'
  | 'microsoft_forms'
  | 'csv'
  | 'api'

export type SyncSchedule = 'manual' | 'hourly' | 'daily' | 'weekly' | 'realtime'

export type ImportJobStatus = 'pending' | 'running' | 'success' | 'failed' | 'partial'

export type SyncStatus = 'success' | 'failed' | 'partial' | 'running'

export interface DataSourceConnection {
  id: string
  organizationId: string
  projectId: string | null
  sourceType: ConnectionSourceType
  name: string
  endpointUrl: string | null
  syncSchedule: SyncSchedule
  schemaSnapshot: Record<string, unknown> | null
  lastSyncAt: string | null
  lastSyncStatus: SyncStatus | null
  lastError: string | null
  createdAt: string
  updatedAt: string
  /** Never returned to client — server strips this */
  credentialsSecretId?: string | null
}

export interface ImportJob {
  id: string
  organizationId: string
  connectionId: string | null
  sourceType: ConnectionSourceType
  status: ImportJobStatus
  rowCount: number
  errorLog: unknown[]
  resultTableId: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface OrganizationUsage {
  organizationId: string
  month: string
  rowsSynced: number
}
