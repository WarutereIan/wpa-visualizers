import { createFileRoute, Link } from '@tanstack/react-router'
import { DashboardViewer } from '#/components/dashboard/DashboardViewer'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useDashboardDraftStore } from '#/stores/dashboardDraftStore'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/dashboards/$dashboardId/preview')({
  component: DashboardPreviewPage,
})

function DashboardPreviewPage() {
  const { dashboardId } = Route.useParams()
  const { getById } = useWorkspaceDashboards()
  const draft = useDashboardDraftStore((s) => s.drafts[dashboardId])
  const published = getById(dashboardId)
  const dashboard = draft ?? published

  if (!dashboard) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
        <p className="text-[var(--sea-ink)]">
          No local draft or published dashboard found for this id.
        </p>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Open the builder and wait for autosave, then refresh this tab.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboards">Back to dashboards</Link>
        </Button>
      </div>
    )
  }

  const isDraftPreview = Boolean(draft)

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
          isDraftPreview
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)]'
        }`}
      >
        <div>
          <p className="text-sm font-semibold">
            {isDraftPreview ? 'Local draft preview' : 'Live dashboard'}
          </p>
          <p className="text-xs opacity-80">
            {isDraftPreview
              ? 'Autosaved in this browser only. Publish from the builder to push live.'
              : 'Showing the published version.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/dashboards/$dashboardId/manage" params={{ dashboardId }}>
              Edit
            </Link>
          </Button>
          {!isDraftPreview && (
            <Button type="button" size="sm" variant="ghost" asChild>
              <Link to="/dashboards/$dashboardId" params={{ dashboardId }}>
                Open live
              </Link>
            </Button>
          )}
        </div>
      </div>
      <DashboardViewer dashboard={dashboard} />
    </div>
  )
}
