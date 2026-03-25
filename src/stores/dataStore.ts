import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runQueryDefinition } from '#/lib/queryEngine'
import type {
  AggregationOperator,
  DataFilter,
  DataFilterOperator,
  DataRow,
  DataTable,
  QueryAggregation,
  QueryDefinition,
} from '#/types/data'

const STORAGE_KEY = 'wpa-data-layer-v3'

function nowIso() {
  return new Date().toISOString()
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function demoTables(): DataTable[] {
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

function demoQueries(): QueryDefinition[] {
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

interface DataState {
  version: number
  tables: DataTable[]
  queries: QueryDefinition[]
  getTableById: (id: string) => DataTable | undefined
  getQueryById: (id: string) => QueryDefinition | undefined
  runQuery: (queryId: string) => DataRow[]
  createQuery: (input: Omit<QueryDefinition, 'id' | 'createdAt' | 'updatedAt'>) => QueryDefinition
  updateQuery: (id: string, patch: Partial<Omit<QueryDefinition, 'id' | 'createdAt'>>) => void
  removeQuery: (id: string) => void
  addFilter: (queryId: string) => void
  updateFilter: (queryId: string, filterId: string, patch: Partial<DataFilter>) => void
  removeFilter: (queryId: string, filterId: string) => void
  importTable: (input: {
    name: string
    rows: DataRow[]
    preferredId?: string
  }) => DataTable
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      version: 1,
      tables: demoTables(),
      queries: demoQueries(),

      getTableById: (tableId) => get().tables.find((t) => t.id === tableId),
      getQueryById: (queryId) => get().queries.find((q) => q.id === queryId),
      runQuery: (queryId) => {
        const query = get().queries.find((q) => q.id === queryId)
        if (!query) return []
        const table = get().tables.find((t) => t.id === query.tableId)
        if (!table) return []
        return runQueryDefinition(table, query)
      },

      createQuery: (input) => {
        const now = nowIso()
        const query: QueryDefinition = {
          id: id('qry'),
          ...input,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ queries: [...s.queries, query], version: s.version + 1 }))
        return query
      },

      updateQuery: (queryId, patch) => {
        set((s) => ({
          queries: s.queries.map((q) =>
            q.id === queryId ? { ...q, ...patch, updatedAt: nowIso() } : q,
          ),
          version: s.version + 1,
        }))
      },

      removeQuery: (queryId) => {
        set((s) => ({
          queries: s.queries.filter((q) => q.id !== queryId),
          version: s.version + 1,
        }))
      },

      addFilter: (queryId) => {
        const query = get().queries.find((q) => q.id === queryId)
        if (!query) return
        const defaultColumn = query.selectedColumns[0] ?? ''
        const filter: DataFilter = {
          id: id('flt'),
          column: defaultColumn,
          operator: 'eq',
          value: '',
        }
        set((s) => ({
          queries: s.queries.map((q) =>
            q.id === queryId ? { ...q, filters: [...q.filters, filter], updatedAt: nowIso() } : q,
          ),
          version: s.version + 1,
        }))
      },

      updateFilter: (queryId, filterId, patch) => {
        set((s) => ({
          queries: s.queries.map((q) =>
            q.id === queryId
              ? {
                  ...q,
                  updatedAt: nowIso(),
                  filters: q.filters.map((f) => (f.id === filterId ? { ...f, ...patch } : f)),
                }
              : q,
          ),
          version: s.version + 1,
        }))
      },

      removeFilter: (queryId, filterId) => {
        set((s) => ({
          queries: s.queries.map((q) =>
            q.id === queryId
              ? { ...q, filters: q.filters.filter((f) => f.id !== filterId), updatedAt: nowIso() }
              : q,
          ),
          version: s.version + 1,
        }))
      },
      importTable: ({ name, rows, preferredId }) => {
        const columns = inferColumns(rows)
        const tableId =
          preferredId?.trim() ||
          `tbl-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${crypto
            .randomUUID()
            .slice(0, 6)}`
        const table: DataTable = {
          id: tableId,
          name: name.trim() || 'Imported Table',
          columns,
          rows,
        }
        set((s) => ({
          tables: [table, ...s.tables.filter((t) => t.id !== tableId)],
          version: s.version + 1,
        }))
        return table
      },
    }),
    { name: STORAGE_KEY },
  ),
)

function inferColumns(rows: DataRow[]): DataTable['columns'] {
  const first = rows[0] ?? {}
  const keys = Object.keys(first)
  return keys.map((k) => {
    const sample = rows.find((r) => r[k] !== null && r[k] !== undefined)?.[k]
    const type = typeof sample
    return {
      name: k,
      type:
        type === 'number'
          ? 'number'
          : type === 'boolean'
            ? 'boolean'
            : ('string' as const),
    }
  })
}

export const FILTER_OPERATORS: { value: DataFilterOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'contains', label: 'contains' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
]

export const AGGREGATION_OPERATORS: { value: AggregationOperator; label: string }[] = [
  { value: 'sum', label: 'SUM' },
  { value: 'count', label: 'COUNT' },
  { value: 'avg', label: 'AVG' },
]

export function createDefaultAggregation(column = ''): QueryAggregation {
  return {
    id: id('agg'),
    operator: 'sum',
    column,
    alias: column ? `sum_${column}` : 'sum_value',
  }
}

