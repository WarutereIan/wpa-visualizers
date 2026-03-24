import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { DashboardWizard } from '#/components/dashboard/DashboardWizard'
import { useDashboardStore } from '#/stores/dashboardStore'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/dashboards/$dashboardId/manage')({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.step
    const n =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? parseInt(raw, 10)
          : NaN
    return {
      step: Number.isFinite(n) ? n : undefined,
    }
  },
  component: DashboardManagePage,
})

function DashboardManagePage() {
  const { dashboardId } = Route.useParams()
  const { step } = Route.useSearch()
  const dashboard = useDashboardStore((s) => s.getById(dashboardId))
  const upsertDashboard = useDashboardStore((s) => s.upsertDashboard)
  const navigate = useNavigate()

  if (!dashboard) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
        <p className="text-[var(--sea-ink)]">This dashboard does not exist.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboards">Back to dashboards</Link>
        </Button>
      </div>
    )
  }

  const initialStepIndex =
    step !== undefined && step >= 0 && step <= 2 ? step : 0

  return (
    <DashboardWizard
      mode="manage"
      initialDraft={dashboard}
      initialStepIndex={initialStepIndex}
      title="Manage dashboard"
      subtitle={dashboard.name}
      onCancel={() =>
        navigate({
          to: '/dashboards/$dashboardId',
          params: { dashboardId },
        })
      }
      onComplete={(next) => {
        upsertDashboard(next)
        navigate({
          to: '/dashboards/$dashboardId',
          params: { dashboardId: next.id },
        })
      }}
    />
  )
}
