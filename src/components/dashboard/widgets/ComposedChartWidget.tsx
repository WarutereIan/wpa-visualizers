import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DemoRow } from '#/hooks/useDemoDataset'
import { chartPaletteById, DEFAULT_CHART_PALETTE_ID } from '#/lib/chartPalettes'

export function ComposedChartWidget({
  title,
  rows,
  paletteId,
}: {
  title: string
  rows: DemoRow[]
  paletteId?: string
}) {
  const palette = chartPaletteById(paletteId ?? DEFAULT_CHART_PALETTE_ID)
  const barColor = palette.colors[0]
  const lineColor = palette.colors[1] ?? palette.colors[0]

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-3 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">{title}</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} barSize={28} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
