import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { DashboardViewer } from '#/components/dashboard/DashboardViewer'
import { useDashboardStore } from '#/stores/dashboardStore'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/dashboards/$dashboardId')({
  component: DashboardViewPage,
})

function DashboardViewPage() {
  const { dashboardId } = Route.useParams()
  const dashboard = useDashboardStore((s) => s.getById(dashboardId))
  const removeDashboard = useDashboardStore((s) => s.removeDashboard)
  const navigate = useNavigate()

  if (!dashboard) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
        <p className="text-[var(--sea-ink)]">This dashboard does not exist (or was removed).</p>
        <Button asChild className="mt-4">
          <Link to="/dashboards">Back to dashboards</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            removeDashboard(dashboardId)
            navigate({ to: '/dashboards' })
          }}
        >
          Delete dashboard
        </Button>
      </div>
      <DashboardViewer dashboard={dashboard} showEditLink />
    </div>
  )
}
