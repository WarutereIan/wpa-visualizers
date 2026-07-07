import type { ConnectorAdapter, ConnectorContext, DataRow } from './types.ts'

function normalizeRow(input: Record<string, unknown>): DataRow {
  const out: DataRow = {}
  for (const [k, v] of Object.entries(input)) {
    if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v
    } else {
      out[k] = JSON.stringify(v)
    }
  }
  return out
}

async function fetchAllKoboPages(startUrl: string, headers: Record<string, string>, maxPages = 500): Promise<DataRow[]> {
  const out: DataRow[] = []
  let url: string | null = startUrl
  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`Kobo request failed (${res.status})`)
    const json: unknown = await res.json()
    if (Array.isArray(json)) {
      out.push(...json.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>)))
    } else if (json && typeof json === 'object') {
      const rec = json as Record<string, unknown>
      const list = Array.isArray(rec.results) ? rec.results : Array.isArray(rec.data) ? rec.data : []
      out.push(...list.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>)))
      const next = rec.next
      url = typeof next === 'string' && next.length > 0 ? next : null
      continue
    }
    break
  }
  return out
}

export const koboAdapter: ConnectorAdapter = {
  async fetchRows(ctx: ConnectorContext): Promise<DataRow[]> {
    if (!ctx.endpointUrl) throw new Error('Kobo connector requires endpoint_url')
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (ctx.credentials.token) headers.Authorization = `Bearer ${ctx.credentials.token}`
    return fetchAllKoboPages(ctx.endpointUrl, headers)
  },
}
