import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '#/components/dashboard/redash/DashboardPage'

export const Route = createFileRoute('/dashboards/$dashboardId')({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: search.edit === true || search.edit === '1' || search.edit === 'true',
  }),
  component: DashboardViewPage,
})

function DashboardViewPage() {
  const { dashboardId } = Route.useParams()
  return <DashboardPage dashboardId={dashboardId} />
}
