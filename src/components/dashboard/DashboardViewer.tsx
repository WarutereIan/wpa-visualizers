import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout/legacy'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { DashboardDefinition } from '#/types/dashboard'
import { WidgetRenderer } from '#/components/dashboard/WidgetRenderer'
import { useDashboardFilterStore } from '#/stores/dashboardFilterStore'
import { useDashboardViewState, useUpsertDashboardViewState } from '#/lib/api/dashboardViewStates'
import { useWorkspaceReady } from '#/lib/api/workspace'
import { useAuthStore } from '#/stores/authStore'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import { Button } from '#/components/ui/button'
import {
  dashboardThemeStyle,
  normalizeDashboardTheme,
} from '#/lib/chartPalettes'

const GridWithWidth = WidthProvider(GridLayout)

/**
 * Hydrates the in-memory dashboard filter store from `dashboard_view_states`
 * once per dashboard when signed in, then persists subsequent edits back to
 * the server (debounced). When unsigned / demo, the store is used as-is.
 */
function usePersistedDashboardFilters(dashboardId: string | undefined) {
  const workspaceReady = useWorkspaceReady()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const filters = useDashboardFilterStore((s) => s.filters)
  const setDateRange = useDashboardFilterStore((s) => s.setDateRange)
  const reset = useDashboardFilterStore((s) => s.reset)

  const viewStateQuery = useDashboardViewState(
    workspaceReady && userId ? userId : null,
    workspaceReady && dashboardId ? dashboardId : null,
  )
  const upsert = useUpsertDashboardViewState(
    workspaceReady && userId ? userId : null,
    workspaceReady && dashboardId ? dashboardId : null,
  )

  // One-shot hydration per dashboard. Re-running on every query change would
  // fight local edits (server stale vs. store current) and loop.
  const hydratedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!workspaceReady || !dashboardId || !viewStateQuery.data) return
    if (hydratedFor.current === dashboardId) return
    hydratedFor.current = dashboardId
    const server = viewStateQuery.data
    setDateRange(server.dateFrom, server.dateTo)
  }, [workspaceReady, dashboardId, viewStateQuery.data, setDateRange])

  // Reset the hydration gate when switching dashboards so the new view hydrates.
  useEffect(() => {
    if (hydratedFor.current && hydratedFor.current !== dashboardId) {
      hydratedFor.current = null
      reset()
    }
  }, [dashboardId, reset])

  // Persist local edits back to the server (debounced), only after hydration.
  useEffect(() => {
    if (!workspaceReady || !dashboardId || hydratedFor.current !== dashboardId) return
    const handle = setTimeout(() => {
      void upsert.mutateAsync(filters).catch(() => {
        /* best-effort persistence; surfaced via query network state */
      })
    }, 400)
    return () => clearTimeout(handle)
  }, [workspaceReady, dashboardId, filters, upsert])

  return { filters, setDateRange, reset }
}

export function DashboardViewer({
  dashboard,
  showEditLink,
}: {
  dashboard: DashboardDefinition
  showEditLink?: boolean
}) {
  const { filters, setDateRange, reset } = usePersistedDashboardFilters(dashboard.id)
  const layout: Layout = dashboard.layout
  const theme = normalizeDashboardTheme(dashboard.theme)
  const paletteId = theme.paletteId

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <DimesBiLogo size="xs" variant="icon" linkToHome={false} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{dashboard.description}</p>
          )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--sea-ink-soft)]">Global filters</span>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) =>
              setDateRange(e.target.value || null, filters.dateTo)
            }
            className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
            aria-label="From date"
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) =>
              setDateRange(filters.dateFrom, e.target.value || null)
            }
            className="h-9 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm"
            aria-label="To date"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => reset()}>
            Clear
          </Button>
          {showEditLink && (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link
                to="/dashboards/$dashboardId/manage"
                params={{ dashboardId: dashboard.id }}
              >
                Manage dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--sea-ink-soft)]">
        KPI widgets with an indicator binding load from pre-computed <code>indicator_values</code> when
        signed in. Other widgets use saved queries.
      </p>

      <div
        className="rounded-xl border border-[var(--line)] p-2"
        style={dashboardThemeStyle(paletteId)}
      >
      <GridWithWidth
        className="min-h-[280px]"
        cols={12}
        rowHeight={36}
        margin={[8, 8]}
        containerPadding={[8, 8]}
        layout={layout}
        isDraggable={false}
        isResizable={false}
        compactType="vertical"
      >
        {layout.map((item) => {
          const cfg = dashboard.widgets[item.i]
          if (!cfg) return null
          return (
            <div key={item.i} className="rounded-lg bg-[var(--surface)] p-1">
              <WidgetRenderer config={cfg} readOnly paletteId={paletteId} />
            </div>
          )
        })}
      </GridWithWidth>
      </div>
    </div>
  )
}
