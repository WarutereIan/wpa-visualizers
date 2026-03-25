import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  OutputIndicatorLink,
  WpaIndicator,
  WpaOutput,
  WpaProject,
} from '#/types/outputsIndicators'

const STORAGE_KEY = 'wpa-outputs-indicators-v1'

const demoProjects: WpaProject[] = [
  {
    id: 'proj-meals',
    name: 'Meal distribution — multi-district',
    code: 'MEALS-01',
    program: 'Meals',
    description: 'School and community meal coverage aligned with demo Households (North / South).',
  },
  {
    id: 'proj-cash',
    name: 'Cash transfer pilot',
    code: 'CASH-01',
    program: 'Cash',
    description: 'Direct cash assistance; ties to East / West rows in sample data.',
  },
  {
    id: 'proj-voucher',
    name: 'Voucher programme',
    code: 'VOUCH-01',
    program: 'Voucher',
    description: 'Southern district voucher rollout (see South + Voucher in demo tables).',
  },
]

const demoOutputs: WpaOutput[] = [
  {
    id: 'out-meals-kitchens',
    projectId: 'proj-meals',
    title: 'Community kitchen upgrades — North',
    description: 'Equipment and hygiene training for partner kitchens.',
    status: 'in_progress',
    district: 'North',
    targetPeriod: '2026-Q1',
  },
  {
    id: 'out-meals-enrol',
    projectId: 'proj-meals',
    title: 'Beneficiary enrolment surge',
    description: 'Onboarding aligned with Jan–Feb beneficiary rows.',
    status: 'completed',
    district: 'South',
    targetPeriod: '2026-Q1',
  },
  {
    id: 'out-cash-digital',
    projectId: 'proj-cash',
    title: 'Digital payment channel',
    description: 'Rollout mapped to Cash program rows (East / West).',
    status: 'in_progress',
    district: 'East',
    targetPeriod: '2026-Q1',
  },
  {
    id: 'out-voucher-retail',
    projectId: 'proj-voucher',
    title: 'Retailer network — South',
    description: 'Voucher redemption points (South, Mar).',
    status: 'planned',
    district: 'South',
    targetPeriod: '2026-Q2',
  },
]

/** Names/locations/periods mirror `tbl-indicators` in dataStore where possible. */
const demoIndicators: WpaIndicator[] = [
  {
    id: 'ind-cov-north',
    projectId: 'proj-meals',
    name: 'Coverage',
    location: 'North',
    unit: '% households',
    baseline: 55,
    target: 75,
    current: 68,
    period: '2026-Q1',
  },
  {
    id: 'ind-cov-south',
    projectId: 'proj-meals',
    name: 'Coverage',
    location: 'South',
    unit: '% households',
    baseline: 50,
    target: 75,
    current: 61,
    period: '2026-Q1',
  },
  {
    id: 'ind-time-north',
    projectId: 'proj-meals',
    name: 'Timeliness',
    location: 'North',
    unit: '% on-time',
    baseline: 70,
    target: 85,
    current: 82,
    period: '2026-Q1',
  },
  {
    id: 'ind-sat-east',
    projectId: 'proj-cash',
    name: 'Satisfaction',
    location: 'East',
    unit: 'score / 100',
    baseline: 65,
    target: 80,
    current: 74,
    period: '2026-Q1',
  },
  {
    id: 'ind-time-south',
    projectId: 'proj-voucher',
    name: 'Timeliness',
    location: 'South',
    unit: '% on-time',
    baseline: 72,
    target: 85,
    current: 79,
    period: '2026-Q1',
  },
]

/** Dummy linkages: outputs → indicators (weights sum arbitrarily for demo). */
const demoLinks: OutputIndicatorLink[] = [
  { outputId: 'out-meals-kitchens', indicatorId: 'ind-cov-north', weight: 0.45, note: 'Kitchen reach' },
  { outputId: 'out-meals-kitchens', indicatorId: 'ind-time-north', weight: 0.35 },
  { outputId: 'out-meals-enrol', indicatorId: 'ind-cov-south', weight: 0.6, note: 'Enrolment drives coverage' },
  { outputId: 'out-meals-enrol', indicatorId: 'ind-time-north', weight: 0.15 },
  { outputId: 'out-cash-digital', indicatorId: 'ind-sat-east', weight: 0.55 },
  { outputId: 'out-voucher-retail', indicatorId: 'ind-time-south', weight: 0.5 },
  { outputId: 'out-voucher-retail', indicatorId: 'ind-cov-south', weight: 0.25 },
]

interface OutputsIndicatorsState {
  projects: WpaProject[]
  outputs: WpaOutput[]
  indicators: WpaIndicator[]
  links: OutputIndicatorLink[]
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  getProject: (id: string) => WpaProject | undefined
  outputsForProject: (projectId: string) => WpaOutput[]
  indicatorsForProject: (projectId: string) => WpaIndicator[]
  indicatorsForOutput: (outputId: string) => WpaIndicator[]
  outputsForIndicator: (indicatorId: string) => WpaOutput[]
}

export const useOutputsIndicatorsStore = create<OutputsIndicatorsState>()(
  persist(
    (set, get) => ({
      projects: demoProjects,
      outputs: demoOutputs,
      indicators: demoIndicators,
      links: demoLinks,
      selectedProjectId: demoProjects[0]?.id ?? null,

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
    },
  ),
)
