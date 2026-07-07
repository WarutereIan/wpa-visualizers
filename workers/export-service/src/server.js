import http from 'node:http'
import { createClient } from '@supabase/supabase-js'
import {
  buildExportContext,
  extForFormat,
  mimeForFormat,
  renderCsv,
  renderPdf,
  renderPptx,
} from './render.js'

const PORT = Number(process.env.PORT ?? 8788)
const WORKER_SECRET = process.env.EXPORT_WORKER_SECRET ?? ''
const STORAGE_BUCKET = process.env.DIMES_EXPORTS_BUCKET ?? 'dimes-exports'
const POLL_MS = Number(process.env.POLL_INTERVAL_MS ?? 30_000)

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function getAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  return createClient(url, key)
}

async function loadTarget(admin, job) {
  const { target_type: targetType, target_id: targetId, organization_id: orgId } = job
  if (!targetId) throw new Error('Missing target_id')

  if (targetType === 'dashboard') {
    const { data, error } = await admin
      .from('dashboards')
      .select('id, name, description, layout, widgets')
      .eq('id', targetId)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (error || !data) throw new Error('Dashboard not found')
    return data
  }

  if (targetType === 'snapshot') {
    const { data, error } = await admin
      .from('dashboard_snapshots')
      .select('id, period, layout, data, created_at')
      .eq('id', targetId)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (error || !data) throw new Error('Snapshot not found')
    return data
  }

  if (targetType === 'report') {
    const { data, error } = await admin
      .from('reports')
      .select('id, name, period, status, blocks')
      .eq('id', targetId)
      .eq('organization_id', orgId)
      .maybeSingle()
    if (error || !data) throw new Error('Report not found')
    return data
  }

  throw new Error(`Unknown target_type: ${targetType}`)
}

async function renderBuffer(format, context) {
  const effective = format === 'png' ? 'pdf' : format
  switch (effective) {
    case 'pdf':
      return renderPdf(context)
    case 'pptx':
      return renderPptx(context)
    case 'csv':
      return renderCsv(context)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

async function failJob(admin, jobId, message) {
  await admin
    .from('export_jobs')
    .update({ status: 'failed', error: message.slice(0, 500), completed_at: new Date().toISOString() })
    .eq('id', jobId)
}

async function processOneJob(admin) {
  const { data: job, error: claimErr } = await admin.rpc('claim_export_job')
  if (claimErr) throw claimErr
  if (!job?.id) return { processed: false }

  try {
    const record = await loadTarget(admin, job)
    const context = buildExportContext(job.target_type, record)
    const buffer = await renderBuffer(job.format, context)
    const storageFormat = job.format === 'png' ? 'pdf' : job.format
    const ext = extForFormat(storageFormat)
    const path = `orgs/${job.organization_id}/exports/${job.id}.${ext}`

    const { error: uploadErr } = await admin.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType: mimeForFormat(storageFormat),
      upsert: true,
    })
    if (uploadErr) throw uploadErr

    const { data: signed, error: signErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    if (signErr) throw signErr

    await admin
      .from('export_jobs')
      .update({
        status: 'success',
        result_url: signed.signedUrl,
        error: null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return { processed: true, jobId: job.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed'
    await failJob(admin, job.id, message)
    return { processed: true, jobId: job.id, error: message }
  }
}

async function processBatch(max = 5) {
  const admin = getAdmin()
  const results = []
  for (let i = 0; i < max; i++) {
    const r = await processOneJob(admin)
    results.push(r)
    if (!r.processed) break
  }
  return results
}

function authorized(req) {
  if (!WORKER_SECRET) return true
  return req.headers['x-worker-secret'] === WORKER_SECRET
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true })
  }

  if (req.method === 'POST' && req.url === '/process') {
    if (!authorized(req)) return json(res, 401, { error: 'Unauthorized' })
    try {
      const results = await processBatch(5)
      return json(res, 200, { results })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return json(res, 500, { error: message })
    }
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`export-service listening on :${PORT}`)
})

if (POLL_MS > 0) {
  setInterval(() => {
    processBatch(3).catch((err) => console.error('poll error', err))
  }, POLL_MS)
  console.log(`polling every ${POLL_MS}ms`)
}
