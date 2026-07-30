import type { DataPrimitive, DataRow, DataTable } from '#/types/data'
import { slugAlias } from '#/lib/slugAlias'

export type QueryJoinType = 'inner' | 'left'

export interface QueryJoin {
  id: string
  tableId: string
  type: QueryJoinType
  leftColumn: string
  rightColumn: string
  /** Prefix for joined columns; defaults to slug of table name. */
  alias?: string
}

function prefixRow(row: DataRow, prefix: string): DataRow {
  const out: DataRow = {}
  for (const [k, v] of Object.entries(row)) {
    out[`${prefix}__${k}`] = v
  }
  return out
}

/**
 * Join `right` onto `leftRows` (already maybe multi-table).
 * Left columns stay as-is; right columns are prefixed `alias__col`.
 */
export function joinTables(
  leftRows: DataRow[],
  right: DataTable,
  join: Pick<QueryJoin, 'type' | 'leftColumn' | 'rightColumn' | 'alias'>,
): DataRow[] {
  const alias = slugAlias(join.alias || right.name) || 'joined'
  const out: DataRow[] = []

  for (const left of leftRows) {
    const key = left[join.leftColumn]
    const matches = right.rows.filter((r) => String(r[join.rightColumn] ?? '') === String(key ?? ''))
    if (matches.length === 0) {
      if (join.type === 'left') {
        const nullRight: DataRow = {}
        for (const c of right.columns) {
          nullRight[`${alias}__${c.name}`] = null
        }
        out.push({ ...left, ...nullRight })
      }
      continue
    }
    for (const m of matches) {
      out.push({ ...left, ...prefixRow(m, alias) })
    }
  }
  return out
}

/** Resolve primary + joins into a virtual table for the rest of the pipeline. */
export function materializeJoinedTable(
  primary: DataTable,
  joins: QueryJoin[] | undefined,
  catalog: DataTable[],
): DataTable {
  if (!joins || joins.length === 0) return primary

  let rows = primary.rows
  const columns = [...primary.columns]

  for (const join of joins) {
    const right = catalog.find((t) => t.id === join.tableId)
    if (!right) throw new Error(`Joined table not found: ${join.tableId}`)
    const alias = slugAlias(join.alias || right.name) || 'joined'
    rows = joinTables(rows, right, { ...join, alias })
    for (const c of right.columns) {
      columns.push({ name: `${alias}__${c.name}`, type: c.type })
    }
  }

  return {
    id: primary.id,
    name: primary.name,
    columns,
    rows,
  }
}

export type { DataPrimitive }
