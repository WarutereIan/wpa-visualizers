import type { DataRow, DataTable, QueryDefinition } from '#/types/data'
import { runQueryDefinition } from '#/lib/queryEngine'
import { queryResultColumns } from '#/lib/queryResultColumns'

/**
 * Run a query definition against an in-memory table for live preview.
 * Uses the draft query object (not a stale store lookup by id).
 */
export function previewQueryRows(
  table: DataTable | undefined,
  query: QueryDefinition,
  catalog: DataTable[] = [],
): { rows: DataRow[]; error: string | null; expectedColumns: string[] } {
  const expectedColumns = queryResultColumns(query)
  if (!table) {
    return { rows: [], error: 'No source table', expectedColumns }
  }
  try {
    const rows = runQueryDefinition(table, query, catalog.length ? catalog : [table])
    return { rows, error: null, expectedColumns }
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : 'Query failed',
      expectedColumns,
    }
  }
}
