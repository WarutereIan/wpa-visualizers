import type { DashboardDefinition } from '#/types/dashboard'

export type QueryUsage = {
  dashboardId: string
  dashboardName: string
  widgetId: string
  widgetTitle: string
}

/** Find all widgets across dashboards that reference a saved query id. */
export function findQueryUsages(
  dashboards: DashboardDefinition[],
  queryId: string,
): QueryUsage[] {
  const out: QueryUsage[] = []
  for (const d of dashboards) {
    for (const w of Object.values(d.widgets ?? {})) {
      if (w.dataSourceId === queryId) {
        out.push({
          dashboardId: d.id,
          dashboardName: d.name,
          widgetId: w.id,
          widgetTitle: w.title,
        })
      }
    }
  }
  return out
}

export function formatQueryUsageSummary(usages: QueryUsage[]): string {
  if (usages.length === 0) return 'Not used by any widgets yet.'
  if (usages.length === 1) {
    return `Used by 1 widget (“${usages[0].widgetTitle}” on ${usages[0].dashboardName}).`
  }
  const dashCount = new Set(usages.map((u) => u.dashboardId)).size
  return `Used by ${usages.length} widgets across ${dashCount} dashboard${dashCount === 1 ? '' : 's'}.`
}

/** Bullet-friendly lines for impact banners (cap at 6). */
export function formatQueryUsageLines(usages: QueryUsage[], limit = 6): string[] {
  return usages.slice(0, limit).map((u) => `“${u.widgetTitle}” on ${u.dashboardName}`)
}

/** Default name for a query created from the dashboard widget panel. */
export function suggestWidgetQueryName(input: {
  widgetTitle: string
  widgetType: string
  tableName?: string | null
}): string {
  const table = input.tableName?.trim()
  const title = input.widgetTitle?.trim() || input.widgetType
  if (table) return `${title} · ${table}`
  return `${title} data`
}
