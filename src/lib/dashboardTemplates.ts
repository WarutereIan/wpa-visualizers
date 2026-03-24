import type { DashboardDefinition, WidgetConfig } from '#/types/dashboard'
import type { Layout } from 'react-grid-layout'

export type DashboardTemplateId = 'blank' | 'sample' | 'kpi_row' | 'analytics'

export interface DashboardTemplateMeta {
  id: DashboardTemplateId
  name: string
  description: string
}

export const DASHBOARD_TEMPLATE_LIST: DashboardTemplateMeta[] = [
  {
    id: 'blank',
    name: 'Blank canvas',
    description: 'Start empty and add widgets from the palette.',
  },
  {
    id: 'sample',
    name: 'Sample mix',
    description: 'KPI card plus bar chart with demo data — good for a quick tour.',
  },
  {
    id: 'kpi_row',
    name: 'KPI row',
    description: 'Three KPI cards in a row for headline numbers.',
  },
  {
    id: 'analytics',
    name: 'Analytics pack',
    description: 'Bar chart, line chart, and a data table.',
  },
]

export function getLayoutWidgetsForTemplate(
  id: DashboardTemplateId,
): Pick<DashboardDefinition, 'layout' | 'widgets'> {
  switch (id) {
    case 'blank':
      return { layout: [], widgets: {} }
    case 'sample':
      return sampleMix()
    case 'kpi_row':
      return kpiRow()
    case 'analytics':
      return analyticsPack()
    default:
      return { layout: [], widgets: {} }
  }
}

function sampleMix(): Pick<DashboardDefinition, 'layout' | 'widgets'> {
  const widgets: Record<string, WidgetConfig> = {
    'kpi-1': {
      id: 'kpi-1',
      type: 'kpi',
      title: 'Headline KPI',
      dataSourceId: 'qry-households-beneficiaries',
      bindings: { xKey: 'district', yKey: 'beneficiaries' },
    },
    'chart-1': {
      id: 'chart-1',
      type: 'bar',
      title: 'Values by category',
      dataSourceId: 'qry-households-beneficiaries',
      bindings: { xKey: 'district', yKey: 'beneficiaries' },
    },
  }
  const layout: Layout = [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'chart-1', x: 3, y: 0, w: 9, h: 8, minW: 3, minH: 3 },
  ]
  return { layout, widgets }
}

function kpiRow(): Pick<DashboardDefinition, 'layout' | 'widgets'> {
  const widgets: Record<string, WidgetConfig> = {
    k1: {
      id: 'k1',
      type: 'kpi',
      title: 'Indicator A',
      dataSourceId: 'qry-indicator-values',
      bindings: { xKey: 'indicator', yKey: 'value' },
    },
    k2: {
      id: 'k2',
      type: 'kpi',
      title: 'Indicator B',
      dataSourceId: 'qry-indicator-values',
      bindings: { xKey: 'indicator', yKey: 'value' },
    },
    k3: {
      id: 'k3',
      type: 'kpi',
      title: 'Indicator C',
      dataSourceId: 'qry-indicator-values',
      bindings: { xKey: 'indicator', yKey: 'value' },
    },
  }
  const layout: Layout = [
    { i: 'k1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'k2', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
    { i: 'k3', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
  ]
  return { layout, widgets }
}

function analyticsPack(): Pick<DashboardDefinition, 'layout' | 'widgets'> {
  const widgets: Record<string, WidgetConfig> = {
    b1: {
      id: 'b1',
      type: 'bar',
      title: 'Bar trend',
      dataSourceId: 'qry-households-beneficiaries',
      bindings: { xKey: 'district', yKey: 'beneficiaries' },
    },
    l1: {
      id: 'l1',
      type: 'line',
      title: 'Line trend',
      dataSourceId: 'qry-indicator-values',
      bindings: { xKey: 'indicator', yKey: 'value' },
    },
    t1: { id: 't1', type: 'table', title: 'Data preview', dataSourceId: 'qry-households-beneficiaries' },
  }
  const layout: Layout = [
    { i: 'b1', x: 0, y: 0, w: 6, h: 7, minW: 3, minH: 3 },
    { i: 'l1', x: 6, y: 0, w: 6, h: 7, minW: 3, minH: 3 },
    { i: 't1', x: 0, y: 7, w: 12, h: 6, minW: 4, minH: 3 },
  ]
  return { layout, widgets }
}
