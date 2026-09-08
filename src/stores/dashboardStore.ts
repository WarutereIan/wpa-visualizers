import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured } from '#/lib/env'
import type { DashboardDefinition } from '#/types/dashboard'
import type { DashboardWidget } from '#/types/visualization'
import {
  getLayoutWidgetsForTemplate,
  type DashboardTemplateId,
} from '#/lib/dashboardTemplates'
import { DEFAULT_DASHBOARD_THEME } from '#/lib/chartPalettes'

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
    theme: { ...DEFAULT_DASHBOARD_THEME },
    status: 'draft',
  }
}

interface DashboardState {
  dashboards: DashboardDefinition[]
  widgets: DashboardWidget[]
  addDashboard: (name: string, description?: string) => DashboardDefinition
  /** Create or replace by id (used by dashboard builder save) */
  upsertDashboard: (d: DashboardDefinition) => void
  updateDashboard: (id: string, patch: Partial<Pick<DashboardDefinition, 'name' | 'description' | 'layout' | 'widgets' | 'theme'>>) => void
  removeDashboard: (id: string) => void
  getById: (id: string) => DashboardDefinition | undefined
  listWidgets: (dashboardId: string) => DashboardWidget[]
  listByDashboard: (dashboardId: string) => DashboardWidget[]
  createWidget: (input: Omit<DashboardWidget, 'id' | 'createdAt' | 'updatedAt'>) => DashboardWidget
  updateWidget: (
    id: string,
    patch: Partial<Pick<DashboardWidget, 'text' | 'options' | 'visualizationId'>>,
  ) => void
  removeWidget: (id: string) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      dashboards: [],
      widgets: [],

      addDashboard: (name, description) => {
        const id = crypto.randomUUID()
        const base = defaultLayoutAndWidgets()
        const d: DashboardDefinition = {
          id,
          name,
          description,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          theme: { ...DEFAULT_DASHBOARD_THEME },
          status: 'draft',
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
        set((s) => ({
          dashboards: s.dashboards.filter((d) => d.id !== id),
          widgets: s.widgets.filter((w) => w.dashboardId !== id),
        }))
      },

      getById: (id) => get().dashboards.find((d) => d.id === id),

      listWidgets: (dashboardId) => get().widgets.filter((w) => w.dashboardId === dashboardId),
      listByDashboard: (dashboardId) => get().widgets.filter((w) => w.dashboardId === dashboardId),

      createWidget: (input) => {
        const now = nowIso()
        const widget: DashboardWidget = {
          id: crypto.randomUUID(),
          ...input,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ widgets: [...s.widgets, widget] }))
        return widget
      },

      updateWidget: (id, patch) => {
        set((s) => ({
          widgets: s.widgets.map((w) =>
            w.id === id ? { ...w, ...patch, updatedAt: nowIso() } : w,
          ),
        }))
      },

      removeWidget: (id) => {
        set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) }))
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: isSupabaseConfigured(),
      merge: (persisted, current) => {
        const p = persisted as Partial<DashboardState> | undefined
        return {
          ...current,
          ...p,
          dashboards: p?.dashboards ?? current.dashboards,
          widgets: p?.widgets ?? [],
        }
      },
    },
  ),
)
