import { createFileRoute, Link } from '@tanstack/react-router'
import { LayoutGrid, Map, LineChart, Database } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-6 py-10 shadow-sm sm:px-10">
        <p className="island-kicker mb-2">WPA program workspace</p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Baseline mapping, dashboards, and data in one place
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--sea-ink-soft)]">
          Use the sidebar to open the baseline map iframe, build drag-and-drop dashboards with
          ECharts / Recharts / TanStack Table widgets, and manage indicators and datasets.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/baseline-mapping"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:bg-[rgba(79,184,178,0.24)]"
          >
            <Map className="size-4" />
            Baseline mapping
          </Link>
          <Link
            to="/dashboards/add"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/60 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:border-[var(--lagoon)]"
          >
            <LayoutGrid className="size-4" />
            Add dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Baseline mapping',
            desc: 'Embedded map from your program baseline URL.',
            to: '/baseline-mapping' as const,
            icon: Map,
          },
          {
            title: 'Dashboards',
            desc: 'Drag-and-drop builder with 20+ chart types.',
            to: '/dashboards' as const,
            icon: LayoutGrid,
          },
          {
            title: 'Indicator visualization',
            desc: 'Indicator views and narrative charts.',
            to: '/indicator-visualization' as const,
            icon: LineChart,
          },
          {
            title: 'Data management',
            desc: 'Datasets, connections, and query builder.',
            to: '/data-management' as const,
            icon: Database,
          },
        ].map(({ title, desc, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="island-shell rise-in rounded-2xl p-5 no-underline transition hover:border-[var(--lagoon)]"
          >
            <Icon className="mb-2 size-5 text-[var(--lagoon-deep)]" />
            <h2 className="text-base font-semibold text-[var(--sea-ink)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
