import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { DashboardWizard } from '#/components/dashboard/DashboardWizard'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import {
  resolveEditableDashboard,
  useDashboardDraftStore,
} from '#/stores/dashboardDraftStore'
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
  const { getById, upsertDashboard } = useWorkspaceDashboards()
  const draft = useDashboardDraftStore((s) => s.drafts[dashboardId])
  const published = getById(dashboardId)
  const dashboard = resolveEditableDashboard(published, draft)
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
      subtitle={
        draft && published
          ? `${dashboard.name} · local draft may differ from live`
          : dashboard.name
      }
      onCancel={() =>
        navigate({
          to: '/dashboards',
        })
      }
      onPublish={async (next) => {
        await upsertDashboard({ ...next, status: 'published' })
        navigate({
          to: '/dashboards/$dashboardId',
          params: { dashboardId: next.id },
        })
      }}
    />
  )
}
