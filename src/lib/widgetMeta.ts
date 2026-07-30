import type { WidgetType } from '#/types/dashboard'

/** Widgets that do not bind to a query (static content). */
export function widgetNeedsDataSource(type: WidgetType): boolean {
  return type !== 'text'
}

export function isTextWidget(type: WidgetType): boolean {
  return type === 'text'
}
