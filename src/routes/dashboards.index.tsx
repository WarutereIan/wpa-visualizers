import { createFileRoute, Link } from '@tanstack/react-router'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/dashboards/')({
  component: DashboardsIndexPage,
})

function DashboardsIndexPage() {
  const { dashboards } = useWorkspaceDashboards()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <DimesBiLogo size="sm" linkToHome={false} className="mt-1 shrink-0" />
          <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Dashboards</h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Create layouts, attach datasets, and organize visualizations.
          </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/dashboards/add">Create with wizard</Link>
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-10 text-center">
          <p className="text-[var(--sea-ink-soft)]">No dashboards yet.</p>
          <Button asChild className="mt-4">
            <Link to="/dashboards/add">Create your first dashboard (wizard)</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <li key={d.id}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm transition hover:border-[var(--lagoon)]">
                <Link
                  to="/dashboards/$dashboardId"
                  params={{ dashboardId: d.id }}
                  className="block"
                >
                  <span className="font-semibold text-[var(--sea-ink)]">{d.name}</span>
                  {d.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">
                      {d.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
                    Updated {new Date(d.updatedAt).toLocaleString()}
                  </p>
                </Link>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboards/$dashboardId/manage" params={{ dashboardId: d.id }}>
                      Manage
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboards/$dashboardId" params={{ dashboardId: d.id }}>
                      Open
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
