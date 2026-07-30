# Query builder & dashboard data flow — analysis & shipped status

**Status:** Implemented (except natural-language querying)  
**Date:** 2026-07-30 (updated)  
**Product:** DIMES-BI (`bi-dimes`)  
**Audience:** Product, design, engineering

---

## 1. Executive summary

Query authoring and dashboard building used to be **two separate products**. Users had to define a reusable query in Data Management, then bind widgets by ID with incomplete field pickers.

**Shipped direction:** Keep saved queries as the storage model (`WidgetConfig.dataSourceId` → `query_definitions`), but **create-or-pick query authoring lives in the dashboard widget config panel**. Data Management remains the full admin surface. Field pickers use **result columns** (groupBy ∪ aggregation aliases). Natural-language / AI query generation is explicitly deferred.

---

## 2. Current state (post-fix)

### 2.1 Concepts

| Concept | Where it lives | Role |
|--------|----------------|------|
| `DataTable` | Import / demo / `data_tables` | Source schema + rows |
| `QueryDefinition` | Data Management + dashboard drawer / `query_definitions` | Reusable DSL |
| `WidgetConfig` | Dashboard JSON | Viz type, title, `dataSourceId`, `bindings`, optional `options.indicatorId` for KPIs |
| Runtime | `useDemoDataset` / `useDatasetRows` | Look up query → run → chart/table rows |

### 2.2 User flow

```text
Import / seed tables
        │
        ▼
Dashboards → Build (DashboardCanvas)          Data Management (admin)
  · Add widget (no auto-bind)                   · Full query catalog CRUD
  · Pick existing query OR New query            · Export CSV / promote parquet
  · Edit query in drawer (shared QueryEditor)   · Usage warnings on shared queries
  · Bind X/Y from queryResultColumns()
  · KPI: query aggregate OR MEAL indicator
        │
        ▼
Dashboard view — widgets re-run query by id (or load indicator value)
```

### 2.3 Key modules

| Area | Path |
|------|------|
| Shared editor | `src/components/data/QueryEditor.tsx` |
| Result columns | `src/lib/queryResultColumns.ts` |
| Usage / naming | `src/lib/queryUsage.ts` |
| Canvas | `src/components/dashboard/DashboardCanvas.tsx` |
| Empty widget state | `src/components/dashboard/WidgetRenderer.tsx` |
| Admin queries | `src/routes/data-management.tsx` |

---

## 3. Issues from the original analysis — disposition

| Issue | Status |
|-------|--------|
| Context switch / create-or-pick in widget config | **Done** — Pick / New / Edit drawer |
| Premature abstraction / discoverability | **Done** — copy + empty states teach select-or-create |
| Empty / wrong defaults (`queries[0]` auto-bind) | **Done** — new widgets start unbound |
| Selected vs result columns | **Done** — `queryResultColumns()` |
| Opaque bindings | **Done** — labels explain dimension/measure + result columns |
| Narrow config rail | **Done** — drawer for authoring; pick/bind stay in panel |
| Duplicate query UIs | **Done** — shared `QueryEditor` |
| Inline DSL on widgets | **Rejected** — keep `dataSourceId` |
| Shared-query edit/delete warnings | **Done** — amber banners + delete confirm with usage count |
| Auto-naming widget-created queries | **Done** — `{title} · {table}` via `suggestWidgetQueryName` |
| KPI: query aggregate OR MEAL indicator | **Done** — measure source picker on KPI widgets |
| Admin-only actions in embedded editor | **Done** — export/promote only on Data Management `tableActions` |
| Mobile / narrow drawer | **Done** — full-viewport drawer on small screens |
| Honest empty widget chrome | **Done** — “Select or create a query” |
| Natural-language / AI querying | **Deferred** (explicitly out of this pass) |
| Cross-widget linked filters | Non-goal |
| Creation-source analytics | Deferred (optional later) |

---

## 4. Goals (met)

1. **Dashboards first** — define what a widget measures without a mandatory Data Management detour.  
2. **Reusable when useful** — queries remain first-class shared assets.  
3. **Variables = result columns** — bindings match the query engine.  
4. **Admin path preserved** — tables, promote, export, catalog in Data Management.  
5. **Honest empty states** — no silent unrelated data.

---

## 5. Architecture

```text
DashboardCanvas widget config
  ├─ KPI: measure source = query | MEAL indicator
  ├─ Pick existing query (dataSourceId)
  ├─ New query → createQuery (auto-named) → QueryEditor drawer
  ├─ Edit query → updateQuery + shared-usage warning
  └─ Bind X/Y (or KPI measure) from queryResultColumns(query)

Data Management
  └─ Same QueryEditor + usage banner + delete confirm + table admin
```

**Storage / runtime:** Unchanged — `dataSourceId` + `bindings`; KPI may use `options.indicatorId` instead.

---

**Layout & builder UX (2026-07-30):** Dashboard canvas is full-height with a compact add rail, selection-only config, mobile Canvas/Add/Config tabs, and a side query editor. Query builder uses an app-shell height with catalog + form|preview split. See `QueryEditor` (`splitPreview`) and `DashboardCanvas`.

## 6. Remaining follow-ups (not blocking)

1. Natural-language / AI query generation.  
2. Soft-delete / orphan-query cleanup tooling.  
3. Optional analytics: created-from dashboard vs Data Management.  
4. Broader RLS / Phase B verification (separate from this UX work).

---

## 7. One-line north star

**Users decide what a widget measures while they build the dashboard; reusable queries remain the durable asset behind that decision, not a mandatory earlier step.**
