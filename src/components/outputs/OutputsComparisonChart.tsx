import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { computeOutputContribution } from '#/lib/outputIndicatorMath'
import { CONTRIBUTION_COLORS } from '#/components/outputs/chartTheme'
import type { OutputIndicatorLink, WpaIndicator, WpaOutput } from '#/types/outputsIndicators'

type Row = { id: string; label: string; composite: number; short: string }

export function OutputsComparisonChart({
  outputs,
  links,
  indicators,
}: {
  outputs: WpaOutput[]
  links: OutputIndicatorLink[]
  indicators: WpaIndicator[]
}) {
  const data: Row[] = outputs.map((o) => {
    const { compositePercent } = computeOutputContribution(o.id, links, indicators)
    const short =
      o.title.length > 32 ? `${o.title.slice(0, 30)}…` : o.title
    return {
      id: o.id,
      label: o.title,
      short,
      composite: compositePercent,
    }
  })

  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">
        Output composite scores (weighted mean achievement)
      </h3>
      <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
        Each bar is the cumulative weighted mean of linked indicators (same formula as the cards below).
      </p>
      <div className="h-[min(320px,50vh)] w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="short" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={72} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} width={40} />
            <Tooltip
              formatter={(v) => [`${Number(v ?? 0)}%`, 'Composite']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
              contentStyle={{
                background: 'var(--surface-strong)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="composite" radius={[4, 4, 0, 0]} maxBarSize={48} name="Composite %">
              {data.map((_, i) => (
                <Cell key={data[i].id} fill={CONTRIBUTION_COLORS[i % CONTRIBUTION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
