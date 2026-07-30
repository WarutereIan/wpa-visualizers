import type { WidgetType } from '#/types/dashboard'

export type BindingSlot = {
  key: 'xKey' | 'yKey'
  label: string
  hint: string
  required: boolean
}

/** Primary chart types shown first in the add-widget control. */
export const PRIMARY_WIDGET_TYPES: WidgetType[] = [
  'kpi',
  'table',
  'text',
  'bar',
  'line',
  'pie',
]

export function isPrimaryWidgetType(type: WidgetType): boolean {
  return PRIMARY_WIDGET_TYPES.includes(type)
}

/** Binding slots and guidance for the widget config panel. */
export function bindingSlotsForWidget(type: WidgetType): BindingSlot[] {
  switch (type) {
    case 'text':
    case 'table':
      return []
    case 'kpi':
    case 'gauge':
      return [
        {
          key: 'yKey',
          label: 'Measure',
          hint: 'One numeric result field from the query.',
          required: true,
        },
      ]
    case 'pie':
    case 'donut':
    case 'funnel':
    case 'treemap':
    case 'sunburst':
      return [
        {
          key: 'xKey',
          label: 'Category',
          hint: 'Slice / segment label (usually a group-by field).',
          required: true,
        },
        {
          key: 'yKey',
          label: 'Value',
          hint: 'Numeric measure for each slice.',
          required: true,
        },
      ]
    case 'line':
    case 'area':
    case 'stacked_area':
      return [
        {
          key: 'xKey',
          label: 'Time / axis',
          hint: 'Prefer a date grain or ordered dimension.',
          required: true,
        },
        {
          key: 'yKey',
          label: 'Measure',
          hint: 'Numeric series value.',
          required: true,
        },
      ]
    case 'scatter':
    case 'bubble':
      return [
        {
          key: 'xKey',
          label: 'X measure',
          hint: 'Numeric field for the horizontal axis.',
          required: true,
        },
        {
          key: 'yKey',
          label: 'Y measure',
          hint: 'Numeric field for the vertical axis.',
          required: true,
        },
      ]
    default:
      return [
        {
          key: 'xKey',
          label: 'Dimension',
          hint: 'Category or group-by field on the axis.',
          required: false,
        },
        {
          key: 'yKey',
          label: 'Measure',
          hint: 'Numeric aggregation alias from the query.',
          required: false,
        },
      ]
  }
}

export function bindingChecklistMessage(
  type: WidgetType,
  hasQuery: boolean,
  bindings: { xKey?: string; yKey?: string } | undefined,
): string | null {
  if (type === 'text') return null
  if (!hasQuery) return 'Select or create a query.'
  const slots = bindingSlotsForWidget(type)
  const missing = slots.filter((s) => {
    if (!s.required) return false
    const v = s.key === 'xKey' ? bindings?.xKey : bindings?.yKey
    return !v
  })
  if (type === 'table') return null
  if (missing.length === 0) return null
  return `Still needed: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.`
}
