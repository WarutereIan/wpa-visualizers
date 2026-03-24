import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout/legacy'
import { Link } from '@tanstack/react-router'
import type { DashboardDefinition } from '#/types/dashboard'
import { WidgetRenderer } from '#/components/dashboard/WidgetRenderer'
import { useDashboardFilterStore } from '#/stores/dashboardFilterStore'
import { Button } from '#/components/ui/button'

const GridWithWidth = WidthProvider(GridLayout)

export function DashboardViewer({
  dashboard,
  showEditLink,
}: {
  dashboard: DashboardDefinition
  showEditLink?: boolean
}) {
  const { filters, setDateRange, reset } = useDashboardFilterStore()
  const layout: Layout = dashboard.layout

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{dashboard.description}</p>
          )}
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
        Date filters are stored in Zustand and ready to wire into widget queries. Demo data is
        unchanged for now.
      </p>

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
              <WidgetRenderer config={cfg} readOnly />
            </div>
          )
        })}
      </GridWithWidth>
    </div>
  )
}
