import { create } from 'zustand'

/** Global filters applied to all widgets on a dashboard view */
export interface GlobalDashboardFilters {
  /** ISO date strings or null = unset */
  dateFrom: string | null
  dateTo: string | null
}

interface FilterState {
  filters: GlobalDashboardFilters
  setDateRange: (from: string | null, to: string | null) => void
  reset: () => void
}

const initial: GlobalDashboardFilters = {
  dateFrom: null,
  dateTo: null,
}

export const useDashboardFilterStore = create<FilterState>((set) => ({
  filters: initial,
  setDateRange: (dateFrom, dateTo) =>
    set({ filters: { dateFrom, dateTo } }),
  reset: () => set({ filters: initial }),
}))
