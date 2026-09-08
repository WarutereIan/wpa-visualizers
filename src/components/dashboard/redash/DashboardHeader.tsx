import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, MoreHorizontal, RefreshCw } from 'lucide-react'
import { FavoriteStar } from '#/components/dashboard/redash/FavoriteStar'
import { TagsEditor } from '#/components/dashboard/redash/TagsEditor'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import {
  AUTO_REFRESH_INTERVALS,
  canArchive,
  canPublish,
  canUnpublish,
  nextAutoRefreshLabel,
  type DashboardStatus,
} from '#/lib/dashboardLifecycle'
import type { DashboardDefinition } from '#/types/dashboard'

export type DashboardHeaderProps = {
  dashboard: DashboardDefinition
  editing: boolean
  canEdit: boolean
  autoRefreshSeconds: number | null
  onToggleEdit: () => void
  onRefresh: () => void
  onAutoRefreshChange: (seconds: number | null) => void
  onPublish: () => void
  onUnpublish: () => void
  onArchive: () => void
  onDuplicate: () => void
  onFullscreen: () => void
  onRename: (name: string) => void
}

function HeaderTags({
  dashboard,
  canEdit,
}: {
  dashboard: DashboardDefinition
  canEdit: boolean
}) {
  const { dashboards, updateDashboard } = useWorkspaceDashboards()
  const allTags = useMemo(() => {
    const seen = new Set<string>()
    for (const item of dashboards) {
      for (const tag of item.tags ?? []) {
        if (tag) seen.add(tag)
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b))
  }, [dashboards])

  return (
    <TagsEditor
      tags={dashboard.tags ?? []}
      allTags={allTags}
      readOnly={!canEdit}
      onChange={(tags) => {
        if (!canEdit) return
        void updateDashboard(dashboard.id, { tags })
      }}
    />
  )
}

function statusOf(dashboard: DashboardDefinition): DashboardStatus {
  return dashboard.status ?? 'draft'
}

export function DashboardHeader({
  dashboard,
  editing,
  canEdit,
  autoRefreshSeconds,
  onToggleEdit,
  onRefresh,
  onAutoRefreshChange,
  onPublish,
  onUnpublish,
  onArchive,
  onDuplicate,
  onFullscreen,
  onRename,
}: DashboardHeaderProps) {
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(dashboard.name)
  const [menu, setMenu] = useState<'more' | 'refresh' | null>(null)
  const status = statusOf(dashboard)
  const unpublished = status === 'draft'

  useEffect(() => {
    setDraftName(dashboard.name)
  }, [dashboard.name])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  const commitRename = () => {
    const next = draftName.trim()
    setRenaming(false)
    if (next && next !== dashboard.name) onRename(next)
    else setDraftName(dashboard.name)
  }

  return (
    <header className="rd-header">
      <div className="rd-header-title">
        <FavoriteStar objectType="dashboard" objectId={dashboard.id} />
        {renaming && canEdit ? (
          <input
            className="rd-title-input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
              if (event.key === 'Escape') {
                setDraftName(dashboard.name)
                setRenaming(false)
              }
            }}
            aria-label="Dashboard name"
            autoFocus
          />
        ) : (
          <h1
            className={canEdit ? 'rd-title-click' : undefined}
            onClick={() => {
              if (!canEdit) return
              setDraftName(dashboard.name)
              setRenaming(true)
            }}
          >
            {dashboard.name}
          </h1>
        )}
        <HeaderTags dashboard={dashboard} canEdit={canEdit} />
        {unpublished ? <span className="rd-unpublished">Unpublished</span> : null}
      </div>

      <div className="rd-header-actions">
        {canEdit && canPublish(status) ? (
          <button type="button" className="rd-btn rd-btn-primary" onClick={onPublish}>
            Publish
          </button>
        ) : null}

        <div className="rd-refresh-group">
          <button type="button" className="rd-btn" onClick={onRefresh}>
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
          <button
            type="button"
            className="rd-btn rd-btn-icon"
            aria-label="Auto-refresh interval"
            title={nextAutoRefreshLabel(autoRefreshSeconds)}
            onClick={(event) => {
              event.stopPropagation()
              setMenu((current) => (current === 'refresh' ? null : 'refresh'))
            }}
          >
            <ChevronDown className="size-3.5" />
          </button>
          {menu === 'refresh' ? (
            <div className="rd-menu" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  onAutoRefreshChange(null)
                  setMenu(null)
                }}
              >
                Off
              </button>
              {AUTO_REFRESH_INTERVALS.map((seconds) => (
                <button
                  type="button"
                  key={seconds}
                  onClick={() => {
                    onAutoRefreshChange(seconds)
                    setMenu(null)
                  }}
                >
                  {nextAutoRefreshLabel(seconds)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button type="button" className="rd-btn" disabled title="Sharing is not available yet">
          Share
        </button>

        <button
          type="button"
          className="rd-btn rd-btn-icon"
          aria-label="More actions"
          onClick={(event) => {
            event.stopPropagation()
            setMenu((current) => (current === 'more' ? null : 'more'))
          }}
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menu === 'more' ? (
          <div className="rd-menu" onClick={(event) => event.stopPropagation()}>
            {canEdit && !editing ? (
              <button
                type="button"
                onClick={() => {
                  setMenu(null)
                  onToggleEdit()
                }}
              >
                Edit
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setMenu(null)
                  onDuplicate()
                }}
              >
                Duplicate
              </button>
            ) : null}
            {canEdit && canArchive(status) ? (
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setMenu(null)
                  onArchive()
                }}
              >
                Archive
              </button>
            ) : null}
            {canEdit && canUnpublish(status) ? (
              <button
                type="button"
                onClick={() => {
                  setMenu(null)
                  onUnpublish()
                }}
              >
                Unpublish
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMenu(null)
                onFullscreen()
              }}
            >
              Fullscreen
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
