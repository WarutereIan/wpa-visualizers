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
})
