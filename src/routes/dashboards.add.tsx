import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { DashboardWizard } from '#/components/dashboard/DashboardWizard'
import { createNewDashboardDraft, useDashboardStore } from '#/stores/dashboardStore'
import type { DashboardDefinition } from '#/types/dashboard'

export const Route = createFileRoute('/dashboards/add')({
  component: DashboardAddPage,
})

function DashboardAddPage() {
  const navigate = useNavigate()
  const upsertDashboard = useDashboardStore((s) => s.upsertDashboard)
  const draftRef = useRef<DashboardDefinition | null>(null)
  if (!draftRef.current) {
    draftRef.current = createNewDashboardDraft({ templateId: 'blank' })
  }
  const initialDraft = useMemo(() => draftRef.current!, [])

  return (
    <DashboardWizard
      mode="create"
      initialDraft={initialDraft}
      title="Create dashboard"
      subtitle="Step through basics, pick a template, build your layout, then review."
      onCancel={() => navigate({ to: '/dashboards' })}
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
