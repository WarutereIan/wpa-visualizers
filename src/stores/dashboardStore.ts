import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardDefinition } from '#/types/dashboard'
import {
  getLayoutWidgetsForTemplate,
  type DashboardTemplateId,
} from '#/lib/dashboardTemplates'

const STORAGE_KEY = 'wpa-dashboards-v1'

function nowIso() {
  return new Date().toISOString()
}

function defaultLayoutAndWidgets() {
  return getLayoutWidgetsForTemplate('sample')
}

/** Fresh draft for the wizard / builder (not persisted until save). */
export function createNewDashboardDraft(opts?: {
  templateId?: DashboardTemplateId
}): DashboardDefinition {
  const id = crypto.randomUUID()
  const templateId = opts?.templateId ?? 'sample'
  const { layout, widgets } = getLayoutWidgetsForTemplate(templateId)
  return {
    id,
    name: 'New dashboard',
    description: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    layout,
    widgets,
  }
}

interface DashboardState {
  dashboards: DashboardDefinition[]
  addDashboard: (name: string, description?: string) => DashboardDefinition
  /** Create or replace by id (used by dashboard builder save) */
  upsertDashboard: (d: DashboardDefinition) => void
  updateDashboard: (id: string, patch: Partial<Pick<DashboardDefinition, 'name' | 'description' | 'layout' | 'widgets'>>) => void
  removeDashboard: (id: string) => void
  getById: (id: string) => DashboardDefinition | undefined
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      dashboards: [],

      addDashboard: (name, description) => {
        const id = crypto.randomUUID()
        const base = defaultLayoutAndWidgets()
        const d: DashboardDefinition = {
          id,
          name,
          description,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...base,
        }
        set((s) => ({ dashboards: [...s.dashboards, d] }))
        return d
      },

      upsertDashboard: (d) => {
        set((s) => {
          const i = s.dashboards.findIndex((x) => x.id === d.id)
          if (i >= 0) {
            const next = [...s.dashboards]
            next[i] = { ...d, updatedAt: nowIso() }
            return { dashboards: next }
          }
          return { dashboards: [...s.dashboards, { ...d, updatedAt: nowIso() }] }
        })
      },

      updateDashboard: (id, patch) => {
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === id
              ? { ...d, ...patch, updatedAt: nowIso() }
              : d,
          ),
        }))
      },

      removeDashboard: (id) => {
        set((s) => ({ dashboards: s.dashboards.filter((d) => d.id !== id) }))
      },

      getById: (id) => get().dashboards.find((d) => d.id === id),
    }),
    { name: STORAGE_KEY },
  ),
)
