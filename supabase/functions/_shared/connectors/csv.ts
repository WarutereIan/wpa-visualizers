import type { ConnectorAdapter, ConnectorContext, DataRow } from './types.ts'

/** Direct row payload (Excel/CSV upload parsed client-side or inline). */
export const csvAdapter: ConnectorAdapter = {
  async fetchRows(ctx: ConnectorContext): Promise<DataRow[]> {
    const raw = ctx.credentials.__rows
    if (!raw) throw new Error('CSV connector requires inline rows payload')
    const parsed = JSON.parse(raw) as DataRow[]
    if (!Array.isArray(parsed)) throw new Error('Invalid rows payload')
    return parsed
  },
}
