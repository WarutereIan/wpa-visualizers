import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboards/$dashboardId/edit')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/dashboards/$dashboardId/manage',
      params: { dashboardId: params.dashboardId },
    })
  },
})
