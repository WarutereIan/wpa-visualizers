import type { Layout } from 'react-grid-layout'
import type { DashboardTheme } from '#/lib/chartPalettes'

export type { DashboardTheme }

/**
 * Visualization types available in the dashboard builder.
 *
 * Naming is by *what the user sees*, not by library.
 * ECharts is the primary renderer; Recharts is used for
 * "composed" (bar+line overlay) which it handles especially well.
 */
export type WidgetType =
  /* ── General ─────────────────────────────────────── */
  | 'kpi'
  | 'table'
  | 'text'

  /* ── Comparison ──────────────────────────────────── */
  | 'bar'
  | 'stacked_bar'
  | 'horizontal_bar'
  | 'radar'

  /* ── Trend ───────────────────────────────────────── */
  | 'line'
  | 'area'
  | 'stacked_area'

  /* ── Part-to-whole ───────────────────────────────── */
  | 'pie'
  | 'donut'
  | 'sunburst'
  | 'treemap'
  | 'funnel'

  /* ── Correlation ─────────────────────────────────── */
  | 'scatter'
  | 'bubble'
  | 'heatmap'

  /* ── Flow & relationship ─────────────────────────── */
  | 'sankey'
  | 'graph'

  /* ── Statistical ─────────────────────────────────── */
  | 'boxplot'
  | 'candlestick'
  | 'histogram'

  /* ── Indicator ───────────────────────────────────── */
  | 'gauge'
  | 'waterfall'

  /* ── Mixed (Recharts) ────────────────────────────── */
  | 'composed'

/** Per-widget configuration (drives the config panel + queries) */
export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  /**
   * Saved query id (`query_definitions`). Authored from Data Management or
   * create/edit in the dashboard widget config panel (create-or-pick).
   */
  dataSourceId?: string
  /**
   * Field bindings into query *result* columns (group-by keys + aggregation
   * aliases), e.g. xKey / yKey for charts.
   */
  bindings?: Record<string, string>
  /** Widget-specific options (body text, indicatorId, etc.) */
  options?: Record<string, unknown>
}

/** Persisted dashboard definition */
export interface DashboardDefinition {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  /** React Grid Layout items (legacy Layout type) */
  layout: Layout
  widgets: Record<string, WidgetConfig>
  /** Lifecycle status; defaults to 'draft' for new dashboards. */
  status?: 'draft' | 'published' | 'archived'
  /** Visual theme for the whole canvas and all widgets. */
  theme?: DashboardTheme
}
