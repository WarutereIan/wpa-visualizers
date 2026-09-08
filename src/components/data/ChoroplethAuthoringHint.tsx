export function ChoroplethAuthoringHint() {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--sand)] px-3 py-2 text-xs text-[var(--sea-ink-soft)]">
      <p className="font-medium text-[var(--sea-ink)]">Choropleth quick setup</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5">
        <li>
          Query: use <strong className="text-[var(--sea-ink)]">GROUP BY</strong> on a region column
          plus a numeric aggregation (count, sum, etc.).
        </li>
        <li>
          Join: <strong className="text-[var(--sea-ink)]">Key Column</strong> (query) must match{' '}
          <strong className="text-[var(--sea-ink)]">Target Field</strong> (GeoJSON property — usually{' '}
          <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px]">code</code>{' '}
          or{' '}
          <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px]">name</code>
          ).
        </li>
        <li>
          County-level Kenya data: choose the <strong className="text-[var(--sea-ink)]">Kenya Counties</strong>{' '}
          map and match your county codes or names.
        </li>
        <li>
          Sub-county Kenya data: use <strong className="text-[var(--sea-ink)]">Kenya Sub-counties</strong> and join
          on <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px]">name</code> —{' '}
          <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px]">code</code> is an opaque
          shape ID.
        </li>
      </ul>
      <p className="mt-2 text-[10px] text-[var(--sea-ink-soft)]">
        Kenya boundaries from geoBoundaries (CC BY 4.0).
      </p>
    </div>
  )
}
