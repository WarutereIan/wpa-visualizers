import type { WidgetType } from '#/types/dashboard'
import { PRIMARY_WIDGET_TYPES } from '#/lib/widgetBindingHints'

export interface PaletteEntry {
  type: WidgetType
  label: string
  /** Compact label for the narrow add-widget rail */
  shortLabel: string
  group: PaletteGroup
  minW: number
  minH: number
  defaultW: number
  defaultH: number
}

export type PaletteGroup =
  | 'General'
  | 'Comparison'
  | 'Trend'
  | 'Part-to-whole'
  | 'Correlation'
  | 'Flow'
  | 'Statistical'
  | 'Indicator'
  | 'Mixed'

export const PALETTE_GROUPS: PaletteGroup[] = [
  'General',
  'Comparison',
  'Trend',
  'Part-to-whole',
  'Correlation',
  'Flow',
  'Statistical',
  'Indicator',
  'Mixed',
]

const c = (
  type: WidgetType,
  label: string,
  shortLabel: string,
  group: PaletteGroup,
  defaultW = 6,
  defaultH = 6,
  minW = 3,
  minH = 3,
): PaletteEntry => ({ type, label, shortLabel, group, defaultW, defaultH, minW, minH })

export const WIDGET_PALETTE: PaletteEntry[] = [
  c('kpi', 'KPI card', 'KPI', 'General', 3, 3, 2, 2),
  c('table', 'Data table', 'Table', 'General', 8, 6, 4, 3),
  c('text', 'Text box', 'Text', 'General', 4, 3, 2, 2),

  c('bar', 'Bar chart', 'Bar', 'Comparison'),
  c('stacked_bar', 'Stacked bar', 'Stacked bar', 'Comparison'),
  c('horizontal_bar', 'Horizontal bar', 'H. bar', 'Comparison'),
  c('radar', 'Radar / spider', 'Radar', 'Comparison'),

  c('line', 'Line chart', 'Line', 'Trend'),
  c('area', 'Area chart', 'Area', 'Trend'),
  c('stacked_area', 'Stacked area', 'Stacked area', 'Trend'),

  c('pie', 'Pie chart', 'Pie', 'Part-to-whole'),
  c('donut', 'Donut', 'Donut', 'Part-to-whole'),
  c('sunburst', 'Sunburst', 'Sunburst', 'Part-to-whole'),
  c('treemap', 'Treemap', 'Treemap', 'Part-to-whole'),
  c('funnel', 'Funnel', 'Funnel', 'Part-to-whole'),

  c('scatter', 'Scatter plot', 'Scatter', 'Correlation'),
  c('bubble', 'Bubble chart', 'Bubble', 'Correlation'),
  c('heatmap', 'Heatmap', 'Heatmap', 'Correlation', 8, 5, 4, 3),

  c('sankey', 'Sankey diagram', 'Sankey', 'Flow', 8, 7, 5, 4),
  c('graph', 'Network graph', 'Network', 'Flow'),

  c('boxplot', 'Box plot', 'Box plot', 'Statistical'),
  c('candlestick', 'Candlestick', 'Candlestick', 'Statistical'),
  c('histogram', 'Histogram', 'Histogram', 'Statistical'),

  c('gauge', 'Gauge', 'Gauge', 'Indicator', 4, 5, 3, 3),
  c('waterfall', 'Waterfall', 'Waterfall', 'Indicator'),

  c('composed', 'Composed (bar + line)', 'Composed', 'Mixed'),
]

export function paletteEntryFor(type: WidgetType): PaletteEntry | undefined {
  return WIDGET_PALETTE.find((p) => p.type === type)
}

export function primaryPaletteEntries(): PaletteEntry[] {
  return PRIMARY_WIDGET_TYPES.map((t) => paletteEntryFor(t)).filter(
    (e): e is PaletteEntry => e != null,
  )
}

export function morePaletteEntries(): PaletteEntry[] {
  const primary = new Set(PRIMARY_WIDGET_TYPES)
  return WIDGET_PALETTE.filter((e) => !primary.has(e.type))
}

/** Non-primary entries grouped for the add rail. */
export function morePaletteByGroup(): { group: PaletteGroup; entries: PaletteEntry[] }[] {
  const more = morePaletteEntries()
  const out: { group: PaletteGroup; entries: PaletteEntry[] }[] = []
  for (const group of PALETTE_GROUPS) {
    const entries = more.filter((e) => e.group === group)
    if (entries.length) out.push({ group, entries })
  }
  return out
}
