import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardDefinition } from '#/types/dashboard'

const STORAGE_KEY = 'wpa-dashboard-drafts-v1'

function nowIso() {
  return new Date().toISOString()
}

interface DashboardDraftState {
  /** Local-only drafts keyed by dashboard id. Publish pushes live; drafts stay until cleared. */
  drafts: Record<string, DashboardDefinition>
  saveDraft: (d: DashboardDefinition) => void
  getDraft: (id: string) => DashboardDefinition | undefined
  removeDraft: (id: string) => void
  listDrafts: () => DashboardDefinition[]
}

export const useDashboardDraftStore = create<DashboardDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (d) => {
        const next: DashboardDefinition = {
          ...d,
          status: 'draft',
          updatedAt: nowIso(),
        }
        set((s) => ({ drafts: { ...s.drafts, [d.id]: next } }))
      },

      getDraft: (id) => get().drafts[id],

      removeDraft: (id) => {
        set((s) => {
          const drafts = { ...s.drafts }
          delete drafts[id]
          return { drafts }
        })
      },

      listDrafts: () =>
        Object.values(get().drafts).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    }),
    { name: STORAGE_KEY },
  ),
)

/** Prefer local draft when present (and optionally newer than published). */
export function resolveEditableDashboard(
  published: DashboardDefinition | undefined,
  draft: DashboardDefinition | undefined,
): DashboardDefinition | undefined {
  if (draft && published) {
    const draftTs = new Date(draft.updatedAt).getTime()
    const pubTs = new Date(published.updatedAt).getTime()
    return draftTs >= pubTs ? draft : { ...published, ...draft, id: published.id }
  }
  return draft ?? published
}
