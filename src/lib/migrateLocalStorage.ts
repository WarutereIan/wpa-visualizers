import type { DashboardDefinition } from '#/types/dashboard'
import type { DataTable, QueryDefinition } from '#/types/data'
import type { MappingDefinition } from '#/types/mapping'
import { importTableToOrg } from '#/lib/api/tables'
import { getSupabase } from '#/lib/supabaseClient'
import { mapDashboardToDb, mapMappingToDb, mapQueryToDb } from '#/lib/api/mappers'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'

const DATA_KEY = 'wpa-data-layer-v3'
const DASHBOARD_KEY = 'wpa-dashboards-v1'
const MAPPING_KEY = 'wpa-mappings-v2'
const MIGRATED_FLAG = 'dimes-bi-local-migrated'

interface PersistedDataLayer {
  state?: {
    tables?: DataTable[]
    queries?: QueryDefinition[]
  }
}

interface PersistedDashboards {
  state?: { dashboards?: DashboardDefinition[] }
}

interface PersistedMappings {
  state?: { mappings?: MappingDefinition[] }
}

export function hasLocalWorkspaceData(): boolean {
  if (typeof localStorage === 'undefined') return false
  if (localStorage.getItem(MIGRATED_FLAG)) return false
  return [DATA_KEY, DASHBOARD_KEY, MAPPING_KEY].some((key) => Boolean(localStorage.getItem(key)))
}

function readPersisted<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function migrateLocalStorageToOrg(orgId: string): Promise<{
  tables: number
  queries: number
  dashboards: number
  mappings: number
}> {
  const data = readPersisted<PersistedDataLayer>(DATA_KEY)
  const dashboards = readPersisted<PersistedDashboards>(DASHBOARD_KEY)
  const mappings = readPersisted<PersistedMappings>(MAPPING_KEY)

  const tableIdMap = new Map<string, string>()
  let tableCount = 0
  let queryCount = 0
  let dashboardCount = 0
  let mappingCount = 0

  for (const table of data?.state?.tables ?? []) {
    const imported = await importTableToOrg(orgId, {
      name: table.name,
      rows: table.rows,
    })
    tableIdMap.set(table.id, imported.id)
    tableCount += 1
  }

  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  for (const query of data?.state?.queries ?? []) {
    const newId = crypto.randomUUID()
    const mappedTableId = tableIdMap.get(query.tableId) ?? query.tableId
    const payload = mapQueryToDb(
      {
        ...query,
        id: newId,
        tableId: mappedTableId,
      },
      orgId,
    )
    const { error } = await supabase.from('query_definitions').insert(payload)
    throwIfSupabaseError(error, 'migrate.importQuery', { queryId: query.id })
    queryCount += 1
  }

  for (const dashboard of dashboards?.state?.dashboards ?? []) {
    const payload = mapDashboardToDb(dashboard, orgId)
    const { error } = await supabase.from('dashboards').upsert(payload)
    throwIfSupabaseError(error, 'migrate.importDashboard', { dashboardId: dashboard.id })
    dashboardCount += 1
  }

  for (const mapping of mappings?.state?.mappings ?? []) {
    const payload = mapMappingToDb(
      {
        ...mapping,
        dataTableId: mapping.dataTableId
          ? (tableIdMap.get(mapping.dataTableId) ?? mapping.dataTableId)
          : null,
      },
      orgId,
    )
    const { error } = await supabase.from('mappings').upsert(payload)
    throwIfSupabaseError(error, 'migrate.importMapping', { mappingId: mapping.id })
    mappingCount += 1
  }

  localStorage.setItem(MIGRATED_FLAG, new Date().toISOString())
  localStorage.removeItem(DATA_KEY)
  localStorage.removeItem(DASHBOARD_KEY)
  localStorage.removeItem(MAPPING_KEY)

  return {
    tables: tableCount,
    queries: queryCount,
    dashboards: dashboardCount,
    mappings: mappingCount,
  }
}
