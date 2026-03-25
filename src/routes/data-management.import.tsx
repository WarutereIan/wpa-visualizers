import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '#/components/ui/button'
import { useDataStore } from '#/stores/dataStore'
import type { DataRow } from '#/types/data'

const ENV_KOBO_URL = import.meta.env.VITE_KOBO_DEFAULT_URL as string | undefined
const ENV_KOBO_TOKEN = import.meta.env.VITE_KOBO_TOKEN as string | undefined

export const Route = createFileRoute('/data-management/import')({
  component: DataImportPage,
})

function DataImportPage() {
  const importTable = useDataStore((s) => s.importTable)

  const [activeTab, setActiveTab] = useState<'kobo' | 'excel'>('kobo')

  const [koboUrl, setKoboUrl] = useState(ENV_KOBO_URL?.trim() ?? '')
  const [koboToken, setKoboToken] = useState(ENV_KOBO_TOKEN?.trim() ?? '')
  const [koboTableName, setKoboTableName] = useState('Kobo Import')
  const [koboBusy, setKoboBusy] = useState(false)
  const [koboMsg, setKoboMsg] = useState<string | null>(null)

  const [excelTableName, setExcelTableName] = useState('Excel Import')
  const [excelBusy, setExcelBusy] = useState(false)
  const [excelMsg, setExcelMsg] = useState<string | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)

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
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: null,
      }).map((r) => normalizeRow(r))
      if (rows.length === 0) throw new Error('No rows found in sheet.')
    /*   const table = importTable({
        name: excelTableName.trim() || file.name.replace(/\.[^.]+$/, ''),
        rows,
      })
      setExcelMsg(`Imported ${rows.length} rows into "${table.name}" (${table.id}).`) */
    } catch (err) {
      setExcelMsg(err instanceof Error ? err.message : 'Failed to import Excel file.')
    } finally {
      setExcelBusy(false)
    }
  }

  const runExcelImport = () => {
    if (excelFile) void importExcel(excelFile)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Data import</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Import Kobo and Excel datasets into Data Management tables for use in queries and widget
          bindings.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'kobo' ? 'default' : 'outline'}
            onClick={() => setActiveTab('kobo')}
          >
            Kobo
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'excel' ? 'default' : 'outline'}
            onClick={() => setActiveTab('excel')}
          >
            Excel
          </Button>
        </div>

        {activeTab === 'kobo' ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Kobo import</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Similar to the Kobo table flow: provide source endpoint + auth, fetch records, and
              register as a local data table.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">Kobo JSON endpoint URL</label>
                <input
                  value={koboUrl}
                  onChange={(e) => setKoboUrl(e.target.value)}
                  placeholder="https://kf.kobotoolbox.org/api/v2/assets/.../data/?format=json"
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Bearer token (optional)</label>
                <input
                  value={koboToken}
                  onChange={(e) => setKoboToken(e.target.value)}
                  placeholder="Token"
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Destination table name</label>
                <input
                  value={koboTableName}
                  onChange={(e) => setKoboTableName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                />
              </div>
            </div>
            <Button type="button" onClick={importFromKobo} disabled={koboBusy}>
              {koboBusy ? 'Importing...' : 'Import Kobo data'}
            </Button>
            {koboMsg && (
              <p
                className={`text-sm ${koboMsg.startsWith('Imported') ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {koboMsg}
              </p>
            )}
          </section>
        ) : (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Excel import</h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Upload `.xlsx`, `.xls`, or `.csv`. The first sheet is imported.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Destination table name</label>
                <input
                  value={excelTableName}
                  onChange={(e) => setExcelTableName(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--sea-ink)]">Excel file</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setExcelFile(file)
                    setExcelMsg(null)
                  }}
                  disabled={excelBusy}
                  className="mt-1 block w-full text-sm"
                />
              </div>
            </div>
            <Button type="button" onClick={runExcelImport} disabled={excelBusy || !excelFile}>
              {excelBusy ? 'Importing...' : 'Import file'}
            </Button>
            {excelMsg && (
              <p
                className={`text-sm ${excelMsg.startsWith('Imported') ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {excelMsg}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

/** Follows Kobo REST `next` links until all pages are loaded (max pages capped). */
async function fetchAllKoboPages(
  startUrl: string,
  headers: Record<string, string>,
  maxPages = 500,
): Promise<DataRow[]> {
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

function normalizeToRows(payload: unknown): DataRow[] {
  if (Array.isArray(payload)) {
    return payload.map((x) => normalizeRow(asRecord(x)))
  }
  if (payload && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>
    if (Array.isArray(rec.results)) {
      return rec.results.map((x) => normalizeRow(asRecord(x)))
    }
    if (Array.isArray(rec.data)) {
      return rec.data.map((x) => normalizeRow(asRecord(x)))
    }
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

