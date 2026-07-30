import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useDashboardDraftStore } from '#/stores/dashboardDraftStore'
import type { DashboardDefinition } from '#/types/dashboard'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/dashboards/')({
  component: DashboardsIndexPage,
})

type ListItem = {
  id: string
  name: string
  description?: string
  updatedAt: string
  kind: 'draft-only' | 'published' | 'published-with-draft'
  draft?: DashboardDefinition
  published?: DashboardDefinition
}

function DashboardsIndexPage() {
  const { dashboards } = useWorkspaceDashboards()
  const draftMap = useDashboardDraftStore((s) => s.drafts)
  const listDrafts = useDashboardDraftStore((s) => s.listDrafts)

  const items = useMemo(() => {
    const byId = new Map<string, ListItem>()
    for (const d of dashboards) {
      const local = draftMap[d.id]
      const hasUnpublished =
        Boolean(local) &&
        new Date(local!.updatedAt).getTime() > new Date(d.updatedAt).getTime()
      byId.set(d.id, {
        id: d.id,
        name: local?.name ?? d.name,
        description: local?.description ?? d.description,
        updatedAt: hasUnpublished ? local!.updatedAt : d.updatedAt,
        kind: hasUnpublished ? 'published-with-draft' : 'published',
        published: d,
        draft: local,
      })
    }
    for (const d of listDrafts()) {
      if (byId.has(d.id)) continue
      byId.set(d.id, {
        id: d.id,
        name: d.name,
        description: d.description,
        updatedAt: d.updatedAt,
        kind: 'draft-only',
        draft: d,
      })
    }
    return [...byId.values()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [dashboards, draftMap, listDrafts])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <DimesBiLogo size="sm" linkToHome={false} className="mt-1 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Dashboards</h1>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
              Drafts autosave in this browser. Publish to push live.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/dashboards/add">Create dashboard</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-strong)] p-10 text-center">
          <p className="text-[var(--sea-ink-soft)]">No dashboards yet.</p>
          <Button asChild className="mt-4">
            <Link to="/dashboards/add">Create your first dashboard</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm transition hover:border-[var(--lagoon)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--sea-ink)]">{item.name}</span>
                  <StatusBadge kind={item.kind} />
                </div>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">
                    {item.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
                  Updated {new Date(item.updatedAt).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboards/$dashboardId/manage" params={{ dashboardId: item.id }}>
                      {item.kind === 'draft-only' ? 'Continue' : 'Edit'}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboards/$dashboardId/preview" params={{ dashboardId: item.id }}>
                      Preview
                    </Link>
                  </Button>
                  {item.kind !== 'draft-only' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboards/$dashboardId" params={{ dashboardId: item.id }}>
                        Open live
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusBadge({ kind }: { kind: ListItem['kind'] }) {
  if (kind === 'draft-only') {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900">
        Local draft
      </span>
    )
  }
  if (kind === 'published-with-draft') {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-900">
        Unpublished edits
      </span>
    )
  }
  return (
    <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--sea-ink-soft)]">
      Live
    </span>
  )
}
