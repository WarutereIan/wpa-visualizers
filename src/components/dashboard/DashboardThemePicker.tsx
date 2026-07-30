import {
  CHART_PALETTES,
  DEFAULT_CHART_PALETTE_ID,
  type ChartPaletteId,
  type DashboardTheme,
} from '#/lib/chartPalettes'

export function DashboardThemePicker({
  theme,
  onChange,
  compact,
}: {
  theme: DashboardTheme
  onChange: (next: DashboardTheme) => void
  /** Inline toolbar layout (horizontal chips). */
  compact?: boolean
}) {
  const activeId = theme.paletteId ?? DEFAULT_CHART_PALETTE_ID

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-[var(--sea-ink-soft)]">Theme</span>
        {CHART_PALETTES.map((palette) => {
          const active = palette.id === activeId
          return (
            <button
              key={palette.id}
              type="button"
              title={palette.label}
              aria-label={`Theme ${palette.label}`}
              aria-pressed={active}
              onClick={() => onChange({ paletteId: palette.id as ChartPaletteId })}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-1 ${
                active
                  ? 'border-[var(--dash-accent,var(--lagoon))] bg-[var(--surface-strong)] ring-1 ring-[var(--dash-accent,var(--lagoon))]/40'
                  : 'border-[var(--line)] bg-[var(--surface)]'
              }`}
            >
              <span className="flex gap-0.5">
                {palette.colors.slice(0, 4).map((c) => (
                  <span
                    key={c}
                    className="h-2.5 w-2.5 rounded-sm border border-black/5"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="hidden text-[10px] font-medium text-[var(--sea-ink)] sm:inline">
                {palette.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <label className="text-sm font-medium text-[var(--sea-ink)]">Dashboard theme</label>
      <p className="mt-0.5 text-[11px] text-[var(--sea-ink-soft)]">
        Applies to the canvas and every chart on this dashboard.
      </p>
      <div className="mt-2 space-y-1.5">
        {CHART_PALETTES.map((palette) => {
          const active = palette.id === activeId
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => onChange({ paletteId: palette.id as ChartPaletteId })}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs ${
                active
                  ? 'border-[var(--dash-accent,var(--lagoon))] bg-[var(--surface-strong)] ring-1 ring-[var(--dash-accent,var(--lagoon))]/40'
                  : 'border-[var(--line)] bg-[var(--surface)]'
              }`}
            >
              <span className="flex gap-0.5">
                {palette.colors.slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className="h-3.5 w-3.5 rounded-sm border border-black/5"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="font-medium text-[var(--sea-ink)]">{palette.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
