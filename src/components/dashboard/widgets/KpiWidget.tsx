import type { DemoRow } from '#/hooks/useDemoDataset'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useIndicatorValue } from '#/lib/api/indicatorValues'

export function KpiWidget({
  title,
  rows,
  indicatorId,
  readOnly: _readOnly,
}: {
  title: string
  rows: DemoRow[]
  indicatorId?: string
  readOnly?: boolean
}) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { data: indicatorValue, isLoading } = useIndicatorValue(
    workspaceReady ? orgId : null,
    indicatorId,
  )

  if (indicatorId && workspaceReady) {
    if (isLoading) {
      return (
        <div className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Loading indicator…</p>
        </div>
      )
    }
    if (indicatorValue?.value != null) {
      return (
        <div className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--lagoon-deep)]">
            {indicatorValue.value}
          </p>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            {indicatorValue.period} · pre-computed
          </p>
        </div>
      )
    }
    // Indicator bound but no pre-computed value yet — don't fall back to demo
    // rows (which would show a misleading "Average from current query").
    return (
      <div className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--sea-ink-soft)]">—</p>
        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">No value yet · run “Compute current”</p>
      </div>
    )
  }

  const sum = rows.reduce((a, r) => a + r.value, 0)
  const avg = rows.length ? Math.round(sum / rows.length) : 0

  return (
    <div className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--lagoon-deep)]">{avg}</p>
      <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">Average from current query</p>
    </div>
  )
}
