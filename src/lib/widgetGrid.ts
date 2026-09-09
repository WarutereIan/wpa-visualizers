import type { Layout } from 'react-grid-layout'
import type { DashboardWidget, WidgetPosition } from '#/types/visualization'

/** Horizontal slots across the dashboard. */
export const GRID_COLS = 12
/** Pixel height of one grid row (finer than the old 50px). */
export const GRID_ROW_HEIGHT = 25
export const GRID_MARGIN = 15

/**
 * Layout schema version.
 * v1: 6 columns, 50px rows
 * v2: 12 columns, 25px rows (positions scaled ×2 on migrate)
 */
export const GRID_VERSION = 2

/** Half-width chart; height kept at 8 rows (shorter in px than old 8×50 defaults). */
export const DEFAULT_VIZ_SIZE = { sizeX: 6, sizeY: 8 }
export const DEFAULT_TEXT_SIZE = { sizeX: 6, sizeY: 3 }

export function scalePositionFromV1(position: WidgetPosition): WidgetPosition {
  return {
    col: position.col * 2,
    row: position.row * 2,
    sizeX: Math.max(1, position.sizeX * 2),
    sizeY: Math.max(1, position.sizeY * 2),
  }
}

/** Normalize stored widget options onto the current grid version (idempotent). */
export function normalizeWidgetOptions(
  options: DashboardWidget['options'],
): { options: DashboardWidget['options']; migrated: boolean } {
  const version = options.gridVersion ?? 1
  if (version >= GRID_VERSION) {
    const withVersion =
      options.gridVersion === GRID_VERSION ? options : { ...options, gridVersion: GRID_VERSION }
    return { options: withVersion, migrated: options.gridVersion !== GRID_VERSION }
  }
  return {
    options: {
      ...options,
      position: scalePositionFromV1(options.position),
      gridVersion: GRID_VERSION,
    },
    migrated: true,
  }
}

export function normalizeDashboardWidget(widget: DashboardWidget): DashboardWidget {
  const { options } = normalizeWidgetOptions(widget.options)
  if (options === widget.options) return widget
  return { ...widget, options }
}

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
  const occupied = widgets.map((w) => normalizeDashboardWidget(w).options.position)
  let row = 0
  while (true) {
    for (let col = 0; col <= GRID_COLS - sizeX; col++) {
      const collision = occupied.some((pos) => rectsOverlap(pos, col, row, sizeX, sizeY))
      if (!collision) return { col, row, sizeX, sizeY }
    }
    row += 1
  }
}
