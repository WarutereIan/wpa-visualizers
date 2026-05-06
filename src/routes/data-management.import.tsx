import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '#/components/ui/button'
import { useDataStore } from '#/stores/dataStore'
import type { DataRow } from '#/types/data'

const ENV_KOBO_URL = import.meta.env.VITE_KOBO_DEFAULT_URL as string | undefined
const ENV_KOBO_TOKEN = import.meta.env.VITE_KOBO_TOKEN as string | undefined

const ENV_D365_URL = import.meta.env.VITE_DYNAMICS365_DEFAULT_URL as string | undefined
const ENV_D365_BEARER = import.meta.env.VITE_DYNAMICS365_BEARER_TOKEN as string | undefined
const ENV_D365_TENANT_ID = import.meta.env.VITE_DYNAMICS365_TENANT_ID as string | undefined
const ENV_D365_CLIENT_ID = import.meta.env.VITE_DYNAMICS365_CLIENT_ID as string | undefined
const ENV_D365_CLIENT_SECRET = import.meta.env.VITE_DYNAMICS365_CLIENT_SECRET as string | undefined
const ENV_D365_SCOPE = import.meta.env.VITE_DYNAMICS365_SCOPE as string | undefined

const ENV_SURVEYCTO_URL = import.meta.env.VITE_SURVEYCTO_DEFAULT_URL as string | undefined
const ENV_SURVEYCTO_USERNAME = import.meta.env.VITE_SURVEYCTO_USERNAME as string | undefined
const ENV_SURVEYCTO_PASSWORD = import.meta.env.VITE_SURVEYCTO_PASSWORD as string | undefined

export const Route = createFileRoute('/data-management/import')({
  component: DataImportPage,
})

function DataImportPage() {
  const importTable = useDataStore((s) => s.importTable)

  const [activeTab, setActiveTab] = useState<'kobo' | 'excel' | 'dynamics365' | 'surveycto'>('kobo')

  const [koboUrl, setKoboUrl] = useState(ENV_KOBO_URL?.trim() ?? '')
  const [koboToken, setKoboToken] = useState(ENV_KOBO_TOKEN?.trim() ?? '')
  const [koboTableName, setKoboTableName] = useState('Kobo Import')
  const [koboBusy, setKoboBusy] = useState(false)
  const [koboMsg, setKoboMsg] = useState<string | null>(null)

  const [excelTableName, setExcelTableName] = useState('Excel Import')
  const [excelBusy, setExcelBusy] = useState(false)
  const [excelMsg, setExcelMsg] = useState<string | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)

  const [dynamicsUrl, setDynamicsUrl] = useState(ENV_D365_URL?.trim() ?? '')
  const [dynamicsAuthMode, setDynamicsAuthMode] = useState<'bearer' | 'client_credentials'>('bearer')
  const [dynamicsToken, setDynamicsToken] = useState(ENV_D365_BEARER?.trim() ?? '')
  const [dynamicsTenantId, setDynamicsTenantId] = useState(ENV_D365_TENANT_ID?.trim() ?? '')
  const [dynamicsClientId, setDynamicsClientId] = useState(ENV_D365_CLIENT_ID?.trim() ?? '')
  const [dynamicsClientSecret, setDynamicsClientSecret] = useState(ENV_D365_CLIENT_SECRET?.trim() ?? '')
  const [dynamicsScope, setDynamicsScope] = useState(ENV_D365_SCOPE?.trim() ?? '')
  const [dynamicsTableName, setDynamicsTableName] = useState('Dynamics 365 Import')
  const [dynamicsBusy, setDynamicsBusy] = useState(false)
  const [dynamicsMsg, setDynamicsMsg] = useState<string | null>(null)

  const [surveyCtoUrl, setSurveyCtoUrl] = useState(ENV_SURVEYCTO_URL?.trim() ?? '')
  const [surveyCtoUsername, setSurveyCtoUsername] = useState(ENV_SURVEYCTO_USERNAME?.trim() ?? '')
  const [surveyCtoPassword, setSurveyCtoPassword] = useState(ENV_SURVEYCTO_PASSWORD?.trim() ?? '')
  const [surveyCtoPageSize, setSurveyCtoPageSize] = useState('500')
  const [surveyCtoTableName, setSurveyCtoTableName] = useState('SurveyCTO Import')
  const [surveyCtoBusy, setSurveyCtoBusy] = useState(false)
  const [surveyCtoMsg, setSurveyCtoMsg] = useState<string | null>(null)

  const importFromKobo = async () => {
    setKoboMsg(null)
    if (!koboUrl.trim()) {
      setKoboMsg('Please provide a Kobo JSON endpoint URL.')
      return
    }
    try {
      setKoboBusy(true)
      const headers: Record<string, string> = {}
      if (koboToken.trim()) headers.Authorization = `Bearer ${koboToken.trim()}`
      const rows = await fetchAllKoboPages(koboUrl.trim(), headers)
      if (rows.length === 0) throw new Error('No rows found in response.')
      const table = importTable({
        name: koboTableName.trim() || 'Kobo Import',
        rows,
      })
      setKoboMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`)
    } catch (err) {
      setKoboMsg(err instanceof Error ? err.message : 'Failed to import Kobo data.')
    } finally {
      setKoboBusy(false)
    }
  }

  const importExcel = async (file: File) => {
    setExcelMsg(null)
    try {
      setExcelBusy(true)
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const firstSheet = wb.SheetNames[0]
      if (!firstSheet) throw new Error('Workbook has no sheets.')
      const ws = wb.Sheets[firstSheet]
      const rows = XLSX.utils
        .sheet_to_json<Record<string, unknown>>(ws, {
          defval: null,
        })
        .map((r) => normalizeRow(r))
      if (rows.length === 0) throw new Error('No rows found in sheet.')
      const table = importTable({
        name: excelTableName.trim() || file.name.replace(/\.[^.]+$/, ''),
        rows,
      })
      setExcelMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`)
    } catch (err) {
      setExcelMsg(err instanceof Error ? err.message : 'Failed to import Excel file.')
    } finally {
      setExcelBusy(false)
    }
  }

  const runExcelImport = () => {
    if (excelFile) void importExcel(excelFile)
  }

  const importDynamics = async () => {
    setDynamicsMsg(null)
    if (!dynamicsUrl.trim()) {
      setDynamicsMsg('Please provide a Dataverse entity endpoint URL.')
      return
    }
    try {
      setDynamicsBusy(true)
      let token = dynamicsToken.trim()
      if (dynamicsAuthMode === 'client_credentials') {
        token = await fetchDataverseAccessToken({
          tenantId: dynamicsTenantId,
          clientId: dynamicsClientId,
          clientSecret: dynamicsClientSecret,
          scope: dynamicsScope || buildDefaultDataverseScope(dynamicsUrl),
        })
      } else if (!token) {
        throw new Error('Provide a Dataverse bearer token, or switch to OAuth client credentials.')
      }
      const rows = await fetchDataversePages(dynamicsUrl.trim(), token)
      if (rows.length === 0) throw new Error('No rows found in response.')
      const table = importTable({
        name: dynamicsTableName.trim() || 'Dynamics 365 Import',
        rows,
      })
      setDynamicsMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`)
    } catch (err) {
      setDynamicsMsg(err instanceof Error ? err.message : 'Failed to import Dynamics 365 data.')
    } finally {
      setDynamicsBusy(false)
    }
  }

  const importSurveyCto = async () => {
    setSurveyCtoMsg(null)
    if (!surveyCtoUrl.trim()) {
      setSurveyCtoMsg('Please provide a SurveyCTO API endpoint URL.')
      return
    }
    if (!surveyCtoUsername.trim() || !surveyCtoPassword.trim()) {
      setSurveyCtoMsg('SurveyCTO uses HTTP Basic Auth. Provide username and password.')
      return
    }
    try {
      setSurveyCtoBusy(true)
      const rows = await fetchSurveyCtoPages(
        surveyCtoUrl.trim(),
        surveyCtoUsername.trim(),
        surveyCtoPassword,
        Number(surveyCtoPageSize) || 500,
      )
      if (rows.length === 0) throw new Error('No rows found in response.')
      const table = importTable({
        name: surveyCtoTableName.trim() || 'SurveyCTO Import',
        rows,
      })
      setSurveyCtoMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`)
    } catch (err) {
      setSurveyCtoMsg(err instanceof Error ? err.message : 'Failed to import SurveyCTO data.')
    } finally {
      setSurveyCtoBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Data import</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Import Kobo, Excel, Microsoft Dynamics 365, and SurveyCTO datasets into Data Management
          tables for use in queries and widget bindings.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          <Button type="button" size="sm" variant={activeTab === 'kobo' ? 'default' : 'outline'} onClick={() => setActiveTab('kobo')}>
            Kobo
          </Button>
          <Button type="button" size="sm" variant={activeTab === 'excel' ? 'default' : 'outline'} onClick={() => setActiveTab('excel')}>
            Excel
          </Button>
          <Button type="button" size="sm" variant={activeTab === 'dynamics365' ? 'default' : 'outline'} onClick={() => setActiveTab('dynamics365')}>
            Microsoft Dynamics 365
          </Button>
          <Button type="button" size="sm" variant={activeTab === 'surveycto' ? 'default' : 'outline'} onClick={() => setActiveTab('surveycto')}>
            SurveyCTO
          </Button>
        </div>

        {activeTab === 'kobo' ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Kobo import</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Provide source endpoint + auth, fetch records, and register as a local data table.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">Kobo JSON endpoint URL</label>
                <input value={koboUrl} onChange={(e) => setKoboUrl(e.target.value)} placeholder="https://kf.kobotoolbox.org/api/v2/assets/.../data/?format=json" className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Bearer token (optional)</label>
                <input value={koboToken} onChange={(e) => setKoboToken(e.target.value)} placeholder="Token" className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Destination table name</label>
                <input value={koboTableName} onChange={(e) => setKoboTableName(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
            </div>
            <Button type="button" onClick={importFromKobo} disabled={koboBusy}>{koboBusy ? 'Importing...' : 'Import Kobo data'}</Button>
            {koboMsg && <p className={`text-sm ${koboMsg.startsWith('Imported') ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{koboMsg}</p>}
          </section>
        ) : activeTab === 'excel' ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Excel import</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">Upload `.xlsx`, `.xls`, or `.csv`. The first sheet is imported.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Destination table name</label>
                <input value={excelTableName} onChange={(e) => setExcelTableName(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Excel file</label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { setExcelFile(e.target.files?.[0] ?? null); setExcelMsg(null) }} disabled={excelBusy} className="mt-1 block w-full text-sm" />
              </div>
            </div>
            <Button type="button" onClick={runExcelImport} disabled={excelBusy || !excelFile}>{excelBusy ? 'Importing...' : 'Import file'}</Button>
            {excelMsg && <p className={`text-sm ${excelMsg.startsWith('Imported') ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{excelMsg}</p>}
          </section>
        ) : activeTab === 'dynamics365' ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Microsoft Dynamics 365 import</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Real Dataverse flow: OAuth2 bearer token + OData endpoint (`value` rows, `@odata.nextLink`
              paging).
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">Dataverse endpoint URL</label>
                <input value={dynamicsUrl} onChange={(e) => setDynamicsUrl(e.target.value)} placeholder="https://your-org.crm.dynamics.com/api/data/v9.2/accounts?$select=name,accountid" className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Auth mode</label>
                <select value={dynamicsAuthMode} onChange={(e) => setDynamicsAuthMode(e.target.value as 'bearer' | 'client_credentials')} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm">
                  <option value="bearer">Use existing bearer token</option>
                  <option value="client_credentials">OAuth client credentials</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Destination table name</label>
                <input value={dynamicsTableName} onChange={(e) => setDynamicsTableName(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              {dynamicsAuthMode === 'bearer' ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[var(--sea-ink)]">Bearer token</label>
                  <input value={dynamicsToken} onChange={(e) => setDynamicsToken(e.target.value)} placeholder="eyJ..." className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-[var(--sea-ink)]">Tenant ID</label>
                    <input value={dynamicsTenantId} onChange={(e) => setDynamicsTenantId(e.target.value)} placeholder="contoso.onmicrosoft.com or GUID" className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--sea-ink)]">Client ID</label>
                    <input value={dynamicsClientId} onChange={(e) => setDynamicsClientId(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--sea-ink)]">Client secret</label>
                    <input type="password" value={dynamicsClientSecret} onChange={(e) => setDynamicsClientSecret(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--sea-ink)]">Scope</label>
                    <input value={dynamicsScope} onChange={(e) => setDynamicsScope(e.target.value)} placeholder="https://your-org.crm.dynamics.com/.default" className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Client credentials in browser are for demo only. In production, perform token exchange on a
              backend service.
            </p>
            <Button type="button" onClick={importDynamics} disabled={dynamicsBusy}>{dynamicsBusy ? 'Importing...' : 'Import Dynamics 365 data'}</Button>
            {dynamicsMsg && <p className={`text-sm ${dynamicsMsg.startsWith('Imported') ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{dynamicsMsg}</p>}
          </section>
        ) : (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">SurveyCTO import</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Real SurveyCTO flow: HTTP Basic Authentication (`username:password`) with cursor paging on
              API v2 datasets.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">SurveyCTO API endpoint URL</label>
                <input value={surveyCtoUrl} onChange={(e) => setSurveyCtoUrl(e.target.value)} placeholder="https://your-server.surveycto.com/api/v2/datasets/cases/records" className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Username</label>
                <input value={surveyCtoUsername} onChange={(e) => setSurveyCtoUsername(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Password</label>
                <input type="password" value={surveyCtoPassword} onChange={(e) => setSurveyCtoPassword(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Page size (1-1000)</label>
                <input type="number" min={1} max={1000} value={surveyCtoPageSize} onChange={(e) => setSurveyCtoPageSize(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Destination table name</label>
                <input value={surveyCtoTableName} onChange={(e) => setSurveyCtoTableName(e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
              </div>
            </div>
            <Button type="button" onClick={importSurveyCto} disabled={surveyCtoBusy}>{surveyCtoBusy ? 'Importing...' : 'Import SurveyCTO data'}</Button>
            {surveyCtoMsg && <p className={`text-sm ${surveyCtoMsg.startsWith('Imported') ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{surveyCtoMsg}</p>}
          </section>
        )}
      </div>
    </div>
  )
}

async function fetchAllKoboPages(startUrl: string, headers: Record<string, string>, maxPages = 500): Promise<DataRow[]> {
  const out: DataRow[] = []
  let url: string | null = startUrl
  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    const json: unknown = await res.json()
    out.push(...normalizeToRows(json))
    let next: string | null = null
    if (json && typeof json === 'object' && 'next' in json) {
      const n = (json as { next?: unknown }).next
      next = typeof n === 'string' && n.length > 0 ? n : null
    }
    url = next
  }
  return out
}

type DataverseTokenInput = {
  tenantId: string
  clientId: string
  clientSecret: string
  scope: string
}

async function fetchDataverseAccessToken(args: DataverseTokenInput): Promise<string> {
  const tenant = args.tenantId.trim()
  const clientId = args.clientId.trim()
  const clientSecret = args.clientSecret.trim()
  const scope = args.scope.trim()
  if (!tenant || !clientId || !clientSecret || !scope) {
    throw new Error('For OAuth mode, tenant ID, client ID, client secret, and scope are required.')
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
    throw new Error(json.error_description || `Failed to obtain Dataverse token (${res.status}).`)
  }
  return json.access_token
}

function buildDefaultDataverseScope(endpointUrl: string): string {
  try {
    const origin = new URL(endpointUrl).origin
    return `${origin}/.default`
  } catch {
    return ''
  }
}

async function fetchDataversePages(startUrl: string, accessToken: string, maxPages = 500): Promise<DataRow[]> {
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
    out.push(...current.map((x) => normalizeRow(asRecord(x))))
    const next = json['@odata.nextLink']
    url = typeof next === 'string' && next.length > 0 ? next : null
  }
  return out
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
      headers: {
        Authorization: auth,
        Accept: 'application/json',
      },
    })
    if (!res.ok) throw new Error(`SurveyCTO request failed (${res.status})`)
    const json: unknown = await res.json()
    const rows = normalizeToRows(json)
    out.push(...rows)

    if (json && typeof json === 'object' && 'nextCursor' in json) {
      const nextCursor = (json as { nextCursor?: unknown }).nextCursor
      cursor = typeof nextCursor === 'string' && nextCursor.length > 0 ? nextCursor : null
      if (!cursor) break
      page++
      continue
    }
    // Endpoints like /forms/data/wide/json/{formId} return a plain array.
    break
  }
  return out
}

function normalizeToRows(payload: unknown): DataRow[] {
  if (Array.isArray(payload)) {
    return payload.map((x) => normalizeRow(asRecord(x)))
  }
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>
    if (Array.isArray(rec.value)) return rec.value.map((x) => normalizeRow(asRecord(x)))
    if (Array.isArray(rec.results)) return rec.results.map((x) => normalizeRow(asRecord(x)))
    if (Array.isArray(rec.data)) return rec.data.map((x) => normalizeRow(asRecord(x)))
  }
  return []
}

function asRecord(v: unknown): Record<string, unknown> {
  return (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
}

function normalizeRow(input: Record<string, unknown>): DataRow {
  const out: DataRow = {}
  Object.entries(input).forEach(([k, v]) => {
    if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v
    } else {
      out[k] = JSON.stringify(v)
    }
  })
  return out
}
