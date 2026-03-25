import type { WidgetType } from '#/types/dashboard'

export interface PaletteEntry {
  type: WidgetType
  label: string
  group: PaletteGroup
  /** Minimum sensible grid size */
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
  | 'Flow & relationship'
  | 'Statistical'
  | 'Indicator'
  | 'Mixed'

export const PALETTE_GROUPS: PaletteGroup[] = [
  'General',
  'Comparison',
  'Trend',
  'Part-to-whole',
  'Correlation',
  'Flow & relationship',
  'Statistical',
  'Indicator',
  'Mixed',
]

const c = (
  type: WidgetType,
  label: string,
  group: PaletteGroup,
  defaultW = 6,
  defaultH = 6,
  minW = 3,
  minH = 3,
): PaletteEntry => ({ type, label, group, defaultW, defaultH, minW, minH })

export const WIDGET_PALETTE: PaletteEntry[] = [
  /* General */
  c('kpi',   'KPI card',   'General', 3, 3, 2, 2),
  c('table', 'Data table', 'General', 8, 6, 4, 3),

  /* Comparison */
  c('bar',            'Bar chart',        'Comparison'),
  c('stacked_bar',    'Stacked bar',      'Comparison'),
 /*  c('horizontal_bar', 'Horizontal bar',   'Comparison'),
  c('radar',          'Radar / spider',   'Comparison'), */

  /* Trend */
 /*  c('line',         'Line chart',     'Trend'), */
  c('area',         'Area chart',     'Trend'),
  c('stacked_area', 'Stacked area',   'Trend'),

  /* Part-to-whole */
 /*  c('pie',      'Pie chart',  'Part-to-whole'),
  c('donut',    'Donut',      'Part-to-whole'),
  c('sunburst', 'Sunburst',   'Part-to-whole'),
  c('treemap',  'Treemap',    'Part-to-whole'),
  c('funnel',   'Funnel',     'Part-to-whole'), */

  /* Correlation */
 /*  c('scatter', 'Scatter plot', 'Correlation'),
  c('bubble',  'Bubble chart', 'Correlation'),
  c('heatmap', 'Heatmap',      'Correlation', 8, 5, 4, 3), */

  /* Flow & relationship */
 /*  c('sankey', 'Sankey diagram', 'Flow & relationship', 8, 7, 5, 4),
  c('graph',  'Network graph',  'Flow & relationship'), */

  /* Statistical */
 /*  c('boxplot',     'Box plot',     'Statistical'),
  c('candlestick', 'Candlestick',  'Statistical'),
  c('histogram',   'Histogram',    'Statistical'), */

  /* Indicator */
 /*  c('gauge',     'Gauge',     'Indicator', 4, 5, 3, 3),
  c('waterfall', 'Waterfall', 'Indicator'), */

  /* Mixed (Recharts) */
/*   c('composed', 'Composed (bar + line)', 'Mixed'), */
]

export function paletteEntryFor(type: WidgetType): PaletteEntry | undefined {
  return WIDGET_PALETTE.find((p) => p.type === type)
}
