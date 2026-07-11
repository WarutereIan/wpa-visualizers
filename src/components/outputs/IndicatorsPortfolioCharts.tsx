import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { indicatorProgressPercent } from '#/lib/outputIndicatorMath'
import type { Indicator } from '#/types/outputsIndicators'

function progressColor(pct: number): string {
  if (pct >= 85) return 'var(--lagoon)'
  if (pct >= 70) return 'var(--palm)'
  return '#f59e0b'
}

function shortLabel(ind: Indicator): string {
  const loc = ind.location ? ` (${ind.location})` : ''
  const s = `${ind.name}${loc}`
  return s.length > 22 ? `${s.slice(0, 20)}…` : s
}

function fullLabel(ind: Indicator): string {
  return ind.location ? `${ind.name} · ${ind.location}` : ind.name
}

export function IndicatorsRadarChart({ indicators }: { indicators: Indicator[] }) {
  const data = indicators.map((ind) => {
    const label = ind.location ? `${ind.name} (${ind.location})` : ind.name
    return {
      subject: label.length > 24 ? `${ind.name.slice(0, 14)}…` : label,
      full: fullLabel(ind),
      progress: indicatorProgressPercent(ind),
      target: 100,
    }
  })

  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">Achievement profile</h3>
      <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
        Radar shows % of target achieved per indicator (capped at 100%). Compare shape across locations.
      </p>
      <div className="mx-auto h-[min(340px,45vh)] w-full max-w-lg min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="52%" outerRadius="78%">
            <PolarGrid stroke="var(--line)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--sea-ink-soft)' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
            <Radar
              name="Progress"
              dataKey="progress"
              stroke="var(--lagoon-deep)"
              fill="var(--lagoon)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(v) => [`${Number(v ?? 0)}%`, 'vs target']}
              labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ''}
              contentStyle={{
                background: 'var(--surface-strong)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Grouped bars: baseline, current, target (same axis — comparable only when units align). */
export function IndicatorsValueComparisonChart({ indicators }: { indicators: Indicator[] }) {
  const data = indicators.map((ind) => ({
    name: shortLabel(ind),
    full: fullLabel(ind),
    baseline: ind.baseline ?? 0,
    current: ind.current ?? 0,
    target: ind.target ?? 0,
  }))

  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">Values: baseline · current · target</h3>
      <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
        Grouped bars per indicator. Units vary (e.g. % vs score) — compare within each group, not across rows.
      </p>
      <div className="h-[min(320px,42vh)] w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-22} textAnchor="end" height={72} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v, name) => [
                Number(v ?? 0),
                name === 'baseline' ? 'Baseline' : name === 'current' ? 'Current' : 'Target',
              ]}
              labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ''}
              contentStyle={{
                background: 'var(--surface-strong)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="baseline" fill="#94a3b8" radius={[2, 2, 0, 0]} name="baseline" maxBarSize={16} />
            <Bar dataKey="current" fill="var(--lagoon)" radius={[2, 2, 0, 0]} name="current" maxBarSize={16} />
            <Bar dataKey="target" fill="var(--palm)" radius={[2, 2, 0, 0]} name="target" maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-[var(--sea-ink-soft)]">
        For normalized comparison across indicators, use the achievement profile radar.
      </p>
    </div>
  )
}

export function IndicatorGauge({ ind }: { ind: Indicator }) {
  const pct = indicatorProgressPercent(ind)
  const c = progressColor(pct)
  return (
    <div
      className="relative mx-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-base)] shadow-inner"
      style={{
        background: `conic-gradient(${c} ${pct * 3.6}deg, color-mix(in oklab, var(--line) 60%, transparent) 0deg)`,
      }}
    >
      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-[var(--surface-strong)] text-center shadow-sm">
        <span className="text-sm font-bold tabular-nums" style={{ color: c }}>
          {pct}%
        </span>
        <span className="text-[9px] leading-none text-[var(--sea-ink-soft)]">target</span>
      </div>
    </div>
  )
}
