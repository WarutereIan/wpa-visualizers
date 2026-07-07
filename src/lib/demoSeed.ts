import type { DataRow, DataTable, QueryDefinition } from '#/types/data'

function nowIso() {
  return new Date().toISOString()
}

export function demoTables(): DataTable[] {
  return [
    {
      id: 'tbl-households',
      name: 'Households',
      columns: [
        { name: 'district', type: 'string' },
        { name: 'program', type: 'string' },
        { name: 'month', type: 'string' },
        { name: 'beneficiaries', type: 'number' },
        { name: 'budget_usd', type: 'number' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
      ],
      rows: [
        {
          district: 'North',
          program: 'Meals',
          month: 'Jan',
          beneficiaries: 1200,
          budget_usd: 18000,
          latitude: 37.27,
          longitude: 9.87,
        },
        {
          district: 'North',
          program: 'Meals',
          month: 'Feb',
          beneficiaries: 1300,
          budget_usd: 19200,
          latitude: 37.31,
          longitude: 10.05,
        },
        {
          district: 'South',
          program: 'Meals',
          month: 'Jan',
          beneficiaries: 900,
          budget_usd: 14200,
          latitude: 33.92,
          longitude: 9.48,
        },
        {
          district: 'East',
          program: 'Cash',
          month: 'Jan',
          beneficiaries: 1500,
          budget_usd: 32000,
          latitude: 36.85,
          longitude: 10.42,
        },
        {
          district: 'West',
          program: 'Cash',
          month: 'Feb',
          beneficiaries: 1700,
          budget_usd: 35500,
          latitude: 36.42,
          longitude: 8.83,
        },
        {
          district: 'South',
          program: 'Voucher',
          month: 'Mar',
          beneficiaries: 800,
          budget_usd: 12100,
          latitude: 34.12,
          longitude: 9.56,
        },
      ],
    },
    {
      id: 'tbl-indicators',
      name: 'Indicators',
      columns: [
        { name: 'indicator', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'value', type: 'number' },
        { name: 'target', type: 'number' },
        { name: 'period', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
      ],
      rows: [
        {
          indicator: 'Coverage',
          location: 'North',
          value: 68,
          target: 75,
          period: '2026-Q1',
          latitude: 37.22,
          longitude: 9.95,
        },
        {
          indicator: 'Coverage',
          location: 'South',
          value: 61,
          target: 75,
          period: '2026-Q1',
          latitude: 33.98,
          longitude: 9.41,
        },
        {
          indicator: 'Timeliness',
          location: 'North',
          value: 82,
          target: 85,
          period: '2026-Q1',
          latitude: 37.18,
          longitude: 10.11,
        },
        {
          indicator: 'Timeliness',
          location: 'South',
          value: 79,
          target: 85,
          period: '2026-Q1',
          latitude: 34.05,
          longitude: 9.62,
        },
        {
          indicator: 'Satisfaction',
          location: 'East',
          value: 74,
          target: 80,
          period: '2026-Q1',
          latitude: 36.78,
          longitude: 10.38,
        },
      ],
    },
  ]
}

export function demoQueries(): QueryDefinition[] {
  const now = nowIso()
  return [
    {
      id: 'qry-households-beneficiaries',
      name: 'Households by district',
      tableId: 'tbl-households',
      selectedColumns: ['district', 'beneficiaries'],
      filters: [],
      groupBy: ['district'],
      aggregations: [
        {
          id: 'agg-1',
          operator: 'sum',
          column: 'beneficiaries',
          alias: 'beneficiaries',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'qry-indicator-values',
      name: 'Indicator values',
      tableId: 'tbl-indicators',
      selectedColumns: ['indicator', 'value'],
      filters: [],
      groupBy: ['indicator'],
      aggregations: [
        {
          id: 'agg-2',
          operator: 'avg',
          column: 'value',
          alias: 'value',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export function inferColumnsFromRows(rows: DataRow[]): DataTable['columns'] {
  const first = rows[0] ?? {}
  const keys = Object.keys(first)
  return keys.map((k) => {
    const sample = rows.find((r) => r[k] !== null && r[k] !== undefined)?.[k]
    const type = typeof sample
    return {
      name: k,
      type:
        type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : ('string' as const),
    }
  })
}
