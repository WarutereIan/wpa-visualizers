/**
 * One-time migration of legacy dashboard jsonb widgets → Redash
 * visualizations + dashboard_widgets.
 *
 * Usage:
 *   npx tsx scripts/migrate-dashboards.ts --dry-run
 *   npx tsx scripts/migrate-dashboards.ts
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (never hardcoded).
 * Does NOT delete legacy layout/widgets jsonb (Task 15).
 * Idempotent: dashboards that already have dashboard_widgets rows are skipped.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DashboardDefinition, WidgetConfig } from '#/types/dashboard'
import type { QueryAggregation } from '#/types/data'
import type { Layout } from 'react-grid-layout'
import { planWidgetMigration, type MigrationPlanItem } from '#/lib/legacyWidgetMigration'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

function loadEnvFile(path: string): void {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return
    throw err
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(resolve(ROOT, '.env'))

type DbDashboardRow = {
  id: string
  organization_id: string
  name: string
  description: string | null
  layout: unknown
  widgets: unknown
  created_at: string
  updated_at: string
}

type DbQueryRow = {
  id: string
  aggregations: unknown
}

function toDashboard(row: DbDashboardRow): DashboardDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    layout: (row.layout as Layout) ?? [],
    widgets: (row.widgets as DashboardDefinition['widgets']) ?? {},
  }
}

function widgetTitle(dashboard: DashboardDefinition, widgetId: string): string {
  const widget: WidgetConfig | undefined = dashboard.widgets[widgetId]
  return widget?.title?.trim() || widgetId
}

function firstAggAlias(aggregations: unknown): string | undefined {
  if (!Array.isArray(aggregations) || aggregations.length === 0) return undefined
  const alias = (aggregations[0] as QueryAggregation | undefined)?.alias
  return alias && alias.trim() ? alias : undefined
}

function enrichPlan(
  plan: MigrationPlanItem[],
  queriesById: Map<string, DbQueryRow>,
): MigrationPlanItem[] {
  return plan.map((item) => {
    if (item.vizType !== 'COUNTER') return item
    const opts = { ...(item.vizOptions ?? {}) }
    if (typeof opts.counterColName === 'string' && opts.counterColName) return item
    const query = item.queryId ? queriesById.get(item.queryId) : undefined
    const alias = firstAggAlias(query?.aggregations)
    if (!alias) return item
    return { ...item, vizOptions: { ...opts, counterColName: alias, rowNumber: opts.rowNumber ?? 1 } }
  })
}

function formatItemLine(dashboard: DashboardDefinition, item: MigrationPlanItem): string {
  const title = widgetTitle(dashboard, item.widgetId)
  const pos = `col=${item.position.col} row=${item.position.row} sizeX=${item.position.sizeX} sizeY=${item.position.sizeY}`
  const bits = [`${item.widgetId} "${title}"`, item.action, pos]
  if (item.vizType) bits.push(item.vizType)
  if (item.queryId) bits.push(`query=${item.queryId}`)
  if (item.downgraded) bits.push('DOWNGRADED')
  if (item.reason) bits.push(`reason=${item.reason}`)
  if (item.action === 'textbox') bits.push(`text=${JSON.stringify(item.text ?? '')}`)
  return `    - ${bits.join(' | ')}`
}

function printDashboardReport(
  dashboard: DashboardDefinition,
  plan: MigrationPlanItem[],
  alreadyMigrated: boolean,
): void {
  const widgetCount = Object.keys(dashboard.widgets).length
  console.log(`\n=== ${dashboard.name} (${dashboard.id}) ===`)
  console.log(`  legacy widgets: ${widgetCount}`)
  if (alreadyMigrated) {
    console.log('  skipped: already has dashboard_widgets rows (idempotent)')
    return
  }
  const createdViz = plan.filter((p) => p.action === 'visualization')
  const createdText = plan.filter((p) => p.action === 'textbox')
  const skipped = plan.filter((p) => p.action === 'skip')
  const downgraded = plan.filter((p) => p.downgraded && p.action !== 'skip')
  console.log(`  would create visualizations: ${createdViz.length}`)
  console.log(`  would create textboxes: ${createdText.length}`)
  console.log(`  skipped: ${skipped.length}`)
  console.log(`  downgraded: ${downgraded.length}`)
  if (createdViz.length) {
    console.log('  visualizations:')
    for (const item of createdViz) console.log(formatItemLine(dashboard, item))
  }
  if (createdText.length) {
    console.log('  textboxes:')
    for (const item of createdText) console.log(formatItemLine(dashboard, item))
  }
  if (downgraded.length) {
    console.log('  downgrades:')
    for (const item of downgraded) console.log(formatItemLine(dashboard, item))
  }
  if (skipped.length) {
    console.log('  skipped widgets:')
    for (const item of skipped) console.log(formatItemLine(dashboard, item))
  }
}

async function applyPlan(
  supabase: SupabaseClient,
  dashboard: DashboardDefinition,
  orgId: string,
  plan: MigrationPlanItem[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0
  let skipped = 0
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const item of plan) {
    if (item.action === 'skip') {
      skipped += 1
      continue
    }
    const title = widgetTitle(dashboard, item.widgetId)
    if (item.action === 'textbox') {
      const { error } = await supabase.from('dashboard_widgets').insert({
        id: crypto.randomUUID(),
        organization_id: orgId,
        dashboard_id: dashboard.id,
        visualization_id: null,
        text: item.text ?? '',
        options: { position: item.position },
        created_at: now,
        updated_at: now,
      })
      if (error) {
        errors.push(`${item.widgetId} textbox: ${error.message}`)
        continue
      }
      created += 1
      continue
    }

    if (!item.queryId || !item.vizType) {
      skipped += 1
      continue
    }

    const vizId = crypto.randomUUID()
    const { error: vizError } = await supabase.from('visualizations').insert({
      id: vizId,
      organization_id: orgId,
      query_id: item.queryId,
      type: item.vizType,
      name: title,
      description: null,
      options: item.vizOptions ?? {},
      created_at: now,
      updated_at: now,
    })
    if (vizError) {
      errors.push(`${item.widgetId} visualization: ${vizError.message}`)
      continue
    }

    const { error: widgetError } = await supabase.from('dashboard_widgets').insert({
      id: crypto.randomUUID(),
      organization_id: orgId,
      dashboard_id: dashboard.id,
      visualization_id: vizId,
      text: null,
      options: { position: item.position },
      created_at: now,
      updated_at: now,
    })
    if (widgetError) {
      errors.push(`${item.widgetId} dashboard_widget: ${widgetError.message}`)
      continue
    }
    created += 1
  }

  return { created, skipped, errors }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  console.log(dryRun ? 'Mode: DRY-RUN (no writes)' : 'Mode: APPLY (writing visualizations + dashboard_widgets)')

  if (!url) {
    console.error(
      'Missing SUPABASE_URL (or VITE_SUPABASE_URL) in .env. Cannot connect.',
    )
    process.exitCode = 1
    return
  }
  if (!serviceKey) {
    console.error(
      'Missing SUPABASE_SERVICE_ROLE_KEY in .env. The script will not use the anon/publishable key. Add the service-role key and re-run: npx tsx scripts/migrate-dashboards.ts --dry-run',
    )
    process.exitCode = 1
    return
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: dashboardRows, error: dashError } = await supabase
    .from('dashboards')
    .select('id, organization_id, name, description, layout, widgets, created_at, updated_at')
    .order('name', { ascending: true })

  if (dashError) {
    console.error(`Failed to load dashboards: ${dashError.message}`)
    process.exitCode = 1
    return
  }

  const rows = (dashboardRows ?? []) as DbDashboardRow[]
  const { data: widgetRows, error: widgetError } = await supabase
    .from('dashboard_widgets')
    .select('dashboard_id')

  if (widgetError) {
    console.error(`Failed to load dashboard_widgets: ${widgetError.message}`)
    process.exitCode = 1
    return
  }

  const already = new Set((widgetRows ?? []).map((w: { dashboard_id: string }) => w.dashboard_id))

  const { data: queryRows, error: queryError } = await supabase
    .from('query_definitions')
    .select('id, aggregations')

  if (queryError) {
    console.error(`Failed to load query_definitions: ${queryError.message}`)
    process.exitCode = 1
    return
  }

  const queriesById = new Map<string, DbQueryRow>(
    ((queryRows ?? []) as DbQueryRow[]).map((q) => [q.id, q]),
  )

  let dashboards = 0
  let alreadySkipped = 0
  let wouldCreateViz = 0
  let wouldCreateText = 0
  let wouldSkip = 0
  let wouldDowngrade = 0
  let applied = 0
  const applyErrors: string[] = []

  console.log(`Loaded ${rows.length} dashboard(s). Existing dashboard_widgets rows: ${(widgetRows ?? []).length}.`)

  for (const row of rows) {
    dashboards += 1
    const dashboard = toDashboard(row)
    const alreadyMigrated = already.has(row.id)
    const plan = alreadyMigrated ? [] : enrichPlan(planWidgetMigration(dashboard), queriesById)
    printDashboardReport(dashboard, plan, alreadyMigrated)

    if (alreadyMigrated) {
      alreadySkipped += 1
      continue
    }

    wouldCreateViz += plan.filter((p) => p.action === 'visualization').length
    wouldCreateText += plan.filter((p) => p.action === 'textbox').length
    wouldSkip += plan.filter((p) => p.action === 'skip').length
    wouldDowngrade += plan.filter((p) => p.downgraded && p.action !== 'skip').length

    if (!dryRun) {
      const result = await applyPlan(supabase, dashboard, row.organization_id, plan)
      applied += result.created
      applyErrors.push(...result.errors.map((e) => `${dashboard.name}: ${e}`))
      console.log(`  applied: created=${result.created} skipped=${result.skipped} errors=${result.errors.length}`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`  dashboards scanned: ${dashboards}`)
  console.log(`  already migrated (skipped): ${alreadySkipped}`)
  console.log(`  widgets → visualizations: ${wouldCreateViz}`)
  console.log(`  widgets → textboxes: ${wouldCreateText}`)
  console.log(`  widgets skipped (no dataSourceId): ${wouldSkip}`)
  console.log(`  widgets downgraded: ${wouldDowngrade}`)
  if (dryRun) {
    console.log('  writes: none (dry-run)')
  } else {
    console.log(`  rows written this run: ${applied}`)
    if (applyErrors.length) {
      console.log('  errors:')
      for (const err of applyErrors) console.log(`    - ${err}`)
    }
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
