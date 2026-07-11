/**
 * MEAL layer — Monitoring, Evaluation, Accountability & Learning.
 *
 * Projects, outputs, indicators, and output↔indicator links, modelled on
 * standard MEAL framework concepts:
 * - Project: a programme/intervention with a results chain (outputs → outcomes).
 * - Output: a deliverable or service produced by the project, optionally scoped
 *   to a geographic location.
 * - Indicator: a measurable signal with a baseline, target, and current value,
 *   optionally computed from a saved query. Carries a type (count, percentage,
 *   disaggregated, …) and optional disaggregations.
 * - OutputIndicatorLink: the contribution of an output to an indicator, with a
 *   weight used in composite scoring.
 */

export type EntityStatus = 'planned' | 'in_progress' | 'completed' | 'at_risk'
export type ProjectStatus = EntityStatus
export type OutputStatus = EntityStatus

export type IndicatorType =
  | 'count'
  | 'sum'
  | 'average'
  | 'percentage'
  | 'conditional_count'
  | 'disaggregated'
  | 'composite'
  | 'trend'
  | 'baseline_adjusted'
  | 'target_variance'

export const INDICATOR_TYPES: IndicatorType[] = [
  'count',
  'sum',
  'average',
  'percentage',
  'conditional_count',
  'disaggregated',
  'composite',
  'trend',
  'baseline_adjusted',
  'target_variance',
]

export const INDICATOR_TYPE_LABELS: Record<IndicatorType, string> = {
  count: 'Count',
  sum: 'Sum',
  average: 'Average',
  percentage: 'Percentage',
  conditional_count: 'Conditional count',
  disaggregated: 'Disaggregated',
  composite: 'Composite',
  trend: 'Trend',
  baseline_adjusted: 'Baseline-adjusted',
  target_variance: 'Target variance',
}

export interface Project {
  id: string
  organizationId: string
  name: string
  code: string | null
  program: string | null
  description: string
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface Output {
  id: string
  projectId: string
  title: string
  description: string
  status: OutputStatus
  /** Optional geographic/site scope for the output. */
  location: string | null
  targetPeriod: string | null
  createdAt: string
  updatedAt: string
}

export interface Indicator {
  id: string
  organizationId: string
  projectId: string | null
  name: string
  type: IndicatorType
  unit: string | null
  /** Optional geographic/site scope for the indicator. */
  location: string | null
  baseline: number | null
  target: number | null
  /** Latest measured/computed value; refreshed by compute-indicator-current. */
  current: number | null
  period: string | null
  /** Saved query used to compute `current` server-side. */
  sourceQueryId: string | null
  formula: Record<string, unknown>
  disaggregations: string[]
  createdAt: string
  updatedAt: string
}

export interface OutputIndicatorLink {
  outputId: string
  indicatorId: string
  weight: number
  note: string | null
}

export interface MealBundle {
  projects: Project[]
  outputs: Output[]
  indicators: Indicator[]
  links: OutputIndicatorLink[]
}

/** @deprecated Use `Project` */
export type WpaProject = Project
/** @deprecated Use `Output` */
export type WpaOutput = Output
/** @deprecated Use `Indicator` */
export type WpaIndicator = Indicator
