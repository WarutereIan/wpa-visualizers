import type { CSSProperties } from 'react'

/** Named themes for a whole dashboard (canvas + all widgets). */

export type ChartPaletteId = 'lagoon' | 'ocean' | 'sunset' | 'forest' | 'mono'

export type ChartPalette = {
  id: ChartPaletteId
  label: string
  /** Ordered series colors (first = primary accent). */
  colors: string[]
}

export type DashboardTheme = {
  paletteId: ChartPaletteId
}

export const CHART_PALETTES: ChartPalette[] = [
  {
    id: 'lagoon',
    label: 'Lagoon',
    colors: ['#4fb8b2', '#6b9f7a', '#c4a574', '#e07b63', '#7b8fa3', '#328f97', '#a070c0', '#5aa0d0'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    colors: ['#2563eb', '#0ea5e9', '#14b8a6', '#6366f1', '#64748b', '#1d4ed8', '#38bdf8', '#2dd4bf'],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    colors: ['#e07b63', '#f59e0b', '#ec4899', '#c4a574', '#f97316', '#db2777', '#d97706', '#fb7185'],
  },
  {
    id: 'forest',
    label: 'Forest',
    colors: ['#3f7d5a', '#6b9f7a', '#84cc16', '#a3a38a', '#166534', '#65a30d', '#4d7c0f', '#a8a29e'],
  },
  {
    id: 'mono',
    label: 'Mono',
    colors: ['#1e3a3a', '#4a5f5f', '#7b8fa3', '#a8b5b5', '#328f97', '#5c6b6b', '#94a3b8', '#cbd5e1'],
  },
]

export const DEFAULT_CHART_PALETTE_ID: ChartPaletteId = 'lagoon'

export const DEFAULT_DASHBOARD_THEME: DashboardTheme = {
  paletteId: DEFAULT_CHART_PALETTE_ID,
}

export function chartPaletteById(id: string | undefined | null): ChartPalette {
  return CHART_PALETTES.find((p) => p.id === id) ?? CHART_PALETTES[0]
}

export function isChartPaletteId(v: unknown): v is ChartPaletteId {
  return typeof v === 'string' && CHART_PALETTES.some((p) => p.id === v)
}

export function normalizeDashboardTheme(raw: unknown): DashboardTheme {
  if (raw && typeof raw === 'object' && isChartPaletteId((raw as { paletteId?: unknown }).paletteId)) {
    return { paletteId: (raw as { paletteId: ChartPaletteId }).paletteId }
  }
  return { ...DEFAULT_DASHBOARD_THEME }
}

/** Chart-palette CSS variables without a canvas background. */
export function dashboardThemeVars(paletteId?: string | null): CSSProperties {
  const p = chartPaletteById(paletteId ?? DEFAULT_CHART_PALETTE_ID)
  const a = p.colors[0]
  const b = p.colors[1]
  return {
    ['--dash-accent' as string]: a,
    ['--dash-accent-2' as string]: b,
    ['--dash-accent-3' as string]: p.colors[2] ?? a,
    ['--dash-warn' as string]: p.colors[3] ?? a,
  }
}

/** CSS custom properties for the dashboard canvas shell. */
export function dashboardThemeStyle(paletteId?: string | null): CSSProperties {
  const p = chartPaletteById(paletteId ?? DEFAULT_CHART_PALETTE_ID)
  const a = p.colors[0]
  const b = p.colors[1]
  return {
    ...dashboardThemeVars(paletteId),
    background: `linear-gradient(165deg, color-mix(in srgb, ${a} 14%, var(--bg-base)) 0%, color-mix(in srgb, ${b} 10%, var(--bg-base)) 55%, var(--bg-base) 100%)`,
  }
}
