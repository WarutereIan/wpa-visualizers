import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MapPin } from 'lucide-react'
import { computeOutputContribution } from '#/lib/outputIndicatorMath'
import { CONTRIBUTION_COLORS } from '#/components/outputs/chartTheme'
import type {
  OutputIndicatorLink,
  OutputStatus,
  WpaIndicator,
  WpaOutput,
  WpaProject,
} from '#/types/outputsIndicators'

type Props = {
  output: WpaOutput
  project?: WpaProject
  links: OutputIndicatorLink[]
  indicators: WpaIndicator[]
  statusLabel: Record<OutputStatus, string>
  statusClass: Record<OutputStatus, string>
}

export function OutputContributionVisualizer({
  output,
  project,
  links,
  indicators,
  statusLabel,
  statusClass,
}: Props) {
  const result = computeOutputContribution(output.id, links, indicators)
  const { parts, compositePercent, cumulativeWeightedSum, totalWeight } = result

  const pieData = parts.map((p, i) => {
    const share = cumulativeWeightedSum > 0 ? (p.contribution / cumulativeWeightedSum) * 100 : 0
    return {
      name: p.label,
      value: p.contribution,
      pct: share,
      weight: p.weight,
      fill: CONTRIBUTION_COLORS[i % CONTRIBUTION_COLORS.length],
    }
  })

  const barData = parts.map((p) => ({
    name: p.label.length > 28 ? `${p.label.slice(0, 26)}…` : p.label,
    fullName: p.label,
    weighted: Math.round(p.contribution * 1000) / 1000,
    progress: p.progressPercent,
  }))

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-sm">
      <div className="border-b border-[var(--line)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--sea-ink)]">{output.title}</h3>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{output.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {output.district}
              </span>
              <span>{output.targetPeriod}</span>
              {project && (
                <span className="font-mono">
                  {project.code} · {project.program}
                </span>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${statusClass[output.status]}`}
          >
            {statusLabel[output.status]}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center">
          <div className="relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center sm:mx-0">
            {parts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={64}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieData[i].fill} stroke="var(--surface-strong)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${Number(value ?? 0).toFixed(3)}`, 'weight × progress']}
                    contentStyle={{
                      background: 'var(--surface-strong)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-[var(--line)] text-xs text-[var(--sea-ink-soft)]">
                No links
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tabular-nums text-[var(--sea-ink)]">
                {parts.length ? `${compositePercent}` : '—'}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">
                composite %
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs leading-relaxed text-[var(--sea-ink-soft)]">
              <strong className="text-[var(--sea-ink)]">Cumulative contribution</strong> is Σ(weight × indicator
              achievement). The <strong>composite score</strong> divides that sum by Σ(weight) so outputs with
              different weight totals stay comparable (weighted mean achievement).
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-[var(--bg-base)]/80 px-3 py-2">
                <dt className="text-xs text-[var(--sea-ink-soft)]">Σ(weight × progress)</dt>
                <dd className="font-mono text-base font-semibold text-[var(--lagoon-deep)]">
                  {parts.length ? cumulativeWeightedSum.toFixed(3) : '—'}
                </dd>
              </div>
              <div className="rounded-lg bg-[var(--bg-base)]/80 px-3 py-2">
                <dt className="text-xs text-[var(--sea-ink-soft)]">Σ(weight)</dt>
                <dd className="font-mono text-base font-semibold text-[var(--sea-ink)]">
                  {parts.length ? totalWeight.toFixed(2) : '—'}
                </dd>
              </div>
              <div className="rounded-lg bg-[var(--bg-base)]/80 px-3 py-2 sm:col-span-1">
                <dt className="text-xs text-[var(--sea-ink-soft)]">Weighted mean</dt>
                <dd className="font-mono text-base font-semibold text-[var(--sea-ink)]">
                  {parts.length ? `${compositePercent}%` : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {parts.length > 0 && (
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <div className="min-h-[200px]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
              Contribution mix (area ∝ weight × achievement)
            </p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(2)} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 9 }} />
                  <Tooltip
                    formatter={(value) => [`${Number(value ?? 0).toFixed(3)}`, 'weight × progress']}
                    contentStyle={{
                      background: 'var(--surface-strong)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CONTRIBUTION_COLORS[i % CONTRIBUTION_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="min-h-[200px]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
              Raw indicator progress %
            </p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(v) => [`${Number(v ?? 0)}%`, 'Progress']}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? payload?.[0]?.payload?.name
                    }
                    contentStyle={{
                      background: 'var(--surface-strong)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="progress" fill="var(--lagoon)" radius={[4, 4, 0, 0]} name="Progress" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
