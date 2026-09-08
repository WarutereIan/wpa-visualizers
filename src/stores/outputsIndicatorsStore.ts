import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured } from '#/lib/env'
import type {
  OutputIndicatorLink,
  Indicator,
  Output,
  Project,
} from '#/types/outputsIndicators'

const STORAGE_KEY = 'wpa-outputs-indicators-v1'

const now = () => new Date().toISOString()
const ts = { createdAt: now(), updatedAt: now() }

const demoProjects: Project[] = [
  {
    id: 'proj-meals',
    organizationId: 'demo',
    name: 'Meal distribution — multi-district',
    code: 'MEALS-01',
    program: 'Meals',
    description: 'School and community meal coverage aligned with demo Households (North / South).',
    status: 'in_progress',
    startDate: null,
    endDate: null,
    ...ts,
  },
  {
    id: 'proj-cash',
    organizationId: 'demo',
    name: 'Cash transfer pilot',
    code: 'CASH-01',
    program: 'Cash',
    description: 'Direct cash assistance; ties to East / West rows in sample data.',
    status: 'in_progress',
    startDate: null,
    endDate: null,
    ...ts,
  },
  {
    id: 'proj-voucher',
    organizationId: 'demo',
    name: 'Voucher programme',
    code: 'VOUCH-01',
    program: 'Voucher',
    description: 'Southern district voucher rollout (see South + Voucher in demo tables).',
    status: 'in_progress',
    startDate: null,
    endDate: null,
    ...ts,
  },
]

const demoOutputs: Output[] = [
  {
    id: 'out-meals-kitchens',
    projectId: 'proj-meals',
    title: 'Community kitchen upgrades — North',
    description: 'Equipment and hygiene training for partner kitchens.',
    status: 'in_progress',
    location: 'North',
    targetPeriod: '2026-Q1',
    ...ts,
  },
  {
    id: 'out-meals-enrol',
    projectId: 'proj-meals',
    title: 'Beneficiary enrolment surge',
    description: 'Onboarding aligned with Jan–Feb beneficiary rows.',
    status: 'completed',
    location: 'South',
    targetPeriod: '2026-Q1',
    ...ts,
  },
  {
    id: 'out-cash-digital',
    projectId: 'proj-cash',
    title: 'Digital payment channel',
    description: 'Rollout mapped to Cash program rows (East / West).',
    status: 'in_progress',
    location: 'East',
    targetPeriod: '2026-Q1',
    ...ts,
  },
  {
    id: 'out-voucher-retail',
    projectId: 'proj-voucher',
    title: 'Retailer network — South',
    description: 'Voucher redemption points (South, Mar).',
    status: 'planned',
    location: 'South',
    targetPeriod: '2026-Q2',
    ...ts,
  },
]

/** Names/locations/periods mirror `tbl-indicators` in dataStore where possible. */
const demoIndicators: Indicator[] = [
  {
    id: 'ind-cov-north',
    organizationId: 'demo',
    projectId: 'proj-meals',
    name: 'Coverage',
    type: 'percentage',
    location: 'North',
    unit: '% households',
    baseline: 55,
    target: 75,
    current: 68,
    period: '2026-Q1',
    sourceQueryId: null,
    formula: {},
    disaggregations: [],
    ...ts,
  },
  {
    id: 'ind-cov-south',
    organizationId: 'demo',
    projectId: 'proj-meals',
    name: 'Coverage',
    type: 'percentage',
    location: 'South',
    unit: '% households',
    baseline: 50,
    target: 75,
    current: 61,
    period: '2026-Q1',
    sourceQueryId: null,
    formula: {},
    disaggregations: [],
    ...ts,
  },
  {
    id: 'ind-time-north',
    organizationId: 'demo',
    projectId: 'proj-meals',
    name: 'Timeliness',
    type: 'percentage',
    location: 'North',
    unit: '% on-time',
    baseline: 70,
    target: 85,
    current: 82,
    period: '2026-Q1',
    sourceQueryId: null,
    formula: {},
    disaggregations: [],
    ...ts,
  },
  {
    id: 'ind-sat-east',
    organizationId: 'demo',
    projectId: 'proj-cash',
    name: 'Satisfaction',
    type: 'average',
    location: 'East',
    unit: 'score / 100',
    baseline: 65,
    target: 80,
    current: 74,
    period: '2026-Q1',
    sourceQueryId: null,
    formula: {},
    disaggregations: [],
    ...ts,
  },
  {
    id: 'ind-time-south',
    organizationId: 'demo',
    projectId: 'proj-voucher',
    name: 'Timeliness',
    type: 'percentage',
    location: 'South',
    unit: '% on-time',
    baseline: 72,
    target: 85,
    current: 79,
    period: '2026-Q1',
    sourceQueryId: null,
    formula: {},
    disaggregations: [],
    ...ts,
  },
]

/** Dummy linkages: outputs → indicators (weights sum arbitrarily for demo). */
const demoLinks: OutputIndicatorLink[] = [
  { outputId: 'out-meals-kitchens', indicatorId: 'ind-cov-north', weight: 0.45, note: 'Kitchen reach' },
  { outputId: 'out-meals-kitchens', indicatorId: 'ind-time-north', weight: 0.35, note: null },
  { outputId: 'out-meals-enrol', indicatorId: 'ind-cov-south', weight: 0.6, note: 'Enrolment drives coverage' },
  { outputId: 'out-meals-enrol', indicatorId: 'ind-time-north', weight: 0.15, note: null },
  { outputId: 'out-cash-digital', indicatorId: 'ind-sat-east', weight: 0.55, note: null },
  { outputId: 'out-voucher-retail', indicatorId: 'ind-time-south', weight: 0.5, note: null },
  { outputId: 'out-voucher-retail', indicatorId: 'ind-cov-south', weight: 0.25, note: null },
]

interface OutputsIndicatorsState {
  projects: Project[]
  outputs: Output[]
  indicators: Indicator[]
  links: OutputIndicatorLink[]
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  getProject: (id: string) => Project | undefined
  outputsForProject: (projectId: string) => Output[]
  indicatorsForProject: (projectId: string) => Indicator[]
  indicatorsForOutput: (outputId: string) => Indicator[]
  outputsForIndicator: (indicatorId: string) => Output[]
}

export const useOutputsIndicatorsStore = create<OutputsIndicatorsState>()(
  persist(
    (set, get) => ({
      projects: demoProjects,
      outputs: demoOutputs,
      indicators: demoIndicators,
      links: demoLinks,
      selectedProjectId: null,

      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      getProject: (id) => get().projects.find((p) => p.id === id),

      outputsForProject: (projectId) =>
        get().outputs.filter((o) => o.projectId === projectId),

      indicatorsForProject: (projectId) =>
        get().indicators.filter((i) => i.projectId === projectId),

      indicatorsForOutput: (outputId) => {
        const { links, indicators } = get()
        const indIds = new Set(
          links.filter((l) => l.outputId === outputId).map((l) => l.indicatorId),
        )
        return indicators.filter((i) => indIds.has(i.id))
      },

      outputsForIndicator: (indicatorId) => {
        const { links, outputs } = get()
        const outIds = new Set(
          links.filter((l) => l.indicatorId === indicatorId).map((l) => l.outputId),
        )
        return outputs.filter((o) => outIds.has(o.id))
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ selectedProjectId: s.selectedProjectId }),
      skipHydration: isSupabaseConfigured(),
    },
  ),
)
