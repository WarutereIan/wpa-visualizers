import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { FavoriteStar } from '#/components/dashboard/redash/FavoriteStar'
import { useFavorites } from '#/hooks/useFavorites'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import type { DashboardDefinition } from '#/types/dashboard'

export const Route = createFileRoute('/dashboards/')({
  component: DashboardsIndexPage,
})

type ListTab = 'all' | 'favorites' | 'templates'

function formatUpdatedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const delta = Date.now() - date.getTime()
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString()
}

function collectTagCounts(dashboards: DashboardDefinition[]) {
  const counts = new Map<string, number>()
  for (const dashboard of dashboards) {
    for (const tag of dashboard.tags ?? []) {
      if (!tag) continue
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

function DashboardsIndexPage() {
  const { dashboards, templates, isLoading } = useWorkspaceDashboards()
  const { isFavorite } = useFavorites()
  const [tab, setTab] = useState<ListTab>('all')
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const listed = useMemo(
    () => (tab === 'templates' ? templates : dashboards.filter((d) => d.status !== 'archived')),
    [dashboards, templates, tab],
  )

  const tagCounts = useMemo(() => collectTagCounts(listed), [listed])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listed
      .filter((d) => (tab === 'favorites' ? isFavorite('dashboard', d.id) : true))
      .filter((d) => (selectedTag ? (d.tags ?? []).includes(selectedTag) : true))
      .filter((d) => (q ? d.name.toLowerCase().includes(q) : true))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [listed, tab, selectedTag, query, isFavorite])

  return (
    <div className="rd-page rd-list-wrap -m-4 min-h-[calc(100dvh-5.5rem)] px-4 pb-4 md:-m-6 md:px-6 md:pb-6">
    <div className="rd-list-page">
      <aside className="rd-list-tags" aria-label="Filter by tag">
        <h2>Tags</h2>
        {tagCounts.length === 0 ? (
          <p className="rd-list-tags-empty">No tags yet</p>
        ) : (
          <ul>
            {tagCounts.map(([tag, count]) => {
              const active = selectedTag === tag
              return (
                <li key={tag}>
                  <button
                    type="button"
                    className={active ? 'is-active' : undefined}
                    aria-pressed={active}
                    onClick={() => setSelectedTag(active ? null : tag)}
                  >
                    <span>{tag}</span>
                    <span className="rd-list-tag-count">({count})</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      <div className="rd-list-main">
        <div className="rd-list-header">
          <h1>Dashboards</h1>
          <Link to="/dashboards/add" className="rd-btn rd-btn-primary">
            New Dashboard
          </Link>
        </div>

        <input
          className="rd-list-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Dashboards…"
          aria-label="Search dashboards"
        />

        <div className="rd-list-tabs" role="tablist" aria-label="Dashboard filters">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'all'}
            className={tab === 'all' ? 'is-active' : undefined}
            onClick={() => setTab('all')}
          >
            All Dashboards
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'favorites'}
            className={tab === 'favorites' ? 'is-active' : undefined}
            onClick={() => setTab('favorites')}
          >
            Favorites
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'templates'}
            className={tab === 'templates' ? 'is-active' : undefined}
            onClick={() => setTab('templates')}
          >
            Templates
          </button>
        </div>

        {isLoading && listed.length === 0 ? (
          <p className="rd-muted">Loading dashboards…</p>
        ) : rows.length === 0 ? (
          <div className="rd-empty">
            <p>
              {tab === 'favorites'
                ? 'No favorite dashboards yet.'
                : tab === 'templates'
                  ? 'No templates yet. Open a dashboard and use More → Save as template.'
                  : selectedTag || query
                    ? 'No dashboards match these filters.'
                    : 'There are no dashboards yet.'}
            </p>
            {!query && !selectedTag && tab === 'all' ? (
              <Link to="/dashboards/add" className="rd-btn rd-btn-primary">
                New Dashboard
              </Link>
            ) : null}
          </div>
        ) : (
          <table className="rd-list-table">
            <thead>
              <tr>
                <th className="rd-list-star-col" aria-label="Favorite" />
                <th>Name</th>
                <th className="rd-list-updated-col">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((dashboard) => {
                const unpublished = (dashboard.status ?? 'draft') === 'draft'
                const tags = dashboard.tags ?? []
                return (
                  <tr key={dashboard.id}>
                    <td className="rd-list-star-col">
                      <FavoriteStar objectType="dashboard" objectId={dashboard.id} />
                    </td>
                    <td>
                      <Link
                        className="rd-list-name"
                        to="/dashboards/$dashboardId"
                        params={{ dashboardId: dashboard.id }}
                        search={{ edit: false }}
                      >
                        {dashboard.name}
                      </Link>
                      {unpublished ? <span className="rd-unpublished">Unpublished</span> : null}
                      {tags.length > 0 ? (
                        <span className="rd-list-row-tags">
                          {tags.map((tag) => (
                            <span key={tag} className="rd-tag">
                              {tag}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </td>
                    <td className="rd-list-updated-col">{formatUpdatedAt(dashboard.updatedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </div>
  )
}
