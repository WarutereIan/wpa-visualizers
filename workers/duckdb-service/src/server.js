import http from 'node:http'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import duckdb from 'duckdb'
import { createClient } from '@supabase/supabase-js'

const PORT = Number(process.env.PORT ?? 8787)
const WORKER_SECRET = process.env.DUCKDB_WORKER_SECRET ?? ''
const STORAGE_BUCKET = process.env.DIMES_STORAGE_BUCKET ?? 'dimes-data'

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function runDuckQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(':memory:')
    const conn = db.connect()
    conn.all(sql, ...params, (err, rows) => {
      conn.close()
      db.close()
      if (err) reject(err)
      else resolve(rows ?? [])
    })
  })
}

function runDuckExec(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(':memory:')
    const conn = db.connect()
    conn.run(sql, ...params, (err) => {
      conn.close()
      db.close()
      if (err) reject(err)
      else resolve()
    })
  })
}

function storagePath(orgId, tableId, batch = 0) {
  return `orgs/${orgId}/tables/${tableId}/data/batch_${batch}.parquet`
}

async function writeParquetFromRows(rows) {
  const dir = join(tmpdir(), `dimes-parquet-${randomUUID()}`)
  await mkdir(dir, { recursive: true })
  const jsonPath = join(dir, 'rows.json')
  const parquetPath = join(dir, 'data.parquet')
  await writeFile(jsonPath, JSON.stringify(rows))
  await runDuckExec(
    `COPY (SELECT * FROM read_json_auto(?)) TO ? (FORMAT PARQUET)`,
    [jsonPath, parquetPath],
  )
  const { readFile } = await import('node:fs/promises')
  const buf = await readFile(parquetPath)
  await rm(dir, { recursive: true, force: true })
  return buf
}

function getAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  return createClient(url, key)
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true })
  }

  if (WORKER_SECRET) {
    const auth = req.headers['x-worker-secret']
    if (auth !== WORKER_SECRET) return json(res, 401, { error: 'Unauthorized' })
  }

  try {
    if (req.method === 'POST' && req.url === '/run-query') {
      const body = await readBody(req)
      const { sql, params = [], parquetSignedUrl } = body
      if (!sql || !parquetSignedUrl) {
        return json(res, 400, { error: 'sql and parquetSignedUrl required' })
      }
      // Inline the parquet path literal, then convert remaining Postgres-style
      // `$N` placeholders to DuckDB positional `?` and bind params.slice(1) in
      // order. (params[0] is the parquet path emitted by compileQuery.)
      const localSql = sql
        .replace(/read_parquet\(\$\d+\)/g, `read_parquet('${String(parquetSignedUrl).replace(/'/g, "''")}')`)
        .replace(/\$\d+/g, '?')
      // Defense-in-depth: only allow read-only SELECT/WITH statements.
      if (!/^\s*(select|with)\b/i.test(localSql)) {
        return json(res, 400, { error: 'Only SELECT queries are allowed' })
      }
      const rows = await runDuckQuery(localSql, params.slice(1))
      return json(res, 200, { rows })
    }

    if (req.method === 'POST' && req.url === '/promote-parquet') {
      const body = await readBody(req)
      const { organizationId, tableId, rows } = body
      if (!organizationId || !tableId || !Array.isArray(rows) || rows.length === 0) {
        return json(res, 400, { error: 'organizationId, tableId, rows required' })
      }

      const admin = getAdmin()
      const path = storagePath(organizationId, tableId, 0)
      const parquet = await writeParquetFromRows(rows)
      const { error: uploadError } = await admin.storage.from(STORAGE_BUCKET).upload(path, parquet, {
        contentType: 'application/octet-stream',
        upsert: true,
      })
      if (uploadError) throw uploadError

      const { data: signed } = await admin.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600)
      return json(res, 200, {
        storagePath: path,
        rowCount: rows.length,
        signedUrl: signed?.signedUrl ?? null,
      })
    }

    json(res, 404, { error: 'Not found' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Worker error'
    json(res, 500, { error: message })
  }
})

server.listen(PORT, () => {
  console.log(`DuckDB worker listening on :${PORT}`)
})
