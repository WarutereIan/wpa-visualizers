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

function normalizeToRows(payload: unknown): DataRow[] {
  if (Array.isArray(payload)) {
    return payload.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>))
  }
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>
    if (Array.isArray(rec.value)) return rec.value.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>))
    if (Array.isArray(rec.results)) return rec.results.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>))
    if (Array.isArray(rec.data)) return rec.data.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>))
  }
  return []
}

async function fetchSurveyCtoPages(
  startUrl: string,
  username: string,
  password: string,
  pageSize = 500,
  maxPages = 500,
): Promise<DataRow[]> {
  const out: DataRow[] = []
  const auth = `Basic ${btoa(`${username}:${password}`)}`
  let page = 0
  let cursor: string | null = null

  while (page < maxPages) {
    const u = new URL(startUrl)
    if (!u.searchParams.has('limit')) {
      u.searchParams.set('limit', String(Math.max(1, Math.min(1000, pageSize))))
    }
    if (cursor) u.searchParams.set('cursor', cursor)

    const res = await fetch(u.toString(), {
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`SurveyCTO request failed (${res.status})`)

    const json: unknown = await res.json()
    out.push(...normalizeToRows(json))

    if (json && typeof json === 'object' && 'nextCursor' in json) {
      const nextCursor = (json as { nextCursor?: unknown }).nextCursor
      cursor = typeof nextCursor === 'string' && nextCursor.length > 0 ? nextCursor : null
      if (!cursor) break
      page++
      continue
    }
    break
  }
  return out
}

export const surveyctoAdapter: ConnectorAdapter = {
  async fetchRows(ctx: ConnectorContext): Promise<DataRow[]> {
    if (!ctx.endpointUrl) throw new Error('SurveyCTO connector requires endpoint_url')
    const username = ctx.credentials.username?.trim()
    const password = ctx.credentials.password ?? ''
    if (!username || !password) {
      throw new Error('SurveyCTO requires username and password (HTTP Basic Auth)')
    }
    const pageSize = Number(ctx.credentials.pageSize ?? '500')
    return fetchSurveyCtoPages(ctx.endpointUrl, username, password, pageSize)
  },
}
