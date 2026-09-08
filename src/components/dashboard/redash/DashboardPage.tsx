import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AddTextboxModal } from '#/components/dashboard/redash/AddTextboxModal'
import { AddWidgetModal } from '#/components/dashboard/redash/AddWidgetModal'
import { DashboardGrid } from '#/components/dashboard/redash/DashboardGrid'
import { DashboardHeader } from '#/components/dashboard/redash/DashboardHeader'
import { Button } from '#/components/ui/button'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useWorkspaceReady } from '#/lib/api/workspace'
import { canEditDashboards } from '#/lib/permissions'
import { useAuthStore } from '#/stores/authStore'
import type { DashboardWidget } from '#/types/visualization'

const ARCHIVE_CONFIRM =
  'Archive Dashboard? This dashboard will be removed from the dashboards list...'

function DashboardParameterBar() {
  // Task 13: dashboard-level parameter controls
  return null
}

export function DashboardPage({ dashboardId }: { dashboardId: string }) {
  const navigate = useNavigate()
  const { edit } = useSearch({ from: '/dashboards/$dashboardId' })
  const workspaceReady = useWorkspaceReady()
  const role = useAuthStore((s) => s.role)
  const canEdit = canEditDashboards(role, workspaceReady)
  const { getById, updateDashboard, duplicateDashboard, isLoading } = useWorkspaceDashboards()
  const { widgets } = useDashboardWidgets(dashboardId)
  const dashboard = getById(dashboardId)

  const [refreshNonce, setRefreshNonce] = useState(0)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number | null>(null)
  const [widgetModalOpen, setWidgetModalOpen] = useState(false)
  const [textboxModalOpen, setTextboxModalOpen] = useState(false)
  const [textboxEdit, setTextboxEdit] = useState<DashboardWidget | null>(null)

  const editing = Boolean(edit && canEdit)

  useEffect(() => {
    if (autoRefreshSeconds == null) return
    const id = window.setInterval(() => {
      setRefreshNonce((n) => n + 1)
    }, autoRefreshSeconds * 1000)
    return () => window.clearInterval(id)
  }, [autoRefreshSeconds])

  const setEditing = (next: boolean) => {
    void navigate({
      to: '/dashboards/$dashboardId',
      params: { dashboardId },
      search: { edit: next },
    })
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void document.documentElement.requestFullscreen()
  }

  if (isLoading && !dashboard) {
    return <div className="rd-muted">Loading dashboard…</div>
  }

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
    <div
      className={`rd-page -m-4 flex min-h-[calc(100dvh-5.5rem)] flex-col px-4 md:-m-6 md:px-6 ${
        editing ? 'pb-24 md:pb-24' : 'pb-4 md:pb-6'
      }`}
    >
      <DashboardHeader
        dashboard={dashboard}
        editing={editing}
        canEdit={canEdit}
        autoRefreshSeconds={autoRefreshSeconds}
        onToggleEdit={() => setEditing(!editing)}
        onRefresh={() => setRefreshNonce((n) => n + 1)}
        onAutoRefreshChange={setAutoRefreshSeconds}
        onPublish={() => void updateDashboard(dashboardId, { status: 'published' })}
        onUnpublish={() => void updateDashboard(dashboardId, { status: 'draft' })}
        onArchive={() => {
          if (!window.confirm(ARCHIVE_CONFIRM)) return
          void updateDashboard(dashboardId, { status: 'archived' }).then(() => {
            void navigate({ to: '/dashboards' })
          })
        }}
        onDuplicate={() => {
          void duplicateDashboard(dashboardId).then((copy) => {
            if (!copy) return
            void navigate({
              to: '/dashboards/$dashboardId',
              params: { dashboardId: copy.id },
              search: { edit: true },
            })
          })
        }}
        onFullscreen={toggleFullscreen}
        onRename={(name) => void updateDashboard(dashboardId, { name })}
      />

      <DashboardParameterBar />

      <DashboardGrid
        dashboardId={dashboardId}
        editing={editing}
        dashboardParamValues={{}}
        refreshNonce={refreshNonce}
        onEditWidget={(widget) => {
          if (widget.visualizationId) {
            // Task 13: widget-level parameter editor
            return
          }
          setTextboxEdit(widget)
          setTextboxModalOpen(true)
        }}
      />

      {editing ? (
        <div className="rd-add-bar">
          <div className="rd-add-bar-inner">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rd-btn"
                onClick={() => setWidgetModalOpen(true)}
              >
                Add Widget
              </button>
              <button
                type="button"
                className="rd-btn"
                onClick={() => {
                  setTextboxEdit(null)
                  setTextboxModalOpen(true)
                }}
              >
                Add Textbox
              </button>
            </div>
            <button type="button" className="rd-btn rd-btn-primary" onClick={() => setEditing(false)}>
              Done Editing
            </button>
          </div>
        </div>
      ) : null}

      <AddWidgetModal
        open={widgetModalOpen}
        dashboardId={dashboardId}
        existingWidgets={widgets}
        onClose={() => setWidgetModalOpen(false)}
      />
      <AddTextboxModal
        open={textboxModalOpen}
        dashboardId={dashboardId}
        existingWidgets={widgets}
        editWidget={textboxEdit}
        onClose={() => {
          setTextboxModalOpen(false)
          setTextboxEdit(null)
        }}
      />
    </div>
  )
}
