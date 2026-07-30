# Query pipeline rebuild — design

**Status:** Approved  
**Date:** 2026-07-30  
**Product:** DIMES-BI (`bi-dimes`)  
**Source:** `docs/query-builder-review.md`  
**Plan:** `docs/superpowers/plans/2026-07-30-query-pipeline-rebuild.md`

---

## 1. Problem

1. Aggregations are not type-aware — `SUM(Response ID)` (UUID/text) is allowed and yields meaningless KPI values (`0`/`1`).
2. Aggregation happens twice — the query aggregates, then KPI widgets re-average bound values (“Measure field (averaged)”).
3. Downstream gaps (multi-metric clarity, filters-by-type, date grains, computed fields, joins) keep the builder from feeling report-grade.

## 2. Goals

**North star:** The query fully defines the output shape. Widgets only bind to named result fields. One number → one clear computation path.

| Goal | Success |
|------|---------|
| Type-safe aggregations | UI + engine refuse `sum`/`avg` on non-numeric columns |
| Single aggregation layer | KPI shows the query result field value; no widget-side re-agg |
| Multi-metric queries | Several named aliases per query; preview = widget schema |
| Typed filters | Operators depend on column type; nested AND/OR readable |
| Date group grains | day/week/month/quarter/year on date columns |
| Computed fields | Safe post-agg formulas as named result columns |
| Joins | Two+ tables via simple key relationship; shared-query warnings retained |

**Non-goals (this rebuild):** Natural-language querying; soft-delete/orphan cleanup tooling; arbitrary SQL.

## 3. Architecture

Keep `QueryDefinition` as the durable asset (`query_definitions` row). Extend the DSL incrementally; widgets stay on `dataSourceId` + `bindings`.

```text
Sources (+ optional joins)
  → Filters (typed)
  → Group by (+ optional date grain)
  → Aggregations (typed, multi-metric, slug aliases)
  → Computed fields (optional)
  → Sort & limit (optional)
  → Result rows/columns
       ↓
  Widget bindings (xKey / yKey / measureKey) — no second aggregation
```

**Runtime:** Client `runQueryDefinition` (demo) and server `run-query` / edge paths must stay semantically aligned when DSL grows.

## 4. Phases (Approach A — vertical slices)

| Phase | Review items | DoD (shippable) |
|-------|----------------|-----------------|
| **1** | #1 + alias polish | Cannot SUM a UUID/text column; aliases like `sum_response_id` |
| **2** | #2 | KPI binds to result field; no avg-of-sum |
| **3** | #3, #7 (+ sort/limit) | Multi aliases + preview matches engine output |
| **4** | #5 | Operators by type; clearer nested groups |
| **5** | #6 | Group by month/week/… on date columns |
| **6** | #4 | Named computed metrics from result columns |
| **7** | #8 joins | Join two tables on a key; keep usage warnings |

Phase 0 in the plan covers shared helpers (`slugAlias`, column-type inference) used by Phase 1+.

## 5. Data model changes (incremental)

### 5.1 Column types

```ts
export type DataColumnType = 'string' | 'number' | 'boolean' | 'date'
```

- DB: widen `data_table_columns.data_type` check to include `'date'`.
- Inference: UUID-like / non-numeric strings stay `string`; ISO date/datetime samples → `date`.
- Import/admin: allow manual type override after import.

### 5.2 Aggregations

- Operators: `sum` | `avg` require `number`; `count` allowed on any column (or empty column = row count).
- Default alias: `slugAlias(\`${op}_${column}\`)` → `sum_response_id`.
- Validation helper shared by UI and engine.

### 5.3 Group by (Phase 5)

Migrate from `string[]` to:

```ts
export type QueryGroupBy =
  | string
  | { column: string; grain?: 'day' | 'week' | 'month' | 'quarter' | 'year' }
```

Persist in existing `group_by` jsonb/text[] carefully — prefer storing jsonb array of strings or objects; normalize legacy string arrays on read.

### 5.4 Computed fields (Phase 6)

```ts
export interface QueryComputedField {
  id: string
  alias: string
  expression: string // safe subset: refs to result column names + + - * / ( )
}
```

### 5.5 Joins (Phase 7)

```ts
export interface QueryJoin {
  id: string
  tableId: string
  type: 'inner' | 'left'
  leftColumn: string  // primary table
  rightColumn: string // joined table
}
```

Primary remains `tableId`; joins appended before filter.

### 5.6 Sort & limit (Phase 3)

```ts
sort?: { column: string; direction: 'asc' | 'desc' }[]
limit?: number | null
```

## 6. Widget binding contract (Phase 2)

| Widget | Binding | Behavior |
|--------|---------|----------|
| Charts | `xKey`, `yKey` | Map to result columns (unchanged) |
| KPI (query) | `bindings.measureKey` (or reuse `yKey`) | If 1 row: show that field. If 0 rows: empty. If many rows: show first row’s field **or** require aggregated query (prefer: show value from first row + caption “First row · field”; copy encourages aggregate queries for KPIs) |
| KPI (indicator) | `options.indicatorId` | Unchanged |
| Table | none | All result columns |

**Remove:** widget-side average of `rows[].value` for KPI query path.

## 7. Permissions & surfaces

- Shared `QueryEditor` remains the only authoring UI (Data Management + dashboard drawer).
- Export/promote stay Data Management–only.
- Shared-query usage warnings already shipped (`queryUsage.ts`); keep them.

## 8. Testing strategy

- Unit: inference, slug aliases, aggregation validation, engine behaviors per phase.
- Integration: preview hook returns same shape as `queryResultColumns`.
- Manual: import typed CSV → build SUM on volts → KPI shows SUM.

## 9. Out of scope / later

- NL/AI query generation  
- Soft delete of unused queries  
- Creation-source analytics  
- Full SQL / arbitrary expressions

## 10. Tracking

Checkboxes live in `docs/superpowers/plans/2026-07-30-query-pipeline-rebuild.md`. Update phase status there as work lands; link from `docs/query-builder-review.md`.
