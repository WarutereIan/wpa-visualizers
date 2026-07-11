import { createFileRoute } from '@tanstack/react-router'
import {
  IndicatorsRadarChart,
  IndicatorsValueComparisonChart,
} from '#/components/outputs/IndicatorsPortfolioCharts'
import { useIndicatorDefinitions, useIndicatorTrends } from '#/lib/api/indicatorDefinitions'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { INDICATOR_TYPE_LABELS, type Indicator } from '#/types/outputsIndicators'

export const Route = createFileRoute('/indicator-visualization')({
  component: IndicatorVisualizationPage,
})

function IndicatorVisualizationPage() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const {
    data: definitions = [],
    isLoading: defsLoading,
    isError: defsError,
  } = useIndicatorDefinitions(workspaceReady ? orgId : null)
  const { data: trends = [], isLoading: trendsLoading } = useIndicatorTrends(
    workspaceReady ? orgId : null,
  )

  if (!workspaceReady) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Sign in to view the unified indicator catalog and pre-computed trends.
      </div>
    )
  }

  // Pre-index latest trend per indicator to avoid O(n×m) scans per row.
  const latestByIndicator = new Map<string, (typeof trends)[number]>()
  for (const t of trends) {
    const existing = latestByIndicator.get(t.indicatorId)
    if (!existing || t.computedAt > existing.computedAt) {
      latestByIndicator.set(t.indicatorId, t)
    }
  }

  const chartIndicators: Indicator[] = definitions.map((d) => {
    const latest = latestByIndicator.get(d.id)
    return {
      id: d.id,
      organizationId: d.organizationId,
      projectId: d.projectId,
      name: d.name,
      type: d.type,
      location: d.location,
      unit: d.unit,
      baseline: d.baseline,
      target: d.target,
      current: latest?.value ?? d.current ?? null,
      period: latest?.period ?? d.period,
      sourceQueryId: d.sourceQueryId,
      formula: d.formula,
      disaggregations: d.disaggregations,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }
  })

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Indicator visualization</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Unified semantic catalog (<code>indicator_definitions</code>) with pre-computed values from{' '}
          <code>indicator_values</code>. MEAL indicators are migrated here automatically.
        </p>
      </header>

      {defsLoading || trendsLoading ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading indicators…</p>
      ) : defsError ? (
        <p className="text-sm text-red-600">Failed to load indicator definitions.</p>
      ) : definitions.length === 0 ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">No indicator definitions yet.</p>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <IndicatorsRadarChart indicators={chartIndicators} />
            <IndicatorsValueComparisonChart indicators={chartIndicators} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Baseline</th>
                  <th className="px-4 py-3 font-medium">Current</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                </tr>
              </thead>
              <tbody>
                {definitions.map((d) => {
                  const latest = latestByIndicator.get(d.id)
                  return (
                    <tr key={d.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-4 py-3 font-medium text-[var(--sea-ink)]">{d.name}</td>
                      <td className="px-4 py-3">{INDICATOR_TYPE_LABELS[d.type] ?? d.type}</td>
                      <td className="px-4 py-3">{d.location ?? '—'}</td>
                      <td className="px-4 py-3">{d.unit ?? '—'}</td>
                      <td className="px-4 py-3">{d.baseline ?? '—'}</td>
                      <td className="px-4 py-3">{latest?.value ?? d.current ?? '—'}</td>
                      <td className="px-4 py-3">{d.target ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{latest?.period ?? d.period ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
