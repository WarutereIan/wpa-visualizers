import { createFileRoute, Navigate } from '@tanstack/react-router'

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

/** Legacy manage URL — the wizard is gone; send editors to the Redash page. */
function DashboardManagePage() {
  const { dashboardId } = Route.useParams()
  return (
    <Navigate
      to="/dashboards/$dashboardId"
      params={{ dashboardId }}
      search={{ edit: true }}
      replace
    />
  )
}
