import type { DemoRow } from '#/hooks/useDemoDataset'

export function KpiWidget({
  title,
  rows,
  readOnly: _readOnly,
}: {
  title: string
  rows: DemoRow[]
  readOnly?: boolean
}) {
  const sum = rows.reduce((a, r) => a + r.value, 0)
  const avg = rows.length ? Math.round(sum / rows.length) : 0

  return (
    <div className="flex h-full flex-col justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">
        {title}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--lagoon-deep)]">{avg}</p>
      <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">Average from current query</p>
    </div>
  )
}
