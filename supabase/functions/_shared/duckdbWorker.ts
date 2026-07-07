import type { CompiledQuery } from './queryCompiler.ts'

export function parquetStoragePath(orgId: string, tableId: string, batch = 0): string {
  return `orgs/${orgId}/tables/${tableId}/data/batch_${batch}.parquet`
}

export async function callDuckdbWorker<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const base = Deno.env.get('DUCKDB_WORKER_URL')
  if (!base) throw new Error('DUCKDB_WORKER_URL not configured')

  const secret = Deno.env.get('DUCKDB_WORKER_SECRET') ?? ''
  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'X-Worker-Secret': secret } : {}),
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Worker error ${res.status}`)
  return data as T
}

export async function runParquetCompiledQuery(
  admin: { storage: { from: (b: string) => { createSignedUrl: (p: string, s: number) => Promise<{ data: { signedUrl: string } | null }> } } },
  orgId: string,
  tableId: string,
  compiled: CompiledQuery,
  bucket = 'dimes-data',
): Promise<Record<string, unknown>[]> {
  const path = parquetStoragePath(orgId, tableId)
  const { data: signed } = await admin.storage.from(bucket).createSignedUrl(path, 3600)
  if (!signed?.signedUrl) throw new Error('Parquet file not found in storage')

  const result = await callDuckdbWorker<{ rows: Record<string, unknown>[] }>('/run-query', {
    sql: compiled.sql,
    params: compiled.params,
    parquetSignedUrl: signed.signedUrl,
  })
  return result.rows ?? []
}

export async function promoteRowsToParquet(
  orgId: string,
  tableId: string,
  rows: Record<string, unknown>[],
): Promise<{ storagePath: string; rowCount: number }> {
  return callDuckdbWorker('/promote-parquet', { organizationId: orgId, tableId, rows })
}
