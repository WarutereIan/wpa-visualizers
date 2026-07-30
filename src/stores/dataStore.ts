import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runQueryDefinition } from '#/lib/queryEngine'
import { demoQueries, demoTables, inferColumnsFromRows } from '#/lib/demoSeed'
import { defaultAggregationAlias } from '#/lib/aggregationRules'
import { isSupabaseConfigured } from '#/lib/env'
import type {
  AggregationOperator,
  DataColumnType,
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
  removeTable: (tableId: string) => void
  updateColumnType: (tableId: string, columnName: string, type: DataColumnType) => void
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
        return runQueryDefinition(table, query, get().tables)
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
        const columns = inferColumnsFromRows(rows)
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

      removeTable: (tableId) => {
        set((s) => ({
          tables: s.tables.filter((t) => t.id !== tableId),
          // Drop queries that referenced the deleted table so the builder
          // never shows a query bound to a missing source.
          queries: s.queries.filter((q) => q.tableId !== tableId),
          version: s.version + 1,
        }))
      },

      updateColumnType: (tableId, columnName, type) => {
        set((s) => ({
          tables: s.tables.map((t) =>
            t.id !== tableId
              ? t
              : {
                  ...t,
                  columns: t.columns.map((c) =>
                    c.name === columnName ? { ...c, type } : c,
                  ),
                },
          ),
          version: s.version + 1,
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: isSupabaseConfigured(),
    },
  ),
)

export { demoTables, demoQueries }

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

export function createDefaultAggregation(
  column = '',
  columnType?: DataColumnType,
): QueryAggregation {
  const operator: AggregationOperator =
    columnType && columnType !== 'number' ? 'count' : 'sum'
  return {
    id: id('agg'),
    operator,
    column,
    alias: defaultAggregationAlias(operator, column || 'value'),
  }
}

