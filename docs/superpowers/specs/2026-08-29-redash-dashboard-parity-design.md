# Redash Dashboard Parity — Design

**Date:** 2026-08-29
**Status:** Approved design, pending implementation plan
**Product:** DIMES-BI (`bi-dimes`)

---

## 1. Goal

Make the DIMES-BI dashboard builder work and look like Redash — from the internal
component model (Query → Visualizations → Dashboard widgets) to the final look and
the publishing/sharing flow.

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Data model | Full Redash model: queries own visualizations; dashboard widgets reference a visualization (or are textboxes) |
| Query authoring | Keep the structured DSL query builder (no SQL editor). Redash parity starts at visualizations |
| Visualization layer | Adopt Redash's `viz-lib` (Editor + Renderer), vendored from `getredash/redash` master at the React 19 / antd 6 migration commit (PR #7669). The npm-published `@redash/viz` 0.1.1 is stale (antd 3/4, Plotly 1.52) and is NOT used |
| Chrome scope | Full parity: publish, public share URL, refresh + auto-refresh, favorites, tags, duplicate, archive, full-screen |
| Parameters | Full Redash-style parameters with dashboard-level / widget-level / static mapping |
| Build strategy | Vendor viz-lib as a workspace package; build the surrounding chrome natively in the existing stack (TanStack Start + Tailwind + shadcn), using Redash source as the visual reference. Prefer packages over from-scratch code |

Rejected: forking the full Redash client app (couples us to the Redash Flask/REST
backend and its job-polling execution model; the SQL-centric query pages would be
gutted anyway; would mean two frontend stacks in one product).

## 3. Data model (Supabase migrations)

### 3.1 `visualizations`

```
id uuid pk
query_id uuid fk → query_definitions (cascade delete)
type text — 'CHART' | 'TABLE' | 'COUNTER' | 'PIVOT' | 'FUNNEL' | 'SANKEY'
            | 'SUNBURST_SEQUENCE' | 'MAP' | 'CHOROPLETH' | 'COHORT'
            | 'WORD_CLOUD' | 'DETAILS'
name text
description text
options jsonb — viz-lib options shape for the type
created_at / updated_at
```

- RLS: same org scoping as `query_definitions`.
- Every query gets a default `TABLE` visualization on creation (app layer), matching Redash.

### 3.2 `dashboard_widgets`

Replaces the widgets-as-JSON blob in the dashboard row.

```
id uuid pk
dashboard_id uuid fk → dashboards (cascade delete)
visualization_id uuid fk → visualizations, nullable
text text — markdown body for textbox widgets
options jsonb — { position: {col, row, sizeX, sizeY}, parameterMappings: {...} }
created_at / updated_at
```

- A widget is a visualization widget XOR a textbox (`visualization_id` null ⇒ textbox).
- FK integrity enables real "used on N dashboards" warnings.

### 3.3 Dashboards

- Keep existing `status`: `draft` (= Redash "Unpublished") / `published` / `archived`.
- Add `tags text[]` with GIN index.
- New `favorites` table: `user_id, object_type ('dashboard'|'query'), object_id`, unique
  per (user, type, object). Favorites apply to dashboards and queries, as in Redash.

### 3.4 Parameters

- `query_definitions.parameters jsonb`: list of
  `{ name, title, type ('text'|'number'|'date'|'date-range'|'enum'|'query'), default, enumOptions?, queryId? }`.
- DSL filters may bind a value to a parameter: `{"param": "region"}` instead of a literal.
- Widget `options.parameterMappings` uses Redash's shape: per param
  `{ type: 'dashboard-level' | 'widget-level' | 'static', mapTo, value }`.

### 3.5 Public sharing

- Reuse `create-shared-link` / `shared-link-access` edge functions.
- Dashboard-scoped secret token, toggled in the Share dialog; public route is read-only.

### 3.6 One-time data migration

For each existing dashboard widget: create a visualization on its bound query
(mapping widget type + bindings → Redash chart `options`), then a `dashboard_widgets`
row with the widget's grid position. Types with no Redash equivalent (radar, gauge,
waterfall, candlestick, graph) fall back to `CHART` with the closest series type, or
`TABLE`; the migration emits a report of downgraded widgets.

## 4. Components & UX

Chrome is built natively (Tailwind/shadcn), continuing `src/components/dashboard/redash/`.
Packages: `react-grid-layout` (Redash's own grid; 6 columns, drag/resize only in edit
mode), `markdown-it` + `dompurify` for textboxes (Redash's combo), `antd@6` +
`plotly.js` as viz-lib peers.

- **Dashboard list**: search, tag filter sidebar, favorite stars,
  My Dashboards / All / Favorites tabs, "Unpublished" badges, New Dashboard modal
  (name → creates draft → opens edit mode).
- **Dashboard header**: inline-editable name, tag editor, star, "Unpublished" badge,
  `Publish` (drafts only), `Share`, `Refresh` + auto-refresh interval dropdown, kebab
  (Edit, Duplicate, Archive, Fullscreen, Unpublish).
- **Edit mode**: `Add Widget` / `Add Textbox` / `Done Editing`.
  - *Add Widget modal*: search queries → pick one of its visualizations → parameter
    mapping step (dashboard-level / widget-level / static per param).
  - *Add Textbox modal*: markdown textarea + preview.
- **Widget frame**: visualization name + linked query name, widget-level param inputs,
  "last refreshed X ago", kebab (Download CSV/Excel, Edit Parameters, Remove).
- **Parameter bar**: dashboard-level params pinned above the grid, Redash input types
  per param type, Apply behavior.
- **Visualization authoring**: in the existing `QueryEditor`, the results area becomes
  Redash's tab strip — `Table` (default) + saved visualizations + `+ New Visualization`
  opening viz-lib's Editor in a full modal (type picker + live preview).
- **Share dialog + public route**: "Allow public access" toggle → secret URL;
  `shared.$token` renders read-only, parameters usable.

Removed: per-widget config rail, `AddWidgetBar`, binding-hint system, widget-type
palette, `DashboardWizard` (reduced to the New Dashboard modal). Visualization config
lives on the query; placement lives in the Add Widget modal.

## 5. viz-lib integration & execution

- **Vendoring**: copy `viz-lib` into `packages/redash-viz` as an npm workspace, pinned
  to the React 19 / antd 6 commit. Updates = re-sync from upstream.
- **Styling isolation**: antd 6 is CSS-in-JS; scoped to viz surfaces. ECharts/Recharts
  remain on non-dashboard surfaces for now.
- **Result adapter** (`src/lib/redashResult.ts`): run DSL query via existing runtime
  (local rows / `run-query` edge function) → Redash `{columns: [{name, type,
  friendly_name}], rows}` consumed by viz-lib Renderer/Editor. Column types map from
  `columnTypes.ts`. Parameter values substitute into DSL filter bindings pre-execution.
- **Refresh**: manual Refresh re-executes all widget queries (per-widget nonce);
  auto-refresh interval; in-memory "last refreshed" timestamps. No server-side result
  cache in v1 (possible later phase mirroring Redash `query_results`).

## 6. Testing

- Vitest units: result adapter, parameter substitution, widget-type → Redash options
  migration mapping, publish/share permission rules.
- Existing query-engine tests unchanged.
- Manual browser pass against a reference Redash instance for look/behavior parity.

## 7. Build order (high level)

1. Vendor viz-lib workspace + peers, render a hard-coded chart to prove the stack.
2. Migrations: `visualizations`, `dashboard_widgets`, tags, favorites, parameters.
3. Result adapter + default TABLE visualization on query create.
4. Visualization tabs + Editor modal in `QueryEditor`.
5. Dashboard page: grid, widget frames, edit mode, Add Widget / Add Textbox modals.
6. Publish flow, Share dialog + public route, Refresh/auto-refresh, favorites, tags,
   duplicate, archive, fullscreen.
7. Parameters: query param definitions, mapping UI, parameter bar.
8. One-time data migration for existing dashboards + report.
9. Cleanup (remove legacy builder components) + Redash side-by-side polish pass.

## 8. Out of scope

- SQL editor / schema browser (DSL stays).
- Redash alerts/query snippets/admin pages.
- Server-side cached query results (v1 runs live).
- Natural-language querying (already deferred elsewhere).
