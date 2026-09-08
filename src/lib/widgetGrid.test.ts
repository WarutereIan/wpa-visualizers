import { describe, expect, it } from 'vitest'
import { findFreePosition, layoutItemToPosition, positionToLayoutItem } from '#/lib/widgetGrid'
import type { DashboardWidget } from '#/types/visualization'

const widget = (col: number, row: number, sizeX: number, sizeY: number): DashboardWidget => ({
  id: `${col}-${row}`, dashboardId: 'd', visualizationId: null, text: 't',
  options: { position: { col, row, sizeX, sizeY } }, createdAt: '', updatedAt: '',
})

describe('widgetGrid', () => {
  it('round-trips position <-> layout item', () => {
    const w = widget(2, 4, 3, 8)
    const item = positionToLayoutItem(w)
    expect(item).toMatchObject({ i: '2-4', x: 2, y: 4, w: 3, h: 8 })
    expect(layoutItemToPosition(item)).toEqual({ col: 2, row: 4, sizeX: 3, sizeY: 8 })
  })
  it('finds first free slot left-to-right', () => {
    expect(findFreePosition([widget(0, 0, 3, 8)], 3, 8)).toEqual({ col: 3, row: 0, sizeX: 3, sizeY: 8 })
  })
  it('wraps to a new row when the row is full', () => {
    expect(findFreePosition([widget(0, 0, 3, 8), widget(3, 0, 3, 8)], 3, 8))
      .toEqual({ col: 0, row: 8, sizeX: 3, sizeY: 8 })
  })
})
