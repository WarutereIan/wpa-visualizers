import type { DataRow } from '../_shared/types.ts'

export function inferColumnsFromRows(rows: DataRow[]) {
  const first = rows[0] ?? {}
  return Object.keys(first).map((name) => {
    const sample = rows.find((r) => r[name] !== null && r[name] !== undefined)?.[name]
    const type = typeof sample
    return {
      name,
      type: type === 'number' ? 'number' : type === 'boolean' ? 'boolean' : 'string',
    }
  })
}
