import type { DashboardDefinition } from '#/types/dashboard'
import type { DashboardWidget, VisualizationDefinition } from '#/types/visualization'

export type QueryUsage = {
  dashboardId: string
  dashboardName: string
  widgetId: string
  widgetTitle: string
}

/** Optional new-model inputs. Legacy jsonb scan always runs as a fallback. */
export type QueryUsageScan = {
  visualizations?: VisualizationDefinition[]
  widgets?: DashboardWidget[]
}

function pushUsage(out: QueryUsage[], seen: Set<string>, usage: QueryUsage) {
  const key = `${usage.dashboardId}:${usage.widgetId}`
  if (seen.has(key)) return
  seen.add(key)
  out.push(usage)
}

/**
 * Find dashboards/widgets that reference a saved query.
 *
 * New model: visualizations on the query + dashboards whose `dashboard_widgets`
 * reference those visualizations.
 * Legacy fallback: dashboard jsonb `widgets[].dataSourceId` (un-migrated dashboards).
 */
export function findQueryUsages(
  dashboards: DashboardDefinition[],
  queryId: string,
  scan: QueryUsageScan = {},
): QueryUsage[] {
  const out: QueryUsage[] = []
  const seen = new Set<string>()
  const dashById = new Map(dashboards.map((d) => [d.id, d]))

  const visualizations = (scan.visualizations ?? []).filter((v) => v.queryId === queryId)
  const vizById = new Map(visualizations.map((v) => [v.id, v]))
  const widgets = scan.widgets ?? []

  for (const widget of widgets) {
    if (!widget.visualizationId) continue
    const viz = vizById.get(widget.visualizationId)
    if (!viz) continue
    const dashboard = dashById.get(widget.dashboardId)
    pushUsage(out, seen, {
      dashboardId: widget.dashboardId,
      dashboardName: dashboard?.name ?? 'Dashboard',
      widgetId: widget.id,
      widgetTitle: viz.name || widget.text || 'Widget',
    })
  }

  for (const viz of visualizations) {
    const onDashboard = widgets.some((w) => w.visualizationId === viz.id)
    if (onDashboard) continue
    pushUsage(out, seen, {
      dashboardId: '',
      dashboardName: 'Query visualizations',
      widgetId: viz.id,
      widgetTitle: viz.name,
    })
  }

  for (const d of dashboards) {
    for (const w of Object.values(d.widgets ?? {})) {
      if (w.dataSourceId === queryId) {
        pushUsage(out, seen, {
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
