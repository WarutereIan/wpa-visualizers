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

async function fetchDataverseToken(credentials: Record<string, string>): Promise<string> {
  const mode = credentials.authMode ?? 'bearer'
  if (mode === 'bearer') {
    const token = credentials.token?.trim()
    if (!token) throw new Error('Dynamics 365 bearer token required')
    return token
  }

  const tenant = credentials.tenantId?.trim()
  const clientId = credentials.clientId?.trim()
  const clientSecret = credentials.clientSecret?.trim()
  const scope = credentials.scope?.trim()
  if (!tenant || !clientId || !clientSecret || !scope) {
    throw new Error('Dynamics 365 OAuth credentials incomplete')
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  })
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = (await res.json()) as { access_token?: string; error_description?: string }
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description ?? `Failed to obtain Dataverse token (${res.status})`)
  }
  return json.access_token
}

async function fetchDataversePages(
  startUrl: string,
  accessToken: string,
  maxPages = 500,
): Promise<DataRow[]> {
  const out: DataRow[] = []
  let url: string | null = startUrl
  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'OData-Version': '4.0',
        'OData-MaxVersion': '4.0',
        Prefer: 'odata.maxpagesize=500',
      },
    })
    if (!res.ok) throw new Error(`Dataverse request failed (${res.status})`)
    const json = (await res.json()) as Record<string, unknown>
    const current = Array.isArray(json.value) ? json.value : []
    out.push(...current.map((x) => normalizeRow((x ?? {}) as Record<string, unknown>)))
    const next = json['@odata.nextLink']
    url = typeof next === 'string' && next.length > 0 ? next : null
  }
  return out
}

export const dynamics365Adapter: ConnectorAdapter = {
  async fetchRows(ctx: ConnectorContext): Promise<DataRow[]> {
    if (!ctx.endpointUrl) throw new Error('Dynamics 365 connector requires endpoint_url')
    const token = await fetchDataverseToken(ctx.credentials)
    return fetchDataversePages(ctx.endpointUrl, token)
  },
}
