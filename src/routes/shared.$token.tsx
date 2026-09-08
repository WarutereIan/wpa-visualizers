import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout/legacy'
import type { Layout } from 'react-grid-layout'
import { PublicDashboardView } from '#/components/dashboard/redash/PublicDashboardView'
import { Button } from '#/components/ui/button'
import {
  fetchSharedLinkAccess,
  isRedashPublicDashboard,
  type SharedLinkPayload,
} from '#/lib/api/sharedLinks'
import type { WidgetConfig } from '#/types/dashboard'

const GridWithWidth = WidthProvider(GridLayout)

export const Route = createFileRoute('/shared/$token')({
  component: SharedPage,
})

function SharedPage() {
  const { token } = Route.useParams()
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [payload, setPayload] = useState<SharedLinkPayload | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = (pwd?: string) => {
    setLoading(true)
    setError(null)
    void fetchSharedLinkAccess(token, pwd)
      .then((data) => {
        setPayload(data)
        setFetchedAt(new Date())
        setNeedsPassword(false)
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Access denied'
        if (msg.toLowerCase().includes('password')) {
          setNeedsPassword(true)
          setError(msg.toLowerCase().includes('invalid') ? msg : null)
        } else {
          setError(msg)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (needsPassword && !payload) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6">
        <h1 className="text-lg font-semibold text-[var(--sea-ink)]">Password required</h1>
        <input
          type="password"
          className="flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter link password"
        />
        <Button type="button" onClick={() => load(password)} disabled={loading}>
          {loading ? 'Loading…' : 'Continue'}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (error && !payload) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-center text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (!payload) {
    return <p className="text-sm text-[var(--sea-ink-soft)]">Loading shared content…</p>
  }

  if (payload.type === 'snapshot') {
    const layout = (payload.snapshot.layout ?? []) as Layout[]
    const frozen = (payload.snapshot.data ?? {}) as {
      widgets?: Record<string, { rows?: unknown[]; error?: string }>
      indicators?: Record<string, { value: number; period: string }>
    }
    return (
      <div className="space-y-4">
        <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <h1 className="text-xl font-bold text-[var(--sea-ink)]">Dashboard snapshot</h1>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            {payload.snapshot.period ?? '—'} · frozen {new Date(payload.snapshot.created_at).toLocaleString()}
          </p>
        </header>
        <GridWithWidth cols={12} rowHeight={36} margin={[8, 8]} layout={layout} isDraggable={false} isResizable={false}>
          {layout.map((item) => {
            const widgetData = frozen.widgets?.[item.i]
            const rows = widgetData?.rows
            return (
              <div key={item.i} className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3">
                <p className="mb-2 text-xs font-medium uppercase text-[var(--sea-ink-soft)]">Widget {item.i}</p>
                {widgetData?.error ? (
                  <p className="text-sm text-red-600">{widgetData.error}</p>
                ) : Array.isArray(rows) && rows.length > 0 ? (
                  <p className="text-sm text-[var(--sea-ink)]">{rows.length} frozen rows</p>
                ) : (
                  <p className="text-sm text-[var(--sea-ink-soft)]">No frozen query data</p>
                )}
              </div>
            )
          })}
        </GridWithWidth>
      </div>
    )
  }

  if (isRedashPublicDashboard(payload)) {
    return <PublicDashboardView payload={payload} fetchedAt={fetchedAt ?? new Date()} />
  }

  const dashboard = payload.dashboard
  const widgets = (dashboard.widgets ?? {}) as Record<string, WidgetConfig>
  const layout = (dashboard.layout ?? []) as Layout[]

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <h1 className="text-xl font-bold text-[var(--sea-ink)]">{dashboard.name}</h1>
        {dashboard.description && (
          <p className="text-sm text-[var(--sea-ink-soft)]">{dashboard.description}</p>
        )}
      </header>
      <GridWithWidth cols={12} rowHeight={36} margin={[8, 8]} layout={layout} isDraggable={false} isResizable={false}>
        {layout.map((item) => {
          const w = widgets[item.i]
          return (
            <div key={item.i} className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3">
              <p className="font-medium text-[var(--sea-ink)]">{w?.title ?? item.i}</p>
              <p className="text-xs text-[var(--sea-ink-soft)]">{w?.type ?? 'widget'}</p>
            </div>
          )
        })}
      </GridWithWidth>
    </div>
  )
}
