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

export function ComposedChartWidget({ title, rows }: { title: string; rows: DemoRow[] }) {
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
            <Bar dataKey="value" fill="var(--lagoon)" radius={[4, 4, 0, 0]} barSize={28} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--palm)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
