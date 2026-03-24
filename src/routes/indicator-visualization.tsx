import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/indicator-visualization')({
  component: IndicatorVisualizationPage,
})

function IndicatorVisualizationPage() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Indicator visualization</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--sea-ink-soft)]">
        Dedicated indicator views and story layouts will live here (charts, maps, scorecards).
        Wire this section to your indicator catalog and reporting APIs.
      </p>
    </div>
  )
}
