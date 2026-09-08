import { describe, expect, it } from 'vitest'
import {
  chartPaletteById,
  CHART_PALETTES,
  normalizeDashboardTheme,
  dashboardThemeStyle,
} from '#/lib/chartPalettes'

describe('chartPalettes', () => {
  it('resolves known and unknown ids', () => {
    expect(chartPaletteById('ocean').id).toBe('ocean')
    expect(chartPaletteById('nope').id).toBe(CHART_PALETTES[0].id)
  })

  it('has at least 5 colors per palette', () => {
    for (const p of CHART_PALETTES) {
      expect(p.colors.length).toBeGreaterThanOrEqual(5)
    }
  })

  it('normalizes dashboard theme', () => {
    expect(normalizeDashboardTheme({ paletteId: 'sunset' }).paletteId).toBe('sunset')
    expect(normalizeDashboardTheme(null).paletteId).toBe('lagoon')
  })

  it('builds canvas theme CSS vars', () => {
    const style = dashboardThemeStyle('ocean')
    expect(style['--dash-accent' as keyof typeof style]).toBe(chartPaletteById('ocean').colors[0])
  })
})
