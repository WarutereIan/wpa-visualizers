import { describe, expect, it } from 'vitest'
import { useDashboardStore } from '#/stores/dashboardStore'

describe('dashboardStore widgets', () => {
  it('creates, lists, updates and removes widgets per dashboard', () => {
    const s = useDashboardStore.getState()
    const d = s.addDashboard('Test')
    const w = s.createWidget({
      dashboardId: d.id,
      visualizationId: null,
      text: 'hello',
      options: { position: { col: 0, row: 0, sizeX: 3, sizeY: 3 } },
    })
    expect(s.listWidgets(d.id)).toHaveLength(1)
    s.updateWidget(w.id, { text: 'updated' })
    expect(s.listWidgets(d.id)[0].text).toBe('updated')
    s.removeWidget(w.id)
    expect(s.listWidgets(d.id)).toHaveLength(0)
  })

  it('duplicates a dashboard and its widget rows', () => {
    const s = useDashboardStore.getState()
    const d = s.addDashboard('Source')
    s.updateDashboard(d.id, { tags: ['meal'], status: 'published' })
    const w = s.createWidget({
      dashboardId: d.id,
      visualizationId: 'viz-1',
      text: null,
      options: { position: { col: 1, row: 2, sizeX: 3, sizeY: 4 } },
    })
    const copy = s.duplicateDashboard(d.id)
    expect(copy).toBeDefined()
    expect(copy!.id).not.toBe(d.id)
    expect(copy!.name).toBe('Copy of: Source')
    expect(copy!.status).toBe('draft')
    expect(copy!.tags).toEqual(['meal'])
    const copied = s.listWidgets(copy!.id)
    expect(copied).toHaveLength(1)
    expect(copied[0].id).not.toBe(w.id)
    expect(copied[0].visualizationId).toBe('viz-1')
    expect(copied[0].options.position).toEqual({ col: 1, row: 2, sizeX: 3, sizeY: 4 })
  })
})

describe('dashboardStore favorites', () => {
  it('toggles favorites', () => {
    const s = useDashboardStore.getState()
    s.toggleFavorite('dashboard', 'd1')
    expect(s.isFavorite('dashboard', 'd1')).toBe(true)
    s.toggleFavorite('dashboard', 'd1')
    expect(s.isFavorite('dashboard', 'd1')).toBe(false)
  })
})
