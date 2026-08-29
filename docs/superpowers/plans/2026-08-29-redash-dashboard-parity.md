# Redash Dashboard Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the DIMES-BI dashboard builder on the Redash model — queries own visualizations, dashboards are grids of widgets referencing visualizations or markdown textboxes — with Redash's exact visualization layer (vendored `viz-lib`), chrome, publishing, sharing, and parameters.

**Architecture:** Vendor Redash's `viz-lib` (React 19 / antd 6 era) as an npm workspace package providing the visualization `Renderer` and `Editor`. Add `visualizations` and `dashboard_widgets` tables in Supabase (org-scoped RLS). Keep the existing DSL query engine; a thin adapter converts DSL results to Redash's `{columns, rows}` format. All dashboard chrome (header, modals, parameter bar, share dialog) is built natively in the existing TanStack Start + Tailwind + shadcn stack, using Redash's UI as the visual reference.

**Tech Stack:** React 19.2, TanStack Start/Router/Query, Supabase (Postgres + RLS + edge functions), Tailwind 4 + shadcn, `@redash/viz` (vendored), antd 6, plotly.js, react-grid-layout 2.x, markdown-it + dompurify, zustand (demo mode), vitest.

**Spec:** `docs/superpowers/specs/2026-08-29-redash-dashboard-parity-design.md` — read it before starting any task.

## Global Constraints

- React `^19.2.0`; do NOT downgrade. The npm-published `@redash/viz@0.1.1` is stale and must NOT be installed — only the vendored workspace copy from `getredash/redash` master (post PR #7669, React 19 / antd 6) is allowed.
- Keep the DSL query builder. No SQL editor. `QueryDefinition` in `src/types/data.ts` remains the query model.
- Path alias: `#/*` → `./src/*` (see `package.json` `imports`).
- Demo mode (signed out, zustand stores) and workspace mode (Supabase) must BOTH keep working; every data operation goes through the `useWorkspace*` hook pattern (see `src/hooks/useWorkspaceData.ts`).
- RLS pattern for new org tables (copy exactly from `supabase/migrations/0003_core_workspace_tables.sql`): read = `public.is_org_member(organization_id)`; write = `public.current_org_role(organization_id) in ('owner','admin','editor','data_manager')`.
- Commit style: short lowercase messages, e.g. `feat: add visualizations table` (see `git log`).
- Shell is PowerShell on Windows — use `;` not `&&`, quote paths.
- Tests: vitest (`npm test`). Test files live next to sources: `src/lib/foo.test.ts`.
- Type-check with `npx tsc --noEmit` after each task (there is no separate lint script).
- Work happens on the existing branch `redash-dashboard-look`.

## Redash reference

When a task says "match Redash", the reference is the Redash client source: https://github.com/getredash/redash `client/app/` (components under `components/dashboards/`, pages under `pages/dashboards/`). Copy layout, spacing, copy text, and behavior from there; implement with Tailwind/shadcn primitives.

---

## Shared type contracts (used across all tasks)

These exact types are created in Task 2 (`src/types/visualization.ts`) and referenced everywhere. Do not rename.

```ts
import type { DataRow } from '#/types/data'

export type RedashVisualizationType =
  | 'CHART' | 'TABLE' | 'COUNTER' | 'PIVOT' | 'FUNNEL' | 'SANKEY'
  | 'SUNBURST_SEQUENCE' | 'MAP' | 'CHOROPLETH' | 'COHORT' | 'WORD_CLOUD' | 'DETAILS'

export interface VisualizationDefinition {
  id: string
  queryId: string
  type: RedashVisualizationType
  name: string
  description?: string
  /** viz-lib options object for this type. Opaque to our code. */
  options: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type ParameterType = 'text' | 'number' | 'date' | 'date-range' | 'enum' | 'query'

export interface QueryParameter {
  /** machine name, unique per query */
  name: string
  /** display label */
  title: string
  type: ParameterType
  default: string | number | null
  /** for type 'enum' */
  enumOptions?: string[]
  /** for type 'query': dropdown fed by another query's first column */
  queryId?: string
}

export type ParameterMappingType = 'dashboard-level' | 'widget-level' | 'static'

export interface ParameterMapping {
  type: ParameterMappingType
  /** dashboard-level: name of the shared dashboard parameter. otherwise the param's own name */
  mapTo: string
  /** only for 'static' */
  value?: string | number | null
}

export interface WidgetPosition {
  col: number    // 0-5 (6-column grid)
  row: number
  sizeX: number  // width in columns
  sizeY: number  // height in grid rows
}

export interface DashboardWidget {
  id: string
  dashboardId: string
  /** null ⇒ textbox widget */
  visualizationId: string | null
  /** markdown body for textbox widgets, null for viz widgets */
  text: string | null
  options: {
    position: WidgetPosition
    parameterMappings?: Record<string, ParameterMapping>
  }
  createdAt: string
  updatedAt: string
}

export type RedashColumnType = 'integer' | 'float' | 'boolean' | 'string' | 'datetime' | 'date'

export interface RedashQueryResult {
  columns: { name: string; type: RedashColumnType; friendly_name: string }[]
  rows: DataRow[]
}
```

Also in Task 2: `src/types/data.ts` gains
```ts
// on DataFilter:
/** When set, value is supplied at runtime from this parameter instead of `value`. */
param?: string
// on QueryDefinition:
parameters?: QueryParameter[]
// on DashboardDefinition (src/types/dashboard.ts):
tags?: string[]
```

---

### Task 1: Vendor viz-lib as a workspace package and prove it renders

**Files:**
- Create: `packages/redash-viz/` (vendored copy of `viz-lib` from getredash/redash master)
- Modify: `package.json` (add `"workspaces": ["packages/*"]`, deps: `@redash/viz`, `antd@^6`)
- Create: `src/routes/dev.viz-smoke.tsx` (temporary smoke-test route, removed in Task 15)
- Create: `docs/superpowers/vendored-viz-lib.md` (sync provenance: repo URL + pinned commit SHA + re-sync instructions)

**Interfaces:**
- Produces: importable `Renderer` and `Editor` React components:
  `import { Renderer, Editor } from '@redash/viz/lib'` and stylesheet `import '@redash/viz/lib/index.css'`.
  `<Renderer type={RedashVisualizationType} options={object} data={RedashQueryResult} visualizationName={string} />`
  `<Editor type={...} options={...} data={...} onOptionsChange={(opts) => void} />`

- [ ] **Step 1: Fetch viz-lib source at a pinned commit**

```powershell
git clone --depth 1 https://github.com/getredash/redash.git C:\Users\nmwan\projects\.tmp-redash
Set-Location C:\Users\nmwan\projects\.tmp-redash; git rev-parse HEAD   # record this SHA
New-Item -ItemType Directory -Force C:\Users\nmwan\projects\ics-dashboard\bi-dimes\packages
Copy-Item C:\Users\nmwan\projects\.tmp-redash\viz-lib C:\Users\nmwan\projects\ics-dashboard\bi-dimes\packages\redash-viz -Recurse
```

Verify `packages/redash-viz/package.json` has `"name": "@redash/viz"` and peer deps on react 19 / antd (5 or 6). If peers still say react 16, you cloned an old ref — master must include PR #7669 (merged ~2026-03). Record the SHA in `docs/superpowers/vendored-viz-lib.md`.

- [ ] **Step 2: Wire npm workspaces and dependencies**

In root `package.json` add:
```json
"workspaces": ["packages/*"]
```
and to `dependencies`: `"@redash/viz": "*"`, `"antd": "^6.0.0"`. Then:

```powershell
Set-Location C:\Users\nmwan\projects\ics-dashboard\bi-dimes; npm install
```

- [ ] **Step 3: Build viz-lib**

```powershell
npm run build --workspace @redash/viz
```

Expected: `packages/redash-viz/lib/` appears with `index.js` + `index.css`. If the build script fails on missing dev deps, run `npm install` inside `packages/redash-viz` first. If viz-lib's build tooling fights the monorepo, fallback (allowed): add a vite alias `'@redash/viz/lib': '<abs>/packages/redash-viz/src'` in `vite.config.ts` and let vite transpile the source — document whichever path you took in `docs/superpowers/vendored-viz-lib.md`.

- [ ] **Step 4: Smoke-test route**

Create `src/routes/dev.viz-smoke.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Renderer } from '@redash/viz/lib'
import '@redash/viz/lib/index.css'

const data = {
  columns: [
    { name: 'month', type: 'string' as const, friendly_name: 'Month' },
    { name: 'total', type: 'integer' as const, friendly_name: 'Total' },
  ],
  rows: [
    { month: 'Jan', total: 10 },
    { month: 'Feb', total: 25 },
    { month: 'Mar', total: 17 },
  ],
}

const options = {
  globalSeriesType: 'column',
  columnMapping: { month: 'x', total: 'y' },
  legend: { enabled: true },
}

export const Route = createFileRoute('/dev/viz-smoke')({
  component: () => (
    <div style={{ padding: 24 }}>
      <h1>viz-lib smoke test</h1>
      <div style={{ height: 400 }}>
        <Renderer type="CHART" visualizationName="smoke" options={options} data={data} />
      </div>
      <div style={{ height: 300 }}>
        <Renderer type="TABLE" visualizationName="smoke-table" options={{}} data={data} />
      </div>
    </div>
  ),
})
```

- [ ] **Step 5: Verify in browser**

Run `npm run dev` (or use the already-running dev server on port 3000), open `http://localhost:3000/dev/viz-smoke`. Expected: a Plotly column chart AND a Redash table render without console errors. If antd throws React-19 rendering errors, check whether viz-lib peers want antd 5 (then use `antd@^5` + `@ant-design/v5-patch-for-react-19` imported in `src/router.tsx`) or antd 6 (native React 19 support) — match the vendored package.json.

- [ ] **Step 6: Type-check and commit**

```powershell
npx tsc --noEmit
git add -A; git commit -m "feat: vendor redash viz-lib workspace with smoke test"
```

Note: if `tsc` chokes on viz-lib internals, exclude `packages/**` in root `tsconfig.json` — the app consumes the built lib, and viz-lib ships its own `index.d.ts`; if it doesn't, create `src/types/redash-viz.d.ts` declaring `module '@redash/viz/lib'` with the `Renderer`/`Editor` prop types from the Interfaces block above.

---

### Task 2: Database migration + TypeScript types

**Files:**
- Create: `supabase/migrations/0030_redash_model.sql`
- Create: `src/types/visualization.ts` (exact contents from "Shared type contracts" above)
- Modify: `src/types/data.ts` (add `param?: string` to `DataFilter`; add `parameters?: QueryParameter[]` to `QueryDefinition`)
- Modify: `src/types/dashboard.ts` (add `tags?: string[]` to `DashboardDefinition`)

**Interfaces:**
- Produces: tables `public.visualizations`, `public.dashboard_widgets`, `public.favorites`; columns `query_definitions.parameters`, `dashboards.tags`. TS types per the shared contract.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0030_redash_model.sql`:

```sql
-- Redash-model tables: queries own visualizations; dashboards own widget rows.

create table public.visualizations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  query_id        uuid not null references public.query_definitions(id) on delete cascade,
  type            text not null check (type in (
    'CHART','TABLE','COUNTER','PIVOT','FUNNEL','SANKEY',
    'SUNBURST_SEQUENCE','MAP','CHOROPLETH','COHORT','WORD_CLOUD','DETAILS')),
  name            text not null,
  description     text,
  options         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index visualizations_query_idx on public.visualizations (query_id);
create index visualizations_org_idx on public.visualizations (organization_id);

create table public.dashboard_widgets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  dashboard_id     uuid not null references public.dashboards(id) on delete cascade,
  visualization_id uuid references public.visualizations(id) on delete cascade,
  text             text,
  options          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint widget_is_viz_xor_text check (
    (visualization_id is not null and text is null)
    or (visualization_id is null and text is not null)
  )
);
create index dashboard_widgets_dashboard_idx on public.dashboard_widgets (dashboard_id);

create table public.favorites (
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  object_type     text not null check (object_type in ('dashboard','query')),
  object_id       uuid not null,
  created_at      timestamptz not null default now(),
  primary key (user_id, object_type, object_id)
);

alter table public.query_definitions add column parameters jsonb not null default '[]'::jsonb;
alter table public.dashboards add column tags text[] not null default '{}';
create index dashboards_tags_idx on public.dashboards using gin (tags);

alter table public.visualizations enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.favorites enable row level security;

create policy "viz: org members read"
  on public.visualizations for select
  using (public.is_org_member(organization_id));
create policy "viz: editors+ write"
  on public.visualizations for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "widgets: org members read"
  on public.dashboard_widgets for select
  using (public.is_org_member(organization_id));
create policy "widgets: editors+ write"
  on public.dashboard_widgets for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "favorites: self read"
  on public.favorites for select using (auth.uid() = user_id);
create policy "favorites: self write"
  on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.visualizations is 'Redash-model: a query owns N visualizations (viz-lib options in options jsonb).';
comment on table public.dashboard_widgets is 'Redash-model: dashboard widget rows. visualization_id XOR text. options = { position, parameterMappings }.';
```

- [ ] **Step 2: Apply the migration**

The project links to a remote Supabase project (`supabase/.temp/linked-project.json`). Apply with the Supabase MCP tool `apply_migration` (project already linked) or `npx supabase db push`. Verify with the MCP `list_tables` that `visualizations`, `dashboard_widgets`, `favorites` exist.

- [ ] **Step 3: Add the TS types** (exact code from "Shared type contracts"), modify `DataFilter`, `QueryDefinition`, `DashboardDefinition` as listed.

- [ ] **Step 4: Type-check and commit**

```powershell
npx tsc --noEmit
git add -A; git commit -m "feat: redash model migration and types"
```

---

### Task 3: API layer + workspace hooks for visualizations and widgets

**Files:**
- Create: `src/lib/api/visualizations.ts`
- Create: `src/lib/api/widgets.ts`
- Modify: `src/lib/api/workspace.ts` (add query keys: `visualizations(orgId, queryId?)`, `widgets(orgId, dashboardId)`, `favorites(orgId)`)
- Modify: `src/stores/dataStore.ts` (demo-mode visualizations: `visualizations: VisualizationDefinition[]` + create/update/remove/listByQuery)
- Modify: `src/stores/dashboardStore.ts` (demo-mode widgets: `widgets: DashboardWidget[]` + create/update/remove/listByDashboard)
- Create: `src/hooks/useWorkspaceVisualizations.ts`
- Create: `src/hooks/useDashboardWidgets.ts`
- Test: `src/stores/dashboardStore.test.ts` (extend or create)

**Interfaces:**
- Consumes: `VisualizationDefinition`, `DashboardWidget` from Task 2; supabase client pattern from `src/lib/api/dashboards.ts` (copy its structure: fetch fn + useQuery + useMutation with `throwIfSupabaseError` and query-key invalidation; snake_case ↔ camelCase mapping in `src/lib/api/mappers.ts` style).
- Produces:

```ts
// useWorkspaceVisualizations()
{
  visualizations: VisualizationDefinition[]          // all for org (demo: store)
  listByQuery: (queryId: string) => VisualizationDefinition[]
  createVisualization: (input: Omit<VisualizationDefinition,'id'|'createdAt'|'updatedAt'>) => Promise<VisualizationDefinition>
  updateVisualization: (id: string, patch: Partial<Pick<VisualizationDefinition,'name'|'description'|'type'|'options'>>) => Promise<void>
  removeVisualization: (id: string) => Promise<void>
}
// useDashboardWidgets(dashboardId: string | null)
{
  widgets: DashboardWidget[]
  createWidget: (input: Omit<DashboardWidget,'id'|'createdAt'|'updatedAt'>) => Promise<DashboardWidget>
  updateWidget: (id: string, patch: Partial<Pick<DashboardWidget,'text'|'options'|'visualizationId'>>) => Promise<void>
  removeWidget: (id: string) => Promise<void>
  isLoading: boolean
}
```

Both follow the `workspaceReady ? supabase : zustand` dual pattern of `useWorkspaceData()` exactly.

- [ ] **Step 1: Write failing store tests** (`src/stores/dashboardStore.test.ts`):

```ts
import { describe, expect, it } from 'vitest'
import { useDashboardStore } from '#/stores/dashboardStore'

describe('dashboardStore widgets', () => {
  it('creates, lists, updates and removes widgets per dashboard', () => {
    const s = useDashboardStore.getState()
    const d = s.addDashboard('Test')
    const w = s.createWidget({
      dashboardId: d.id,
      visualizationId: null,
      text: 'hello',
      options: { position: { col: 0, row: 0, sizeX: 3, sizeY: 3 } },
    })
    expect(s.listWidgets(d.id)).toHaveLength(1)
    s.updateWidget(w.id, { text: 'updated' })
    expect(s.listWidgets(d.id)[0].text).toBe('updated')
    s.removeWidget(w.id)
    expect(s.listWidgets(d.id)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- dashboardStore` → FAIL (createWidget not a function).
- [ ] **Step 3: Implement store extensions, API modules, and hooks** per the Interfaces block. API modules mirror `src/lib/api/dashboards.ts` structure; DB mapping: `query_id`→`queryId`, `visualization_id`→`visualizationId`, `dashboard_id`→`dashboardId`, `organization_id` injected on write from `orgId`.
- [ ] **Step 4: Run tests + type-check** — `npm test`; `npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: visualization and widget api layer with demo stores"`

---

### Task 4: Redash query-result adapter

**Files:**
- Create: `src/lib/redashResult.ts`
- Test: `src/lib/redashResult.test.ts`

**Interfaces:**
- Consumes: `DataRow`, `DataColumnDef`, `QueryDefinition` (`#/types/data`), `queryResultColumns` (`#/lib/queryResultColumns`), `RedashQueryResult`, `RedashColumnType` (`#/types/visualization`).
- Produces:

```ts
/** Convert DSL query output rows into viz-lib's expected result shape. */
export function toRedashResult(
  rows: DataRow[],
  query: QueryDefinition,
  sourceColumns: DataColumnDef[],   // columns of the source table (type hints)
): RedashQueryResult
```

Rules (encode as tests): column list = `queryResultColumns(query)`; when that is empty (no aggregations, no selected columns) fall back to `Object.keys(rows[0] ?? {})`. Type resolution per column: source table hint (`number`→`float`, `date`→`date`, `boolean`→`boolean`, `string`→`string`); aggregation aliases are always `float` except `count` → `integer`; group-by grain columns (`{col}_{grain}`) are `string`; unknown/computed → infer from first non-null row value (`typeof number` → `float`, else `string`). `friendly_name` = name with `_` → space, each word capitalized.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { toRedashResult } from '#/lib/redashResult'
import type { QueryDefinition } from '#/types/data'

const baseQuery: QueryDefinition = {
  id: 'q1', name: 'q', tableId: 't1',
  selectedColumns: [], filters: [], groupBy: ['region'],
  aggregations: [{ id: 'a1', operator: 'sum', column: 'amount', alias: 'total_amount' }],
  createdAt: '', updatedAt: '',
}
const sourceColumns = [
  { name: 'region', type: 'string' as const },
  { name: 'amount', type: 'number' as const },
]

describe('toRedashResult', () => {
  it('maps group-by + aggregation columns with types and friendly names', () => {
    const res = toRedashResult(
      [{ region: 'North', total_amount: 12 }], baseQuery, sourceColumns)
    expect(res.columns).toEqual([
      { name: 'region', type: 'string', friendly_name: 'Region' },
      { name: 'total_amount', type: 'float', friendly_name: 'Total Amount' },
    ])
    expect(res.rows).toEqual([{ region: 'North', total_amount: 12 }])
  })

  it('count aggregations are integer', () => {
    const q = { ...baseQuery, aggregations: [{ id: 'a', operator: 'count' as const, column: 'id', alias: 'n' }] }
    const res = toRedashResult([{ region: 'North', n: 3 }], q, sourceColumns)
    expect(res.columns.find(c => c.name === 'n')?.type).toBe('integer')
  })

  it('raw select falls back to row keys when no columns selected', () => {
    const q = { ...baseQuery, groupBy: [], aggregations: [] }
    const res = toRedashResult([{ region: 'North', amount: 5 }], q, sourceColumns)
    expect(res.columns.map(c => c.name)).toEqual(['region', 'amount'])
    expect(res.columns[1].type).toBe('float')
  })

  it('grain columns are string typed', () => {
    const q = { ...baseQuery, groupBy: ['created_at'], groupByGrains: { created_at: 'month' as const } }
    const res = toRedashResult([{ created_at_month: '2026-01', total_amount: 1 }], q,
      [...sourceColumns, { name: 'created_at', type: 'date' as const }])
    expect(res.columns[0]).toEqual({ name: 'created_at_month', type: 'string', friendly_name: 'Created At Month' })
  })
})
```

- [ ] **Step 2: Run to verify fail** — `npm test -- redashResult` → FAIL (module not found).
- [ ] **Step 3: Implement `toRedashResult`** per the rules above.
- [ ] **Step 4: Run tests** — PASS.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: redash query result adapter"`

---

### Task 5: Query parameters — substitution engine

**Files:**
- Create: `src/lib/queryParameters.ts`
- Test: `src/lib/queryParameters.test.ts`

**Interfaces:**
- Consumes: `QueryDefinition`, `DataFilter` (with new `param?: string`), `QueryParameter`, `ParameterMapping`.
- Produces:

```ts
export type ParameterValues = Record<string, string | number | null>

/** Params declared on the query that are actually used by at least one filter. */
export function usedParameters(query: QueryDefinition): QueryParameter[]

/**
 * Resolve param-bound filters into literal filters.
 * Priority: provided value > parameter default. Filters whose param has
 * neither are DROPPED (Redash blocks execution instead; we degrade gracefully).
 */
export function applyParameters(query: QueryDefinition, values: ParameterValues): QueryDefinition

/** Resolve a widget's mapping into the values passed to applyParameters. */
export function resolveWidgetParameters(
  parameters: QueryParameter[],
  mappings: Record<string, ParameterMapping> | undefined,
  dashboardValues: ParameterValues,   // current dashboard-level param bar values
  widgetValues: ParameterValues,      // current widget-level input values
): ParameterValues
```

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { applyParameters, resolveWidgetParameters, usedParameters } from '#/lib/queryParameters'
import type { QueryDefinition } from '#/types/data'

const q: QueryDefinition = {
  id: 'q1', name: 'q', tableId: 't1', selectedColumns: [], groupBy: [], aggregations: [],
  filters: [
    { id: 'f1', column: 'region', operator: 'eq', value: '', param: 'region' },
    { id: 'f2', column: 'status', operator: 'eq', value: 'active' },
  ],
  parameters: [
    { name: 'region', title: 'Region', type: 'enum', default: 'North', enumOptions: ['North', 'South'] },
    { name: 'unused', title: 'Unused', type: 'text', default: null },
  ],
  createdAt: '', updatedAt: '',
}

describe('queryParameters', () => {
  it('usedParameters only returns params referenced by filters', () => {
    expect(usedParameters(q).map(p => p.name)).toEqual(['region'])
  })

  it('applyParameters substitutes provided values', () => {
    const out = applyParameters(q, { region: 'South' })
    expect(out.filters.find(f => f.id === 'f1')?.value).toBe('South')
    expect(out.filters.find(f => f.id === 'f1')?.param).toBeUndefined()
  })

  it('falls back to the parameter default', () => {
    const out = applyParameters(q, {})
    expect(out.filters.find(f => f.id === 'f1')?.value).toBe('North')
  })

  it('drops filters with no value and no default', () => {
    const noDefault = { ...q, parameters: [{ name: 'region', title: 'R', type: 'text' as const, default: null }] }
    const out = applyParameters(noDefault, {})
    expect(out.filters.map(f => f.id)).toEqual(['f2'])
  })

  it('resolveWidgetParameters honors mapping types', () => {
    const params = q.parameters!
    const values = resolveWidgetParameters(
      params,
      {
        region: { type: 'dashboard-level', mapTo: 'global_region' },
        unused: { type: 'static', mapTo: 'unused', value: 'X' },
      },
      { global_region: 'South' },
      {},
    )
    expect(values).toEqual({ region: 'South', unused: 'X' })
  })

  it('unmapped params default to widget-level values', () => {
    const values = resolveWidgetParameters(q.parameters!, undefined, {}, { region: 'South' })
    expect(values.region).toBe('South')
  })
})
```

- [ ] **Step 2: Run to verify fail**, **Step 3: implement**, **Step 4: run to pass** (`npm test -- queryParameters`).
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: query parameter substitution engine"`

---

### Task 6: Widget runtime hook — query → parameters → Redash result

**Files:**
- Create: `src/hooks/useVisualizationResult.ts`
- Test: none (thin composition of tested parts); verified in Task 8's browser check.

**Interfaces:**
- Consumes: `useWorkspaceData()` (`tables`, `queries`), `useRunQueryResult(query)` from `src/hooks/useWorkspaceData.ts` (server/demo dual runner), `applyParameters` (Task 5), `toRedashResult` (Task 4).
- Produces:

```ts
export function useVisualizationResult(
  queryId: string | null,
  paramValues: ParameterValues,
  refreshNonce: number,             // bump to force re-run
): {
  result: RedashQueryResult | null
  query: QueryDefinition | null
  isLoading: boolean
  error: string | null
  lastRefreshedAt: Date | null
}
```

- [ ] **Step 1: Implement.** Look up query by id from `useWorkspaceData().queries`; `useMemo` the parameter-applied query (`applyParameters`); pass it to `useRunQueryResult`; adapt rows with `toRedashResult` using the source table's `columns` from `tables`. Include `refreshNonce` in the memo/query key so bumping it re-executes (for the server path, spread the nonce into the react-query key inside `useRunQuery` — add an optional `nonce` arg to it in `src/lib/api/queries.ts`). Record `lastRefreshedAt` when rows change.
- [ ] **Step 2: Type-check** — `npx tsc --noEmit`.
- [ ] **Step 3: Commit** — `git add -A; git commit -m "feat: visualization result runtime hook"`

---

### Task 7: Visualization authoring in the query editor (tabs + viz-lib Editor modal)

**Files:**
- Create: `src/components/data/VisualizationTabs.tsx`
- Create: `src/components/data/VisualizationEditorModal.tsx`
- Modify: `src/components/data/QueryEditor.tsx` (results/preview area renders `VisualizationTabs` under the existing preview)
- Modify: query-creation paths so every new query also creates a default TABLE visualization: in `src/hooks/useWorkspaceData.ts` `createQuery`, after create, call `createVisualization({ queryId, type: 'TABLE', name: 'Table', options: {} })` via the Task 3 API (and same in the demo store path).

**Interfaces:**
- Consumes: `useWorkspaceVisualizations()` (Task 3), `Renderer`/`Editor` from `@redash/viz/lib`, `toRedashResult` + `previewQueryRows` (`#/lib/queryPreview`) for live preview data.
- Produces:

```tsx
<VisualizationTabs
  query={QueryDefinition}
  previewRows={DataRow[]}          // current editor preview rows
  sourceColumns={DataColumnDef[]}
/>
// renders: [Table] [<viz name>]* [+ New Visualization] tab strip; active tab renders
// <Renderer> with toRedashResult(previewRows, query, sourceColumns)

<VisualizationEditorModal
  open={boolean}
  query={QueryDefinition}
  data={RedashQueryResult}
  visualization={VisualizationDefinition | null}  // null = creating new
  onClose={() => void}
/>
// full-screen dialog, Redash layout: left rail = viz type select + name input +
// viz-lib <Editor> (options form), right = live <Renderer> preview.
// Save → createVisualization / updateVisualization. Delete button on existing viz
// (confirm dialog; blocked with a warning listing dashboards if any dashboard_widgets
// reference it — query the widgets API by visualizationId).
```

- [ ] **Step 1: Implement `VisualizationTabs`** (shadcn `Tabs`; the default TABLE viz is always first and not deletable — Redash behavior).
- [ ] **Step 2: Implement `VisualizationEditorModal`** per the interface. Type switcher = shadcn `Select` over the 12 `RedashVisualizationType` values with Redash's display names (Chart, Table, Counter, Pivot Table, Funnel, Sankey, Sunburst Sequence, Map (Markers), Map (Choropleth), Cohort, Word Cloud, Details View). Changing type resets `options` to `{}` (viz-lib editors apply their own defaults).
- [ ] **Step 3: Mount in `QueryEditor`** under the preview table, gated on a saved query (tabs need `query.id`; hide for unsaved drafts).
- [ ] **Step 4: Default TABLE viz on create** (both workspace and demo paths).
- [ ] **Step 5: Browser verification.** Dev server → Data Management → open a query → tabs render; create a CHART visualization, configure x/y in the viz-lib editor, save; reload; it persists. Then `npx tsc --noEmit`.
- [ ] **Step 6: Commit** — `git add -A; git commit -m "feat: visualization tabs and editor in query editor"`

---

### Task 8: Dashboard grid, widget frames, and textboxes (view mode)

**Files:**
- Create: `src/components/dashboard/redash/DashboardGrid.tsx`
- Create: `src/components/dashboard/redash/VisualizationWidget.tsx`
- Create: `src/components/dashboard/redash/TextboxWidget.tsx`
- Create: `src/lib/widgetGrid.ts` + Test: `src/lib/widgetGrid.test.ts`
- Modify: `src/components/dashboard/redash/redash.css` (widget frame styles to match Redash: white card, 3px radius, subtle border, header row, footer refresh line)
- Deps: `npm install markdown-it dompurify; npm install -D @types/markdown-it @types/dompurify`

**Interfaces:**
- Consumes: `useDashboardWidgets(dashboardId)` (Task 3), `useVisualizationResult` (Task 6), `useWorkspaceVisualizations` (viz lookup), `Renderer` from viz-lib, `react-grid-layout` (already a dep — same lib Redash uses).
- Produces:

```ts
// src/lib/widgetGrid.ts — pure position mapping, Redash grid constants
export const GRID_COLS = 6
export const GRID_ROW_HEIGHT = 50
export const GRID_MARGIN = 15
export const DEFAULT_VIZ_SIZE = { sizeX: 3, sizeY: 8 }
export const DEFAULT_TEXT_SIZE = { sizeX: 3, sizeY: 3 }
export function positionToLayoutItem(w: DashboardWidget): Layout[number] // {i:w.id, x:col, y:row, w:sizeX, h:sizeY, minW:1, minH:1}
export function layoutItemToPosition(item: Layout[number]): WidgetPosition
/** First free slot scanning left-to-right, top-to-bottom (Redash append behavior). */
export function findFreePosition(widgets: DashboardWidget[], sizeX: number, sizeY: number): WidgetPosition
```

```tsx
<DashboardGrid
  dashboardId={string}
  editing={boolean}
  dashboardParamValues={ParameterValues}
  refreshNonce={number}
  onEditWidget={(w: DashboardWidget) => void}     // opens textbox/param editors (Task 9/13)
/>
// renders WidthProvider(GridLayout) cols=6 rowHeight=50 margin=[15,15],
// isDraggable/isResizable only when editing; onLayoutChange → updateWidget positions.

<VisualizationWidget widget={...} editing paramValues refreshNonce onEdit onRemove />
// header: visualization name (bold) + query name as <Link to="/data-management" search={{queryId}}>,
// kebab menu (Download as CSV, Download as Excel, Edit Parameters [Task 13], Remove [editing only]);
// body: <Renderer>; footer: "Refreshed X minutes ago" via lastRefreshedAt.

<TextboxWidget widget={...} editing onEdit onRemove />
// markdown-it render + DOMPurify.sanitize; edit/remove buttons visible only when editing.
```

- [ ] **Step 1: Write failing tests for `widgetGrid.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { findFreePosition, layoutItemToPosition, positionToLayoutItem } from '#/lib/widgetGrid'
import type { DashboardWidget } from '#/types/visualization'

const widget = (col: number, row: number, sizeX: number, sizeY: number): DashboardWidget => ({
  id: `${col}-${row}`, dashboardId: 'd', visualizationId: null, text: 't',
  options: { position: { col, row, sizeX, sizeY } }, createdAt: '', updatedAt: '',
})

describe('widgetGrid', () => {
  it('round-trips position <-> layout item', () => {
    const w = widget(2, 4, 3, 8)
    const item = positionToLayoutItem(w)
    expect(item).toMatchObject({ i: '2-4', x: 2, y: 4, w: 3, h: 8 })
    expect(layoutItemToPosition(item)).toEqual({ col: 2, row: 4, sizeX: 3, sizeY: 8 })
  })
  it('finds first free slot left-to-right', () => {
    expect(findFreePosition([widget(0, 0, 3, 8)], 3, 8)).toEqual({ col: 3, row: 0, sizeX: 3, sizeY: 8 })
  })
  it('wraps to a new row when the row is full', () => {
    expect(findFreePosition([widget(0, 0, 3, 8), widget(3, 0, 3, 8)], 3, 8))
      .toEqual({ col: 0, row: 8, sizeX: 3, sizeY: 8 })
  })
})
```

- [ ] **Step 2: Run to fail; implement `widgetGrid.ts`; run to pass** (`npm test -- widgetGrid`).
- [ ] **Step 3: Implement the three components** per interfaces. CSV/Excel download: build from the widget's current `RedashQueryResult` client-side (CSV: join with commas + quotes; Excel: `xlsx` package already in deps — `XLSX.utils.json_to_sheet(rows)`).
- [ ] **Step 4: Browser verification** deferred to Task 10 (needs the new dashboard page to mount the grid). Run `npx tsc --noEmit` now.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: redash dashboard grid and widget frames"`

---

### Task 9: Add Widget and Add Textbox modals

**Files:**
- Create: `src/components/dashboard/redash/AddWidgetModal.tsx`
- Create: `src/components/dashboard/redash/AddTextboxModal.tsx`
- Create: `src/components/dashboard/redash/ParameterMappingForm.tsx` (shared with Task 13)

**Interfaces:**
- Consumes: `useWorkspaceData()` (queries list), `useWorkspaceVisualizations().listByQuery`, `usedParameters` (Task 5), `createWidget` + `findFreePosition` + `DEFAULT_VIZ_SIZE`/`DEFAULT_TEXT_SIZE` (Tasks 3/8), markdown renderer from Task 8.
- Produces:

```tsx
<AddWidgetModal open dashboardId existingWidgets={DashboardWidget[]} onClose />
// Redash flow, one dialog, two stages:
// 1. Search input filtering saved queries by name; select a query →
//    visualization <Select> listing that query's visualizations (default: its Table viz).
// 2. If usedParameters(query).length > 0: <ParameterMappingForm> — table with one row
//    per param: [Title | Keyword (name) | mapping type select | value input].
//    Mapping choices (Redash copy): "Dashboard parameter" (default; mapTo = param name),
//    "Widget parameter", "Static value".
// [Add to Dashboard] → createWidget({ dashboardId, visualizationId, text: null,
//   options: { position: findFreePosition(existingWidgets, DEFAULT_VIZ_SIZE.sizeX, DEFAULT_VIZ_SIZE.sizeY), parameterMappings } })

<AddTextboxModal open dashboardId existingWidgets onClose editWidget={DashboardWidget | null} />
// textarea + live markdown preview below ("Preview" label), Redash copy:
// title "Add Textbox" / "Edit Textbox", button "Add to Dashboard" / "Save".
// Creates textbox widget (text, DEFAULT_TEXT_SIZE) or updates editWidget.text.

<ParameterMappingForm
  parameters={QueryParameter[]}
  value={Record<string, ParameterMapping>}
  onChange={(next) => void}
/>
```

- [ ] **Step 1: Implement `ParameterMappingForm`** (pure controlled component).
- [ ] **Step 2: Implement both modals** (shadcn `Dialog` + `Command` for query search).
- [ ] **Step 3: Type-check** — `npx tsc --noEmit` (browser verification in Task 10).
- [ ] **Step 4: Commit** — `git add -A; git commit -m "feat: add widget and textbox modals"`

---

### Task 10: Dashboard page — header, edit mode, publish, refresh, fullscreen, duplicate, archive

**Files:**
- Create: `src/components/dashboard/redash/DashboardPage.tsx` (the whole Redash dashboard screen)
- Create: `src/components/dashboard/redash/DashboardHeader.tsx`
- Create: `src/lib/dashboardLifecycle.ts` + Test: `src/lib/dashboardLifecycle.test.ts`
- Modify: `src/routes/dashboards.$dashboardId.tsx` (render `DashboardPage`; edit mode is a `?edit=true` search param, matching Redash's in-place editing)
- Modify: `src/hooks/useWorkspaceDashboards.ts` (extend `updateDashboard` patch type with `status` and `tags`; add `duplicateDashboard(id)`)
- Delete (end of task): `src/routes/dashboards.$dashboardId.edit.tsx`, `src/routes/dashboards.$dashboardId.preview.tsx` (in-place editing replaces both; keep `manage` route untouched for now)

**Interfaces:**
- Consumes: everything from Tasks 3–9.
- Produces:

```ts
// src/lib/dashboardLifecycle.ts — pure transition guards
export type DashboardStatus = 'draft' | 'published' | 'archived'
export function canPublish(s: DashboardStatus): boolean      // draft only
export function canUnpublish(s: DashboardStatus): boolean    // published only
export function canArchive(s: DashboardStatus): boolean      // draft | published
export function nextAutoRefreshLabel(seconds: number | null): string  // 'Off' | '1 minute' | ...
export const AUTO_REFRESH_INTERVALS = [60, 300, 600, 1800, 3600] as const
```

```tsx
<DashboardPage dashboardId={string} />
// Layout (match Redash dashboard page):
// <DashboardHeader> then dashboard-level parameter bar (Task 13 slot, render null for now)
// then <DashboardGrid>. Editing state from ?edit search param. When editing:
// bottom-fixed toolbar with [Add Widget] [Add Textbox] ... [Done Editing].

<DashboardHeader dashboard={DashboardDefinition} editing onToggleEdit onRefresh ... />
// Row 1: favorites star (Task 11 slot, null for now) + inline-editable name (click-to-edit
//   when user can edit) + tag list (Task 11 slot) + "Unpublished" badge when status==='draft'.
// Row 2 (right-aligned buttons, Redash order):
//   [Publish] (draft only) | [Refresh] with dropdown for auto-refresh interval |
//   [Share] (Task 12, disabled placeholder for now) | kebab: Edit, Duplicate,
//   Archive, Unpublish (published only), Fullscreen.
// Behavior:
//   Publish → updateDashboard(id, { status: 'published' })
//   Unpublish → { status: 'draft' }
//   Archive → confirm dialog (Redash copy: "Archive Dashboard? This dashboard will be
//     removed from the dashboards list...") → { status: 'archived' } → navigate to /dashboards
//   Duplicate → duplicateDashboard: copy dashboard (name = `Copy of: ${name}`, status 'draft',
//     same tags/theme) + copy all widget rows (new ids, same positions/options/visualizationIds)
//     → navigate to the copy in edit mode
//   Refresh → bump refreshNonce (passed to DashboardGrid)
//   Auto-refresh → setInterval bumping refreshNonce; label from nextAutoRefreshLabel
//   Fullscreen → document.documentElement.requestFullscreen() toggle (Redash behavior)
```

- [ ] **Step 1: Write failing tests for `dashboardLifecycle.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { canArchive, canPublish, canUnpublish, nextAutoRefreshLabel } from '#/lib/dashboardLifecycle'

describe('dashboardLifecycle', () => {
  it('publish only from draft', () => {
    expect(canPublish('draft')).toBe(true)
    expect(canPublish('published')).toBe(false)
    expect(canPublish('archived')).toBe(false)
  })
  it('unpublish only from published', () => {
    expect(canUnpublish('published')).toBe(true)
    expect(canUnpublish('draft')).toBe(false)
  })
  it('archive from draft or published', () => {
    expect(canArchive('draft')).toBe(true)
    expect(canArchive('published')).toBe(true)
    expect(canArchive('archived')).toBe(false)
  })
  it('labels auto-refresh intervals', () => {
    expect(nextAutoRefreshLabel(null)).toBe('Off')
    expect(nextAutoRefreshLabel(60)).toBe('1 minute')
    expect(nextAutoRefreshLabel(1800)).toBe('30 minutes')
  })
})
```

- [ ] **Step 2: Run to fail; implement; run to pass** (`npm test -- dashboardLifecycle`).
- [ ] **Step 3: Implement `DashboardHeader` + `DashboardPage`**, wire the route, extend `useWorkspaceDashboards`, delete the two legacy routes. New-dashboard flow: `src/routes/dashboards.add.tsx` becomes a simple name dialog → `addDashboard(name)` → navigate to `/dashboards/$id?edit=true` (strip the old wizard usage here; full wizard removal is Task 15).
- [ ] **Step 4: Browser verification (full loop).** Dev server: create dashboard → lands in edit mode → Add Widget (pick query + viz) → widget renders data → drag/resize → Done Editing → positions persist on reload → Add Textbox renders markdown → Publish clears the "Unpublished" badge → Refresh re-runs queries → Duplicate creates "Copy of: ..." → Archive removes from list. Fix what fails.
- [ ] **Step 5: Type-check + commit** — `npx tsc --noEmit; git add -A; git commit -m "feat: redash dashboard page with publish lifecycle"`

---

### Task 11: Tags, favorites, and the dashboard list page

**Files:**
- Create: `src/lib/api/favorites.ts` + `src/hooks/useFavorites.ts`
- Create: `src/components/dashboard/redash/TagsEditor.tsx`
- Create: `src/components/dashboard/redash/FavoriteStar.tsx`
- Rewrite: `src/routes/dashboards.index.tsx` (Redash dashboard list)
- Modify: `src/components/dashboard/redash/DashboardHeader.tsx` (mount star + `TagsEditor` in the slots left in Task 10)

**Interfaces:**
- Consumes: Task 2 `favorites` table, Task 10 header slots, `useWorkspaceDashboards` (now exposing `tags`/`status` updates).
- Produces:

```ts
// useFavorites()
{
  favorites: { objectType: 'dashboard' | 'query'; objectId: string }[]
  isFavorite: (type: 'dashboard' | 'query', id: string) => boolean
  toggleFavorite: (type: 'dashboard' | 'query', id: string) => Promise<void>
}
// demo mode: zustand-persisted in dashboardStore (same dual pattern as everything else)

<FavoriteStar objectType objectId />      // ☆/★ toggle, Redash yellow when active
<TagsEditor tags={string[]} allTags={string[]} onChange />  // inline chips + "Add tag" popover
```

List page (match Redash's dashboard list):
- Left rail: tag filter (all distinct tags across dashboards, click to filter, counts).
- Tabs: `All Dashboards` / `Favorites` / `My Dashboards` (My = created in this workspace session; if no creator field exists, omit this tab — do NOT add a creator column in this task).
- Search input filtering by name. Table columns: star | name (+ "Unpublished" badge for drafts, tag chips) | last updated. Sorted by `updatedAt` desc.
- Archived dashboards are excluded. `status === 'archived'` never shows here.
- "New Dashboard" button (top right) → the Task 10 name dialog.

- [ ] **Step 1: Implement favorites API/hook (+ demo store), verify with a store test** in `src/stores/dashboardStore.test.ts`: toggle twice returns to not-favorite:

```ts
it('toggles favorites', () => {
  const s = useDashboardStore.getState()
  s.toggleFavorite('dashboard', 'd1')
  expect(s.isFavorite('dashboard', 'd1')).toBe(true)
  s.toggleFavorite('dashboard', 'd1')
  expect(s.isFavorite('dashboard', 'd1')).toBe(false)
})
```

- [ ] **Step 2: Run to fail; implement; run to pass.**
- [ ] **Step 3: Implement `TagsEditor` + `FavoriteStar`, mount in header;** tags persist via `updateDashboard(id, { tags })`.
- [ ] **Step 4: Rewrite the list page** per the spec above.
- [ ] **Step 5: Browser verification:** star a dashboard → appears under Favorites tab; add tag → filterable from left rail; draft shows "Unpublished" badge; archived dashboard absent.
- [ ] **Step 6: Type-check + commit** — `git add -A; git commit -m "feat: tags favorites and redash dashboard list"`

---

### Task 12: Share dialog + public dashboard route

**Files:**
- Create: `src/components/dashboard/redash/ShareDashboardDialog.tsx`
- Modify: `src/components/dashboard/redash/DashboardHeader.tsx` (enable the Share button)
- Modify: `src/routes/shared.$token.tsx` (render the Redash public dashboard view)
- Read first: `supabase/functions/create-shared-link/index.ts`, `supabase/functions/shared-link-access/index.ts`, `src/lib/sharedLinkCrypto.ts`, and the current `shared.$token.tsx` — these already implement token-based sharing. REUSE their contract; do not invent a parallel mechanism.

**Interfaces:**
- Produces:

```tsx
<ShareDashboardDialog open dashboardId onClose />
// Redash's sharing dialog: toggle "Allow public access" →
//   ON: call create-shared-link for this dashboard, show "Secret address" read-only
//       input with the URL + copy button
//   OFF: revoke the link (however the existing edge functions model revocation;
//        if they don't, add a `revoked` flag to the shared-link record in a
//        migration 0031_shared_link_revoke.sql and honor it in shared-link-access)
```

Public route: reuses `DashboardGrid` with `editing={false}` and a minimal chrome (dashboard name, last-refresh, DIMES-BI logo footer — Redash shows its logo on public dashboards). Dashboard-level parameter bar still works (Task 13). No auth required; data access goes through the existing `shared-link-access` edge function pattern (verify how it fetches data for anonymous users; widgets on the public route must load query results through that function, not the authed client — if the current function only returns the dashboard definition, extend it to also execute the dashboard's queries server-side and return results keyed by queryId).

- [ ] **Step 1: Read the four existing files listed above; write a short contract note** at the top of `ShareDashboardDialog.tsx` documenting the token flow you found.
- [ ] **Step 2: Implement the dialog + header wiring.**
- [ ] **Step 3: Implement/adjust the public route** (and edge-function extension if required).
- [ ] **Step 4: Browser verification:** publish a dashboard → Share → enable public access → open the secret URL in an incognito/logged-out window → dashboard renders read-only with live data; disable access → URL stops working.
- [ ] **Step 5: Type-check + commit** — `git add -A; git commit -m "feat: dashboard share dialog and public view"`

---

### Task 13: Parameters end-to-end — declaration UI, dashboard parameter bar, widget-level inputs

**Files:**
- Create: `src/components/data/QueryParametersEditor.tsx` (declare params on a query)
- Create: `src/components/dashboard/redash/ParameterBar.tsx` (dashboard-level)
- Create: `src/components/dashboard/redash/ParameterInput.tsx` (one input, per-type)
- Modify: `src/components/data/QueryEditor.tsx` (mount `QueryParametersEditor`; filter rows get a "bind to parameter" select showing declared params — sets `filter.param`)
- Modify: `src/components/dashboard/redash/DashboardPage.tsx` (compute dashboard-level params; render `ParameterBar`; pass values down)
- Modify: `src/components/dashboard/redash/VisualizationWidget.tsx` (widget-level param inputs above the viz; "Edit Parameters" kebab item opens `ParameterMappingForm` from Task 9 in a dialog)

**Interfaces:**
- Consumes: Tasks 5, 6, 8, 9, 10.
- Produces:

```tsx
<ParameterInput parameter={QueryParameter} value onChange />
// text → Input; number → Input type=number; enum → Select of enumOptions;
// date → shadcn date picker; date-range → two date pickers;
// query → Select fed by first column of that query's result (useVisualizationResult).

<ParameterBar
  parameters={QueryParameter[]}   // deduped dashboard-level params across widgets
  values={ParameterValues}
  onApply={(values) => void}
/>
// Redash behavior: inputs stage locally; [Apply Changes] button appears when dirty;
// Apply updates values → widgets re-run.

<QueryParametersEditor parameters value onChange />
// list of declared params: name, title, type, default, enumOptions (textarea, one per line)
```

Dashboard-level param computation (in `DashboardPage`): for each widget → its query's `usedParameters` → mappings with `type === 'dashboard-level'` → group by `mapTo`; first occurrence's definition wins (title/type/default). Pass `dashboardParamValues` into `DashboardGrid` → `VisualizationWidget` → `resolveWidgetParameters` → `useVisualizationResult`.

- [ ] **Step 1: Implement `ParameterInput` + `QueryParametersEditor` + QueryEditor filter binding.**
- [ ] **Step 2: Implement `ParameterBar` + DashboardPage computation + widget-level inputs + Edit Parameters dialog.**
- [ ] **Step 3: Browser verification:** declare an enum param on a query, bind a filter to it → add to dashboard mapped dashboard-level → param bar appears → change value + Apply → widget data changes; second widget mapped to the same dashboard param follows the same value; a widget-level mapping shows its own input inside the widget frame; static mapping shows no input and pins the value; public route (Task 12) param bar also works.
- [ ] **Step 4: Type-check + commit** — `git add -A; git commit -m "feat: redash parameters end to end"`

---

### Task 14: One-time migration of existing dashboards to the Redash model

**Files:**
- Create: `src/lib/legacyWidgetMigration.ts` + Test: `src/lib/legacyWidgetMigration.test.ts`
- Create: `scripts/migrate-dashboards.ts` (run with `npx tsx scripts/migrate-dashboards.ts`; add `tsx` as a dev dep)

**Interfaces:**
- Consumes: legacy `DashboardDefinition.widgets` (`Record<string, WidgetConfig>` — see `src/types/dashboard.ts` `WidgetType`, `bindings`) + `layout` (react-grid-layout items), Task 3 APIs.
- Produces:

```ts
export interface MigrationPlanItem {
  widgetId: string
  action: 'visualization' | 'textbox' | 'skip'
  vizType?: RedashVisualizationType
  vizOptions?: Record<string, unknown>
  downgraded: boolean           // true when the legacy type has no Redash equivalent
  reason?: string               // e.g. "radar → CHART(line)"
  position: WidgetPosition
  queryId?: string
  text?: string
}
export function planWidgetMigration(dashboard: DashboardDefinition): MigrationPlanItem[]
```

Type mapping table (encode exactly; `bindings.xKey`→columnMapping x, `bindings.yKey`→y):

| Legacy `WidgetType` | Redash viz | options | downgraded |
|---|---|---|---|
| `table` | `TABLE` | `{}` | no |
| `text` | textbox widget | `options.body` string → `text` | no |
| `kpi` | `COUNTER` | `{ counterColName: bindings.valueKey ?? first agg alias, rowNumber: 1 }` | no |
| `bar`, `histogram` | `CHART` | `globalSeriesType: 'column'` | no |
| `stacked_bar` | `CHART` | `column` + `series: { stacking: 'stack' }` | no |
| `horizontal_bar` | `CHART` | `column`, `swappedAxes: true` | no |
| `line` | `CHART` | `line` | no |
| `area`, `stacked_area` | `CHART` | `area` (+stacking for stacked) | no |
| `pie`, `donut` | `CHART` | `pie` | no |
| `scatter`, `bubble` | `CHART` | `scatter` (bubble: sizemode if `bindings.sizeKey`) | bubble: yes |
| `heatmap` | `CHART` | `heatmap` | no |
| `funnel` | `FUNNEL` | `{}` | no |
| `sankey` | `SANKEY` | `{}` | no |
| `sunburst` | `SUNBURST_SEQUENCE` | `{}` | no |
| `treemap`, `graph`, `radar`, `boxplot`, `candlestick`, `gauge`, `waterfall`, `composed` | `CHART` type `column` (boxplot → `box`) | closest series | yes |

Position: read the legacy `layout` item for the widget id; legacy grid used 12 cols — halve `x`/`w` (round, min 1) to fit 6 cols; keep `y`/`h`.

The script: iterates dashboards (Supabase service-role client from env vars `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — read from `.env`, never commit values), runs `planWidgetMigration`, creates visualizations (name = legacy widget title, on the widget's `dataSourceId` query; skip + report widgets with no `dataSourceId`) and `dashboard_widgets` rows, prints a per-dashboard report (created / downgraded / skipped with reasons) and does NOT delete the legacy jsonb (cleanup is Task 15). Idempotency: skip dashboards that already have rows in `dashboard_widgets`.

- [ ] **Step 1: Write failing tests for `planWidgetMigration`** covering: bar widget → CHART/column with columnMapping from bindings; text widget → textbox action with body; radar → downgraded CHART with reason; widget without dataSourceId → skip; 12→6 column position halving (`x:6,w:6` → `col:3,sizeX:3`).

```ts
import { describe, expect, it } from 'vitest'
import { planWidgetMigration } from '#/lib/legacyWidgetMigration'
import type { DashboardDefinition } from '#/types/dashboard'

const dash = (widgets: DashboardDefinition['widgets'], layout: DashboardDefinition['layout']): DashboardDefinition => ({
  id: 'd1', name: 'D', createdAt: '', updatedAt: '', layout, widgets,
})

describe('planWidgetMigration', () => {
  it('maps a bar widget to CHART column with bindings', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'bar', title: 'Sales', dataSourceId: 'q1', bindings: { xKey: 'region', yKey: 'total' } } },
      [{ i: 'w1', x: 0, y: 0, w: 6, h: 8 }],
    ))
    expect(plan[0]).toMatchObject({
      action: 'visualization', vizType: 'CHART', downgraded: false, queryId: 'q1',
      position: { col: 0, row: 0, sizeX: 3, sizeY: 8 },
    })
    expect(plan[0].vizOptions).toMatchObject({
      globalSeriesType: 'column',
      columnMapping: { region: 'x', total: 'y' },
    })
  })
  it('maps text widgets to textboxes', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'text', title: 'Note', options: { body: '# hi' } } },
      [{ i: 'w1', x: 6, y: 0, w: 6, h: 4 }],
    ))
    expect(plan[0]).toMatchObject({ action: 'textbox', text: '# hi', position: { col: 3, row: 0, sizeX: 3, sizeY: 4 } })
  })
  it('downgrades radar with a reason', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'radar', title: 'R', dataSourceId: 'q1', bindings: {} } },
      [{ i: 'w1', x: 0, y: 0, w: 4, h: 8 }],
    ))
    expect(plan[0]).toMatchObject({ vizType: 'CHART', downgraded: true })
    expect(plan[0].reason).toContain('radar')
  })
  it('skips widgets without a query', () => {
    const plan = planWidgetMigration(dash(
      { w1: { id: 'w1', type: 'bar', title: 'B' } },
      [{ i: 'w1', x: 0, y: 0, w: 4, h: 8 }],
    ))
    expect(plan[0].action).toBe('skip')
  })
})
```

- [ ] **Step 2: Run to fail; implement `legacyWidgetMigration.ts`; run to pass.**
- [ ] **Step 3: Write the script; dry-run mode first** (`--dry-run` flag prints the plan without writing). Run dry-run against the linked project; review the report with the user BEFORE the real run. **Do not run the destructive step without explicit user confirmation.**
- [ ] **Step 4: Real run after approval; verify** a previously-built dashboard renders identically-ish under the new `DashboardPage`.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: legacy dashboard migration tooling"`

---

### Task 15: Legacy cleanup + Redash polish pass

**Files:**
- Delete: `src/components/dashboard/DashboardCanvas.tsx`, `DashboardWizard.tsx`, `WidgetRenderer.tsx`, `DashboardViewer.tsx`, `DashboardWorkspace.tsx`, `src/components/dashboard/redash/AddWidgetBar.tsx`, `WidgetTile.tsx` (superseded), `src/lib/widgetBindingHints.ts`, `src/lib/suggestBindings.ts`, `src/lib/widgetPalette.ts`, `src/lib/echartsWidgetOptions.ts`, `src/lib/widgetMeta.ts` + their tests, `src/routes/dev.viz-smoke.tsx`
- Modify: anything that imported the deleted modules (`rg` for each name; `src/routes/dashboards.*`, `src/lib/queryUsage.ts` widget-scanning must now scan `dashboard_widgets`/visualizations instead of dashboard jsonb)
- Modify: `src/types/dashboard.ts` — remove `layout`/`widgets`/`WidgetType`/`WidgetConfig` legacy fields ONLY IF nothing references them post-migration; otherwise mark `@deprecated` and file it in the commit message as follow-up.

- [ ] **Step 1: Update `queryUsage.ts`** (usage = visualizations on the query + dashboards whose widgets reference those visualizations) and fix its tests.
- [ ] **Step 2: Delete legacy modules; chase compile errors** until `npx tsc --noEmit` is clean and `npm test` passes.
- [ ] **Step 3: Polish pass against Redash.** Open app and https://redash.io demo screenshots / the Redash repo's `client/app/assets/less` for reference. Checklist: widget card border/radius/shadow, header typography, "Unpublished" badge style, edit-mode dashed grid background, bottom edit toolbar, modal copy ("Add to Dashboard", "Done Editing", "Archive Dashboard?"), parameter bar styling, public-view footer. Fix deviations in `redash.css` / components.
- [ ] **Step 4: Full regression in browser:** query → visualizations → dashboard build → params → publish → share → public view → list filters/tags/favorites → duplicate → archive. Demo mode (signed out) sanity check: dashboards + widgets still work locally.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "chore: remove legacy dashboard builder and polish redash parity"`

---

## Task dependency order

1 → 2 → 3 → {4, 5} → 6 → 7 → 8 → 9 → 10 → {11, 12, 13} → 14 → 15.
Tasks 4 and 5 are independent of each other; 11/12/13 are independent of each other after 10. Everything else is sequential.
