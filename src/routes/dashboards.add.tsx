import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import { DashboardWizard } from '#/components/dashboard/DashboardWizard'
import { createNewDashboardDraft } from '#/stores/dashboardStore'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import type { DashboardDefinition } from '#/types/dashboard'

export const Route = createFileRoute('/dashboards/add')({
  component: DashboardAddPage,
})

function DashboardAddPage() {
  const navigate = useNavigate()
  const { upsertDashboard } = useWorkspaceDashboards()
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
      subtitle="Drafts stay in this browser until you publish live."
      onCancel={() => navigate({ to: '/dashboards' })}
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
