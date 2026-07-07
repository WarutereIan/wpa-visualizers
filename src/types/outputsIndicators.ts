/** Program outputs and M&E indicators — WPA sample model (dummy linkages). */

export type OutputStatus = 'planned' | 'in_progress' | 'completed' | 'at_risk'
export type ProjectStatus = OutputStatus

export interface WpaProject {
  id: string
  organizationId?: string
  name: string
  code: string
  /** Aligns with `program` in demo Households table */
  program: string
  description: string
  status?: ProjectStatus
  /** ISO date string or null */
  startDate?: string | null
  /** ISO date string or null */
  endDate?: string | null
}

export interface WpaOutput {
  id: string
  projectId: string
  title: string
  description: string
  status: OutputStatus
  /** Aligns with `district` in demo data */
  district: string
  targetPeriod: string
}

export interface WpaIndicator {
  id: string
  projectId: string
  organizationId?: string
  /** Same labels as demo Indicators table */
  name: string
  location: string
  unit: string
  baseline: number | null
  target: number | null
  current: number | null
  period: string
  /** Saved query used to compute `current` server-side */
  sourceQueryId?: string | null
}

/** Many-to-many: which indicators an output contributes to (dummy weights). */
export interface OutputIndicatorLink {
  outputId: string
  indicatorId: string
  weight: number
  note?: string
}

export interface MealBundle {
  projects: WpaProject[]
  outputs: WpaOutput[]
  indicators: WpaIndicator[]
  links: OutputIndicatorLink[]
}
