import type { DataRow } from '#/types/data'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useIndicatorValue } from '#/lib/api/indicatorValues'
import { resolveKpiMeasure } from '#/lib/kpiMeasure'

export function KpiWidget({
  title,
  rows,
  measureKey,
  indicatorId,
  readOnly: _readOnly,
  queryName,
  grainHint,
}: {
  title: string
  /** Raw query result rows (not chart-derived DemoRows). */
  rows: DataRow[]
  /** Result column to display (bindings.yKey / measureKey). */
  measureKey?: string
  indicatorId?: string
  readOnly?: boolean
  /** Optional “how calculated” tooltip pieces. */
  queryName?: string
  grainHint?: string
}) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { data: indicatorValue, isLoading } = useIndicatorValue(
    workspaceReady ? orgId : null,
    indicatorId,
  )

  const howCalculated = indicatorId
    ? `MEAL indicator · pre-computed value${indicatorValue?.period ? ` · ${indicatorValue.period}` : ''}`
    : [
        queryName ? `Query: ${queryName}` : null,
        measureKey ? `Field: ${measureKey}` : null,
        grainHint ? `Grain: ${grainHint}` : null,
        'Shown as produced by the query (no extra average)',
      ]
        .filter(Boolean)
        .join(' · ')

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
        <div
          className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm"
          title={howCalculated}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--dash-accent,var(--lagoon-deep))]">
            {indicatorValue.value}
          </p>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            {indicatorValue.period} · pre-computed
          </p>
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--sea-ink-soft)]">—</p>
        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">No value yet · run “Compute current”</p>
      </div>
    )
  }

  const measure = resolveKpiMeasure(rows, measureKey)

  return (
    <div
      className="group relative flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm"
      title={howCalculated}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">{title}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--dash-accent,var(--lagoon-deep))]">
        {measure.empty || measure.value == null ? '—' : measure.value}
      </p>
      <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{measure.caption}</p>
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-10 hidden rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-[10px] leading-snug text-[var(--sea-ink-soft)] shadow-sm group-hover:block">
        <span className="font-medium text-[var(--sea-ink)]">How this number is calculated</span>
        <br />
        {howCalculated}
      </div>
    </div>
  )
}
