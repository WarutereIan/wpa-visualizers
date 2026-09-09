import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VIZ_SIZE,
  GRID_COLS,
  GRID_ROW_HEIGHT,
  GRID_VERSION,
  findFreePosition,
  layoutItemToPosition,
  normalizeWidgetOptions,
  positionToLayoutItem,
  scalePositionFromV1,
} from '#/lib/widgetGrid'
import type { DashboardWidget } from '#/types/visualization'

const widget = (col: number, row: number, sizeX: number, sizeY: number): DashboardWidget => ({
  id: `${col}-${row}`,
  dashboardId: 'd',
  visualizationId: null,
  text: 't',
  options: { position: { col, row, sizeX, sizeY }, gridVersion: GRID_VERSION },
  createdAt: '',
  updatedAt: '',
})

describe('widgetGrid', () => {
  it('uses a 12-column / 25px-row grid', () => {
    expect(GRID_COLS).toBe(12)
    expect(GRID_ROW_HEIGHT).toBe(25)
    expect(DEFAULT_VIZ_SIZE).toEqual({ sizeX: 6, sizeY: 8 })
  })

  it('round-trips position <-> layout item', () => {
    const w = widget(2, 4, 6, 8)
    const item = positionToLayoutItem(w)
    expect(item).toMatchObject({ i: '2-4', x: 2, y: 4, w: 6, h: 8 })
    expect(layoutItemToPosition(item)).toEqual({ col: 2, row: 4, sizeX: 6, sizeY: 8 })
  })

  it('finds first free slot left-to-right', () => {
    expect(findFreePosition([widget(0, 0, 6, 8)], 6, 8)).toEqual({
      col: 6,
      row: 0,
      sizeX: 6,
      sizeY: 8,
    })
  })

  it('wraps to a new row when the row is full', () => {
    expect(findFreePosition([widget(0, 0, 6, 8), widget(6, 0, 6, 8)], 6, 8)).toEqual({
      col: 0,
      row: 8,
      sizeX: 6,
      sizeY: 8,
    })
  })

  it('scales v1 positions onto the 12-col / finer-row grid', () => {
    expect(scalePositionFromV1({ col: 3, row: 2, sizeX: 3, sizeY: 8 })).toEqual({
      col: 6,
      row: 4,
      sizeX: 6,
      sizeY: 16,
    })
  })

  it('normalizes v1 widget options once', () => {
    const first = normalizeWidgetOptions({
      position: { col: 0, row: 0, sizeX: 3, sizeY: 8 },
    })
    expect(first.migrated).toBe(true)
    expect(first.options).toEqual({
      position: { col: 0, row: 0, sizeX: 6, sizeY: 16 },
      gridVersion: GRID_VERSION,
    })
    const second = normalizeWidgetOptions(first.options)
    expect(second.migrated).toBe(false)
    expect(second.options.position).toEqual(first.options.position)
  })
})
