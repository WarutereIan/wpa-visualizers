# Query Pipeline Rebuild Implementation Plan

> **For agentic workers:** Execute phase-by-phase. Prefer TDD for engine/helpers. Steps use checkbox (`- [ ]`) syntax for tracking. Spec: `docs/superpowers/specs/2026-07-30-query-pipeline-rebuild-design.md`. Review: `docs/query-builder-review.md`.

**Goal:** Rebuild the query pipeline so columns are type-aware, aggregation is single-layer, and the builder supports multi-metric output, typed filters, date grains, computed fields, and joins — without breaking `dataSourceId` widgets.

**Architecture:** Extend `QueryDefinition` + `runQueryDefinition` incrementally; shared `QueryEditor` enforces rules; widgets bind to result fields only. Align server `run-query` when DSL changes.

**Tech Stack:** TypeScript, Vitest, TanStack Query, Supabase (`data_table_columns`, `query_definitions`), react-querybuilder, React.

---

## Master checklist (progress)

| Phase | Name | Status |
|-------|------|--------|
| 0 | Shared helpers (slug + inference foundations) | ✅ Done |
| 1 | Type-aware columns + safe aggregations | ✅ Done |
| 2 | Collapse double aggregation (KPI bind-only) | ✅ Done |
| 3 | Multi-metric polish + honest preview + sort/limit | ✅ Done |
| 4 | Typed filter builder UI | ✅ Done |
| 5 | Date granularity in Group by | ✅ Done |
| 6 | Computed fields | ✅ Done |
| 7 | Joins (+ keep shared-query warnings) | ✅ Done |

**Legend:** ⬜ Not started · 🟡 In progress · ✅ Done

Update the table when a phase’s DoD is met.

---

## File map

| Area | Path |
|------|------|
| Types | `src/types/data.ts` |
| Inference / aliases | `src/lib/columnTypes.ts` (new), `src/lib/demoSeed.ts` |
| Aggregation rules | `src/lib/aggregationRules.ts` (new) |
| Engine | `src/lib/queryEngine.ts` (+ tests) |
| Result columns | `src/lib/queryResultColumns.ts` |
| Editor | `src/components/data/QueryEditor.tsx` |
| Defaults | `src/stores/dataStore.ts` (`createDefaultAggregation`) |
| KPI / canvas | `src/components/dashboard/widgets/KpiWidget.tsx`, `DashboardCanvas.tsx` |
| Dataset mapping | `src/hooks/useDemoDataset.ts` |
| Tables API | `src/lib/api/tables.ts` |
| Migration | `supabase/migrations/0024_column_type_date.sql` (Phase 1) |
| Edge query run | `supabase/functions/` (align when DSL changes, Phases 5–7) |

---

## Phase 0 — Shared helpers

### Task 0.1: Slug alias helper

**Files:**
- Create: `src/lib/slugAlias.ts`
- Create: `src/lib/slugAlias.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { slugAlias } from '#/lib/slugAlias'

describe('slugAlias', () => {
  it('lowercases and replaces non-alnum with underscore', () => {
    expect(slugAlias('sum_Response ID')).toBe('sum_response_id')
  })
  it('collapses repeated underscores and trims edges', () => {
    expect(slugAlias('__Sum  Volts__')).toBe('sum_volts')
  })
})
```

- [ ] **Step 2: Implement**

```ts
export function slugAlias(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
}
```

- [ ] **Step 3: Run** `npx vitest run src/lib/slugAlias.test.ts` — expect PASS

### Task 0.2: Column type inference module

**Files:**
- Create: `src/lib/columnTypes.ts`
- Create: `src/lib/columnTypes.test.ts`
- Modify: `src/lib/demoSeed.ts` — re-export or delegate `inferColumnsFromRows` to this module

- [ ] **Step 1: Tests for UUID → string, ISO date → date, numbers → number**

```ts
import { describe, expect, it } from 'vitest'
import { inferColumnType, inferColumnsFromRows } from '#/lib/columnTypes'

describe('inferColumnType', () => {
  it('keeps uuid-like strings as string', () => {
    expect(inferColumnType('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe('string')
  })
  it('detects ISO dates', () => {
    expect(inferColumnType('2024-01-15')).toBe('date')
    expect(inferColumnType('2024-01-15T12:00:00Z')).toBe('date')
  })
  it('detects numbers', () => {
    expect(inferColumnType(42)).toBe('number')
    expect(inferColumnType('3.14')).toBe('number')
  })
  it('detects booleans', () => {
    expect(inferColumnType(true)).toBe('boolean')
  })
})
```

- [ ] **Step 2: Implement `inferColumnType` + `inferColumnsFromRows` sampling multiple non-null values (majority / first decisive type)**
- [ ] **Step 3: Point `demoSeed.inferColumnsFromRows` at the new module (keep export for existing imports)**
- [ ] **Step 4: Run tests — PASS**

**Phase 0 DoD:** Helpers exist and are tested; no UI change required yet.

---

## Phase 1 — Type-aware columns + safe aggregations

### Task 1.1: Extend `DataColumnType` + DB check

**Files:**
- Modify: `src/types/data.ts` — add `'date'`
- Create: `supabase/migrations/0024_column_type_date.sql`

- [ ] **Step 1: Update type**

```ts
export type DataColumnType = 'string' | 'number' | 'boolean' | 'date'
```

- [ ] **Step 2: Migration**

```sql
-- Allow date columns in the virtual schema catalog
alter table public.data_table_columns
  drop constraint if exists data_table_columns_data_type_check;

alter table public.data_table_columns
  add constraint data_table_columns_data_type_check
  check (data_type in ('string', 'number', 'boolean', 'date'));

comment on column public.data_table_columns.data_type is
  'string | number | boolean | date — drives aggregation and filter operators';
```

- [ ] **Step 3: Apply to remote when ready** (`supabase db push` / MCP apply_migration)

### Task 1.2: Aggregation validation rules

**Files:**
- Create: `src/lib/aggregationRules.ts`
- Create: `src/lib/aggregationRules.test.ts`
- Modify: `src/stores/dataStore.ts` — `createDefaultAggregation` uses `slugAlias` + prefers first numeric column
- Modify: `src/lib/queryEngine.ts` — skip/zero-safe refuse invalid sum/avg (treat non-numeric as no contribution **and** document; prefer throwing or omitting invalid agg in strict mode — **strict: omit invalid measure and leave alias null, or throw in runQueryDefinition**)

**Decision (locked):** `runQueryDefinition` **throws** `Error('Aggregation sum requires a number column: …')` when operator is sum/avg and column type is not `number`. UI prevents the case; engine is the backstop.

- [ ] **Step 1: Tests for `operatorsForColumnType`, `isAggregationAllowed`, `defaultAggregationAlias`**
- [ ] **Step 2: Implement rules**
- [ ] **Step 3: Wire engine validation using `table.columns`
- [ ] **Step 4: Update `createDefaultAggregation(column, type?)` to default operator `count` for non-numeric, `sum` for numeric; alias via `slugAlias`

### Task 1.3: QueryEditor type-aware aggregation UI

**Files:**
- Modify: `src/components/data/QueryEditor.tsx` — `AggregationRow` receives `DataColumnDef[]`; filter operator dropdown; filter column dropdown for sum/avg to numeric only; show type badge

- [ ] **Step 1: Pass full column defs into AggregationRow**
- [ ] **Step 2: When operator is sum/avg, column `<select>` only lists `type === 'number'`**
- [ ] **Step 3: When user switches operator, if current column illegal, auto-pick first legal or clear**
- [ ] **Step 4: Alias field: on operator/column change, if alias still matches previous auto slug, refresh via `slugAlias`

### Task 1.4: Column type override surface

**Files:**
- Prefer: small type editor on Data Management table panel OR import review step
- Modify: tables update API if column type patch exists; else add `updateTableColumnType(tableId, columnName, type)` in `src/lib/api/tables.ts`

- [ ] **Step 1: Allow changing a column’s type in Data Management (per-table columns list)**
- [ ] **Step 2: Persist to `data_table_columns.data_type` when workspace-ready; demo store when local

### Task 1.5: Phase 1 verification

- [ ] Unit tests green for slug, columnTypes, aggregationRules, queryEngine rejection
- [ ] Manual: attempt SUM on Response ID — not offered; SUM on volts works
- [ ] Mark master checklist Phase 0 + 1 ✅

**Phase 1 DoD:** Cannot pick `SUM` on non-numeric columns; default aliases are slugified; `date` type exists in TS + DB.

---

## Phase 2 — Single aggregation layer (KPI)

### Task 2.1: KPI bind-only value

**Files:**
- Modify: `src/components/dashboard/widgets/KpiWidget.tsx`
- Modify: `src/hooks/useDemoDataset.ts` if KPI needs raw field (not remapped `value`)
- Modify: `src/components/dashboard/DashboardCanvas.tsx` — replace “averaged” copy; bind `yKey`/`measureKey` as display field
- Modify: `src/components/dashboard/WidgetRenderer.tsx` — pass measure key / raw rows to KPI

**Behavior:**
- Query KPI: read `bindings.yKey` (or `measureKey`) from first result row’s raw dataset (use `useDatasetRows`, not chart remapping).
- Caption: `From query · {field}` (not “Average from current query”).
- Multi-row without aggregate: show first row value + soft caption “First row”.

- [ ] **Step 1: Tests or story — KPI with one-row `{ sum_volts: 120 }` shows `120`**
- [ ] **Step 2: Remove `rows.reduce` average path for query KPIs
- [ ] **Step 3: Update canvas labels (“Measure field” not “averaged”)
- [ ] **Step 4: Mark Phase 2 ✅**

**Phase 2 DoD:** KPI of an aggregated query shows the query’s number, not avg-of-sum.

---

## Phase 3 — Multi-metric + preview + sort/limit

### Task 3.1: Multi-metric UX polish

**Files:** `QueryEditor.tsx`, `createDefaultAggregation`

- [ ] Editable alias always visible; helper text lists all result fields
- [ ] “Add aggregation” defaults to next unused numeric column when possible
- [ ] Ensure `queryResultColumns` lists all aliases (already does)

### Task 3.2: Preview = engine output

**Files:** `useRunQueryResult`, `QueryEditor` preview, server run-query

- [ ] **Step 1: Reproduce** — if preview shows raw rows with aggs set, find bug (stale query, wrong runner)
- [ ] **Step 2: Fix so preview headers === `queryResultColumns(query)` when rows non-empty
- [ ] **Step 3: Empty-state copy when aggregation invalid**

### Task 3.3: Sort & limit on `QueryDefinition`

**Files:** `src/types/data.ts`, `queryEngine.ts`, `QueryEditor.tsx`, API mappers for `query_definitions`

- [ ] Add optional `sort` + `limit`
- [ ] Apply after aggregation in engine
- [ ] Persist in existing JSON columns or new columns — prefer embedding in a jsonb `options` **or** top-level fields if API already spreads full definition; check `src/lib/api/queries.ts` and mirror fields

**Phase 3 DoD:** Multi aliases work; preview matches widgets; optional top-N.

---

## Phase 4 — Typed filters

### Task 4.1: Operator sets by type

**Files:** `src/types/data.ts` (add `between`, `in` if needed), `QueryEditor` / react-querybuilder field config, `queryEngine.ts`

- [ ] string: `eq`, `neq`, `contains`
- [ ] number/date: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`
- [ ] boolean: `eq`, `neq`
- [ ] Visual clarity for AND/OR groups (spacing, labels)

**Phase 4 DoD:** Changing column type changes available operators.

---

## Phase 5 — Date granularity

### Task 5.1: Group-by grain model + engine

**Files:** `src/types/data.ts`, `queryEngine.ts`, `QueryEditor.tsx`, normalize on read in `src/lib/api/queries.ts`

- [ ] Support `QueryGroupBy` string | `{ column, grain }`
- [ ] Bucket dates in engine; result column name = column or `column_month` style slug
- [ ] Align edge `run-query` / DuckDB path if used for parquet

**Phase 5 DoD:** Line chart can group by month of a date field.

---

## Phase 6 — Computed fields

### Task 6.1: Safe expression layer

**Files:** new `src/lib/queryComputed.ts`, types, engine post-pass, QueryEditor section

- [ ] Parse expressions referencing result column names only; ops `+ - * / ( )`
- [ ] Evaluate per output row after aggregations
- [ ] Alias slugified; appears in `queryResultColumns`

**Phase 6 DoD:** Query can expose `completion_rate = sum_reached / sum_target`.

---

## Phase 7 — Joins

### Task 7.1: Join model + engine + UI

**Files:** types, engine (join then filter), QueryEditor sources section, `queryUsage` warnings unchanged

- [ ] `joins: QueryJoin[]` on definition
- [ ] Column names from joined tables disambiguated (`table.column` or prefix) — pick one scheme and document
- [ ] Relationship picker: table + left/right keys
- [ ] Shared-query warnings remain

**Phase 7 DoD:** Query joins two imported tables on a shared key.

---

## Cross-cutting

- [x] Keep `docs/query-builder-review.md` linked to this plan + design
- [x] Update `docs/implementation-plan.md` B.9 when Phase 1–2 ship
- [x] Server/edge parity for joins / grains / computed / sort / limit (`run-query`, `indicatorQuery`, `queryCompiler`, DuckDB multi-URL)

---

## Execution notes

- Finish Phase N DoD before starting N+1 unless a tiny shared helper is needed.
- Prefer Vitest for pure functions; use existing demo tables for manual KPI checks.
- Do not commit unless the user asks.
