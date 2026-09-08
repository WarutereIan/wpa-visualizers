import type { Layout } from 'react-grid-layout'
import type { DashboardWidget, WidgetPosition } from '#/types/visualization'

export const GRID_COLS = 6
export const GRID_ROW_HEIGHT = 50
export const GRID_MARGIN = 15
export const DEFAULT_VIZ_SIZE = { sizeX: 3, sizeY: 8 }
export const DEFAULT_TEXT_SIZE = { sizeX: 3, sizeY: 3 }

export function positionToLayoutItem(w: DashboardWidget): Layout[number] {
  const { col, row, sizeX, sizeY } = w.options.position
  return {
    i: w.id,
    x: col,
    y: row,
    w: sizeX,
    h: sizeY,
    minW: 1,
    minH: 1,
  }
}

export function layoutItemToPosition(item: Layout[number]): WidgetPosition {
  return {
    col: item.x,
    row: item.y,
    sizeX: item.w,
    sizeY: item.h,
  }
}

function rectsOverlap(
  a: WidgetPosition,
  col: number,
  row: number,
  sizeX: number,
  sizeY: number,
): boolean {
  return (
    col < a.col + a.sizeX &&
    col + sizeX > a.col &&
    row < a.row + a.sizeY &&
    row + sizeY > a.row
  )
}

/** First free slot scanning left-to-right, top-to-bottom (Redash append behavior). */
export function findFreePosition(
  widgets: DashboardWidget[],
  sizeX: number,
  sizeY: number,
): WidgetPosition {
  const occupied = widgets.map((w) => w.options.position)
  let row = 0
  while (true) {
    for (let col = 0; col <= GRID_COLS - sizeX; col++) {
      const collision = occupied.some((pos) => rectsOverlap(pos, col, row, sizeX, sizeY))
      if (!collision) return { col, row, sizeX, sizeY }
    }
    row += 1
  }
}
