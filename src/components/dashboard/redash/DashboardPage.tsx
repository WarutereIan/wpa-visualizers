import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AddTextboxModal } from '#/components/dashboard/redash/AddTextboxModal'
import { AddWidgetModal } from '#/components/dashboard/redash/AddWidgetModal'
import { QueryEditorModal } from '#/components/dashboard/redash/QueryEditorModal'
import { DashboardGrid } from '#/components/dashboard/redash/DashboardGrid'
import { DashboardHeader } from '#/components/dashboard/redash/DashboardHeader'
import { ParameterBar } from '#/components/dashboard/redash/ParameterBar'
import { Button } from '#/components/ui/button'
import { useDashboardWidgets } from '#/hooks/useDashboardWidgets'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceVisualizations } from '#/hooks/useWorkspaceVisualizations'
import { useWorkspaceReady } from '#/lib/api/workspace'
import { collectDashboardParameters, defaultParameterValues } from '#/lib/dashboardParameters'
import { cloneQueryInput, visualizationWidgetDraft } from '#/lib/addWidget'
import { canEditDashboards } from '#/lib/permissions'
import type { ParameterValues } from '#/lib/queryParameters'
import { useAuthStore } from '#/stores/authStore'
import type { DashboardWidget } from '#/types/visualization'

const ARCHIVE_CONFIRM =
  'Archive Dashboard? This dashboard will be removed from the dashboards list.'

export function DashboardPage({ dashboardId }: { dashboardId: string }) {
  const navigate = useNavigate()
  const { edit } = useSearch({ from: '/dashboards/$dashboardId' })
  const workspaceReady = useWorkspaceReady()
  const role = useAuthStore((s) => s.role)
  const canEdit = canEditDashboards(role, workspaceReady)
  const { getById, updateDashboard, duplicateDashboard, saveAsTemplate, isLoading } =
    useWorkspaceDashboards()
  const { widgets, createWidget } = useDashboardWidgets(dashboardId)
  const { queries, createQuery } = useWorkspaceData()
  const { visualizations, createVisualization } = useWorkspaceVisualizations()
  const dashboard = getById(dashboardId)

  const dashboardParams = useMemo(
    () => collectDashboardParameters(widgets, visualizations, queries),
    [widgets, visualizations, queries],
  )
  const [dashboardParamValues, setDashboardParamValues] = useState<ParameterValues>({})

  useEffect(() => {
    setDashboardParamValues((prev) => {
      const seeded = defaultParameterValues(dashboardParams)
      const next: ParameterValues = {}
      let changed = Object.keys(prev).some((key) => !(key in seeded))
      for (const param of dashboardParams) {
        if (param.name in prev) {
          next[param.name] = prev[param.name]
        } else {
          next[param.name] = seeded[param.name]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [dashboardParams])

  const [refreshNonce, setRefreshNonce] = useState(0)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number | null>(null)
  const [widgetModalOpen, setWidgetModalOpen] = useState(false)
  const [textboxModalOpen, setTextboxModalOpen] = useState(false)
  const [textboxEdit, setTextboxEdit] = useState<DashboardWidget | null>(null)
  const [queryEditorOpen, setQueryEditorOpen] = useState(false)
  const [queryEditorInitialId, setQueryEditorInitialId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState(false)

  const editing = Boolean(edit && canEdit)

  const handleEditWidgetData = async (widget: DashboardWidget) => {
    if (!widget.visualizationId || editingData) return
    const viz = visualizations.find((item) => item.id === widget.visualizationId)
    const query = viz ? queries.find((item) => item.id === viz.queryId) : null
    if (!viz || !query) {
      window.alert('Could not find the query for this widget.')
      return
    }
    setEditingData(true)
    try {
      const clonedQuery = await createQuery(cloneQueryInput(query))
      const clonedViz = await createVisualization({
        queryId: clonedQuery.id,
        type: viz.type,
        name: viz.name,
        description: viz.description,
        options: { ...(viz.options ?? {}) },
      })
      await createWidget(
        visualizationWidgetDraft(
          dashboardId,
          widgets,
          clonedViz.id,
          widget.options.parameterMappings ?? {},
        ),
      )
      setQueryEditorInitialId(clonedQuery.id)
      setQueryEditorOpen(true)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to fork widget data')
    } finally {
      setEditingData(false)
    }
  }

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
        onSaveAsTemplate={() => {
          void saveAsTemplate(dashboardId).then((copy) => {
            if (!copy) return
            window.alert(`Saved template “${copy.name}”. Use New Dashboard → Start from to reuse it.`)
          })
        }}
        onFullscreen={toggleFullscreen}
        onRename={(name) => void updateDashboard(dashboardId, { name })}
      />

      <ParameterBar
        parameters={dashboardParams}
        values={dashboardParamValues}
        onApply={setDashboardParamValues}
      />

      <DashboardGrid
        dashboardId={dashboardId}
        editing={editing}
        dashboardParamValues={dashboardParamValues}
        refreshNonce={refreshNonce}
        onEditWidget={(widget) => {
          if (widget.visualizationId) return
          setTextboxEdit(widget)
          setTextboxModalOpen(true)
        }}
        onEditWidgetData={(widget) => {
          void handleEditWidgetData(widget)
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
              <button
                type="button"
                className="rd-btn"
                onClick={() => {
                  setQueryEditorInitialId(null)
                  setQueryEditorOpen(true)
                }}
              >
                Create / Edit Query
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
      <QueryEditorModal
        open={queryEditorOpen}
        initialQueryId={queryEditorInitialId}
        dashboardId={dashboardId}
        existingWidgets={widgets}
        onClose={() => {
          setQueryEditorOpen(false)
          setQueryEditorInitialId(null)
        }}
      />
    </div>
  )
}
