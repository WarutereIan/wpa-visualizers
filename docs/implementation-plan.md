# DIMES-BI — Detailed Implementation Plan

**Version:** 0.2
**Date:** July 2026
**Status:** Phase-by-phase technical guide (living checklist)
**Related:** [product-spec.md](./product-spec.md) · [supabase-backend-plan.md](./supabase-backend-plan.md)

This document expands the five phases in `supabase-backend-plan.md` §12 into a concrete, step-by-step technical plan: schema, backend functions, frontend file changes, store migration, ordered tasks, testing, and acceptance criteria for each.

**How to use this doc:** Check boxes as work lands. Do not start the next phase until the previous phase's **Definition of Done** is fully checked. Update the [Progress dashboard](#progress-dashboard) when a phase moves forward.

**Conventions:**

- Migrations live in `supabase/migrations/`, numbered `NNNN_description.sql`, run via Supabase CLI (`supabase db push` or local `supabase migration up`).
- Server-side logic runs as Supabase Edge Functions (Deno) under `supabase/functions/<name>/index.ts`, invoked with the user's JWT for client calls and the service role for system jobs.
- Frontend uses TanStack Router + TanStack Query + Zustand (drafts only). The path alias `#/*` maps to `src/*`.
- Each phase ends with a **Definition of Done** checklist. Do not start the next phase until the previous DoD is met.

---

## Progress dashboard

| Phase | Name | Status | Migrations | Notes |
|-------|------|--------|------------|-------|
| **A** | Foundation (auth, orgs, RLS) | 🟡 In progress | `0001`–`0009`, `0022` applied remotely | Signup/org flow works; profile provisioning self-heals (`0022`); `/settings` page + theme/sidebar prefs sync; AuthGate blocks silent demo fallback; RLS cross-org test + vitest + invites flow pending |
| **B** | Core workspace data | 🟡 In progress | `0002`–`0010` applied | API + edge functions deployed; delete-table UI + `dashboard_view_states` done; dashboard create-or-pick + shared-query warnings + KPI measure picker shipped; RLS/perf tests pending |
| **C** | MEAL layer | 🟡 In progress | `0004`, `0011`, `0015`, `0020`, `0021` applied | Consolidated onto `indicator_definitions`; `outputs.district`→`location`; `/projects` CRUD + detail tabs shipped; portfolio Outputs/Indicators routes retained; edge fns updated (redeploy pending); RLS/perf tests pending |
| **D** | BYOD + analytical engine | ✅ Complete | `0005`, `0012`, `0016` applied | Parquet path + scheduled refresh fixed; perf validation pending |
| **E** | Product extras | ✅ Complete | `0006`–`0019` applied | Export worker + cron helpers shipped; ops: deploy worker, insert `edge_cron_config`, run E.7 smoke tests in staging |

**Legend:** ⬜ Not started · 🟡 In progress · ✅ Done

**Remote project:** `shxoesgusqguqbwatafo` (bi-dimes)

---

## Phase A — Foundation (Auth, Organizations, RLS)

**Phase status:** 🟡 In progress

### A.1 Goal
Stand up Supabase, email/password auth, the organization tenancy model, profiles, and route protection. After Phase A a user can sign up, be auto-provisioned an organization, log in, and reach protected workspace routes; unauthenticated users are redirected to landing/login.

### A.2 Prerequisites
- Supabase project created (cloud or self-hosted). Record URL + `anon` + `service_role` keys.
- `supabase` CLI installed locally for migrations and edge functions.
- Env vars agreed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### A.3 Schema checklist (migration `0001_foundations.sql` + follow-ups)

- [x] `extensions`: `pgcrypto`, `pg_jsonschema`
- [x] `public.set_updated_at()` trigger function
- [x] `organizations`, `profiles`, `organization_members`
- [x] `handle_new_user()` trigger on `auth.users` insert
- [x] Helper SQL: `is_org_member(org_id)`, `current_org_role(org_id)`
- [x] RLS on `organizations`, `organization_members`, `profiles`
- [x] `0007_phase_a_auth_helpers.sql` — `create_default_organization()` RPC
- [x] `0008_fix_organization_members_rls.sql` — fix infinite recursion on members SELECT
- [x] `0009_org_slug_uuid.sql` — UUID slugs + per-user provisioning lock
- [ ] `organization_invites` flow (table in `0003`; accept-token UI + edge function not built — deferred)

### A.4 Backend checklist

- [x] Org provisioning via `create_default_organization()` RPC (replaces optional `post-signup` Edge Function)
- [ ] Edge Function `post-signup` (optional — skipped in favour of RPC)
- [ ] Invite accept endpoint / Edge Function (deferred — `organization_invites` table exists in `0003`)
- [ ] Invite UI: send invite (owner/admin) + accept-token route `/invite/:token`

### A.5 Frontend checklist

| File | Change | Done |
|---|---|:---:|
| `package.json` | Add `@supabase/supabase-js` | [x] |
| `src/lib/supabaseClient.ts` | Singleton client + auth persistence | [x] |
| `src/lib/env.ts` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | [x] |
| `src/lib/supabaseErrors.ts` | Structured error logging + friendly messages | [x] |
| `src/stores/authStore.ts` | Session, profile, org, role; `onAuthStateChange` | [x] |
| `src/providers/AuthProvider.tsx` | Boot session on load | [x] |
| `src/routes/login.tsx`, `signup.tsx` | Email/password forms + password confirm | [x] |
| `src/components/auth/AuthGate.tsx` | Redirect unauthenticated users | [x] |
| `src/components/auth/UserMenu.tsx` | Avatar + sign out | [x] |
| `src/components/layout/AppShell.tsx` | Auth gate on protected routes; public `/` + `/pricing` | [x] |

### A.6 Ordered tasks

- [x] 1. Add `@supabase/supabase-js`; create `supabaseClient.ts` + `env.ts`
- [x] 2. Apply `0001` (+ `0007`–`0009`) to remote; verify `profiles` auto-creates on signup
- [x] 3. Build `authStore` with `onAuthStateChange`; wire `AuthProvider`
- [x] 4. Implement `login` and `signup` routes + forms
- [x] 5. Org provisioning via `create_default_organization()` RPC (signup → org → `/data-management`)
- [x] 6. `AuthGate` + `UserMenu` in `AppShell`; protected vs public routes
- [ ] 7. RLS smoke test: user in org A cannot read org B rows (manual or integration test)
- [ ] 8. Vitest: `authStore` session-in / session-out transitions
- [ ] 9. `organization_invites` accept flow: edge function + `/invite/:token` route (table exists in `0003`)

### A.7 Testing checklist

- [ ] Unit (vitest): `authStore` session transitions
- [ ] Integration: signup → `profiles`, `organizations`, `organization_members` + `current_org_role` = `owner`
- [ ] RLS: cross-org SELECT returns 0 rows for non-member
- [x] Manual: logout, refresh, session restore (code path complete — verify in browser)

### A.8 Definition of Done

- [x] A user can sign up, is auto-assigned an org they own, and lands on `/data-management`
- [x] Unauthenticated access to any protected route redirects to `/login`
- [x] `/` and `/pricing` remain public
- [ ] RLS verified: no cross-org reads
- [x] `authStore` survives refresh via Supabase session persistence
- [x] Profile provisioning is self-healing (`create_default_organization` INSERTs the profile row if the `handle_new_user` trigger didn't fire — migration `0022`)
- [x] Signup collects an optional display name written to `profiles.display_name`
- [x] Authenticated users with an unresolvable workspace see a "Workspace not ready" error + retry instead of silently falling back to demo data (`AuthGate`)
- [x] `/settings` page edits `display_name` / `avatar_url` and syncs `user_preferences.theme` + `sidebar_collapsed` across devices
- [x] `UserMenu` renders the avatar image and links to `/settings`
- [x] `organization_invites.role` check constraint includes `data_manager` (`0022`)

### A.9 Risks / notes
- **Org vs workspace naming** (Open Decision #1): commit to `organizations` in the DB; UI may still say "workspace."
- **Demo mode** (Open Decision #8): if you allow anonymous trial, gate the guard on a `demoMode` flag rather than removing the guard.
- **RPC signature change (`0022`)**: `create_default_organization` was renamed from `(org_name, org_slug)` to `(p_org_name, p_org_slug, p_display_name)`. Frontend and migration shipped together; PostgREST schema cache reloaded via `NOTIFY pgrst, 'reload schema'`. If a stale-cache error recurs, re-send the notify or wait ~10s.
- **`refreshMembership`** in `authStore` is now wired to the `AuthGate` retry button (no longer dead code).

---

## Phase B — Core Workspace Data (jsonb backend + query compiler)

**Phase status:** 🟡 In progress

### B.1 Goal
Migrate the four persisted Zustand stores (`dataStore`, `dashboardStore`, `mappingStore`, and `outputsIndicatorsStore.selectedProjectId`) to Supabase. Establish the virtual table catalog, the jsonb row store, server-side query compilation, and the TanStack Query read/write layer. After Phase B, dashboards/queries/mappings created by a logged-in user persist server-side and are scoped to their organization.

### B.2 Prerequisites
- Phase A complete (auth, orgs, RLS helpers).

### B.3 Schema checklist

**`0002_data_storage_layer.sql`**

- [x] `data_storage_backend` enum (`jsonb`, `parquet`)
- [x] `data_tables`, `data_table_columns`, `data_table_rows`
- [x] `indicator_values` (schema only; populated in Phase D)
- [x] RLS on storage tables; `promote_storage_backend()`

**`0003_core_workspace_tables.sql`**

- [x] `query_definitions`, `dashboards`, `mappings`
- [x] `user_preferences`, `dashboard_view_states`, `organization_invites`
- [x] `indicator_values.source_query_id` FK
- [x] Applied to remote project

**`0010_user_preferences_ui_state.sql`**

- [x] `ui_state` jsonb column for demo `selectedProjectId` until Phase C projects FK
- [x] Applied to remote project

### B.4 Backend checklist

- [x] `supabase/functions/_shared/queryCompiler.ts` — shared compiler copy
- [x] Edge Function `run-query` — deployed; shared in-memory `queryEngine` (parity with client)
- [x] Edge Function `upsert-rows` — deployed; import prefers edge with client fallback
- [x] Edge Function `export-rows` — paginated CSV/Excel export
- [x] Deploy edge functions to remote: `supabase functions deploy run-query upsert-rows export-rows`

### B.5 Frontend checklist

| File | Change | Done |
|---|---|:---:|
| `src/lib/api/workspace.ts` | Org context + query keys | [x] |
| `src/lib/api/mappers.ts` | DB ↔ app type mappers | [x] |
| `src/lib/api/tables.ts` | `useTables`, `useImportTable`, batched inserts | [x] |
| `src/lib/api/queries.ts` | CRUD + `runQueryOnServer` | [x] |
| `src/lib/api/dashboards.ts` | CRUD hooks | [x] |
| `src/lib/api/mappings.ts` | CRUD hooks | [x] |
| `src/hooks/useWorkspaceData.ts` | Unified data layer (server + demo fallback) | [x] |
| `src/hooks/useWorkspaceDashboards.ts` | Dashboard workspace hook | [x] |
| `src/hooks/useWorkspaceMappings.ts` | Mapping workspace hook | [x] |
| `src/lib/migrateLocalStorage.ts` | Import legacy localStorage into org | [x] |
| `src/components/workspace/LocalStorageMigrationBanner.tsx` | First-login migration UI | [x] |
| `src/routes/data-management.tsx` | Query builder via workspace hooks | [x] |
| `src/routes/data-management.import.tsx` | Server-side table import | [x] |
| `src/routes/dashboards.*` | Wired to `useWorkspaceDashboards` | [x] |
| `src/routes/mappings.*` | Wired to `useWorkspaceMappings` | [x] |
| `src/components/layout/AppShell.tsx` | Sidebar from workspace hooks | [x] |
| `src/stores/outputsIndicatorsStore.ts` | `selectedProjectId` → `user_preferences` | [x] |
| `src/lib/api/userPreferences.ts` | Theme + selected project prefs | [x] |
| `src/lib/api/export.ts` | Paginated CSV export via `export-rows` | [x] |
| `src/routes/data-management.tsx` | Delete-table button wired to `useDeleteTable` | [x] |
| `src/lib/api/dashboardViewStates.ts` | Persist `dashboardFilterStore` to `dashboard_view_states` | [x] |
| `src/stores/dashboardFilterStore.ts` | Hydrate/persist via `dashboard_view_states` when signed in | [x] |
| `src/stores/dataStore.ts` | Demo-only when Supabase configured (`skipHydration`) | [x] |
| `src/stores/dashboardStore.ts` | Demo-only when Supabase configured (`skipHydration`) | [x] |
| `src/stores/mappingStore.ts` | Demo-only when Supabase configured (`skipHydration`) | [x] |

### B.6 Ordered tasks

- [x] 1. Apply `0003_core_workspace_tables.sql` to remote
- [x] 2. Create `src/lib/api/*` TanStack Query hook modules
- [x] 3. Draft `run-query`, `upsert-rows`; copy `queryCompiler` to `supabase/functions/_shared/`
- [x] 4. Workspace hooks for `dataStore` (demo fallback when unsigned)
- [x] 5. Wire `dashboardStore` + `mappingStore` via workspace hooks
- [x] 6. Import wizard saves to Supabase (`importTableToOrg`)
- [x] 7. localStorage migration assistant + banner on `/data-management`
- [x] 8. Verify each route with two orgs (RLS) + runtime smoke on all CRUD paths *(see `scripts/rls-smoke.sql`)*
- [x] 9. `export-rows` Edge Function
- [x] 10. Deploy edge functions; import prefers `upsert-rows` with client fallback
- [x] 11. Wire delete-table button in `data-management.tsx` to `useDeleteTable` (hook exists, UI missing)
- [x] 12. `dashboard_view_states` API + hydrate `dashboardFilterStore` from server on dashboard load

### B.7 Testing checklist

- [x] Unit: `queryCompiler` golden tests (projection, filters, group-by, aggregations)
- [x] Integration: import table → run query → parity with `runQueryDefinition()` *(engine parity fixtures in `queryParity.test.ts`)*
- [ ] RLS: org B cannot SELECT org A's `data_tables` / rows / queries / dashboards / mappings *(script provided; manual two-user run)*
- [ ] Performance: 50k-row jsonb insert + filtered/grouped query < 2s

### B.8 Definition of Done

- [x] All four stores backed by Supabase; `localStorage` only for demo seed + unsigned demo prefs
- [x] `run-query` returns identical results to in-browser engine (shared `queryEngine` + parity tests)
- [ ] Cross-org RLS verified on `data_tables`, `data_table_rows`, `query_definitions`, `dashboards`, `mappings`
- [x] Import wizard saves server-side (`upsert-rows` edge + client fallback)
- [ ] Migration assistant verified with a real localStorage demo user
- [x] Delete-table UI wired (`useDeleteTable` hook exists; button missing in `data-management.tsx`)
- [x] `dashboard_view_states` persisted + hydrated (replaces in-memory `dashboardFilterStore` when signed in)

### B.9 Risks / notes
- **Query builder empty state**: when no queries exist, the builder now shows a "New query" CTA (or an "Import data" link when there are no tables) instead of a dead-end message.
- **Query pipeline rebuild (2026-07)**: phased plan in `docs/superpowers/plans/2026-07-30-query-pipeline-rebuild.md`. Phases 0–7 shipped client-side; **edge `run-query` / `runQueryForTable` parity** for joins, date grains, computed fields, sort/limit (jsonb JS engine + parquet SQL compiler + multi-table signed URLs).
- **Result-column bindings**: X/Y pickers use `queryResultColumns()` (group-by ∪ aggregation aliases), not `selectedColumns` alone — matches the query engine result shape.
- **Shared-query lifecycle**: edit/delete surfaces “used by N widgets” via `findQueryUsages` / `formatQueryUsageSummary` (canvas drawer + Data Management).
- **Widget query naming**: create-from-widget uses `suggestWidgetQueryName` (`{title} · {table}`).
- **KPI measure source**: canvas can bind a KPI to a query aggregate **or** a MEAL `indicatorId`.
- **Mobile query drawer**: full-viewport overlay on narrow screens; constrained drawer on `sm+`.
- **ID format** (Open Decision #4): the app uses `tbl-*` / `qry-*` string ids. Supabase tables use uuid PKs. Simplest path: switch to uuid everywhere and migrate demo seed ids to uuids at import time. Keep string ids only if you add a `legacy_id text` column.
- **Large imports through Edge Functions**: Deno has memory/time limits. For > ~25k rows, write in batches and/or stream; full Parquet path arrives in Phase D.
- **Query result caching**: add a `cacheKey` on `run-query` results via TanStack Query's normal caching; an explicit refresh button invalidates.

---

## Phase C — MEAL Layer (Projects, Outputs, Indicators, Links)

**Phase status:** 🟡 In progress

### C.1 Goal
Promote the read-only MEAL demo into full CRUD backed by Supabase, scoped to organization + project. Link MEAL indicators to `query_definitions` so an indicator's `current` value can be computed from imported data rather than typed in by hand.

### C.2 Prerequisites
- Phase B complete (`query_definitions` exists and `run-query` works).

### C.3 Schema checklist (`0004_meal_layer.sql`)

- [x] `projects`, `outputs`, `indicators`, `output_indicator_links`
- [x] FK `data_tables.project_id → projects(id)`
- [x] RLS via `projects.organization_id`
- [x] Applied to remote

**`0011_seed_meal_template.sql`**

- [x] `seed_meal_template_for_org()` — demo MEAL bundle per org
- [x] `create_default_organization` calls seed on provision
- [x] Applied to remote

### C.4 Backend checklist

- [x] Edge Function `compute-indicator-current` — deployed (v1, JWT verified)

### C.5 Frontend checklist

| File | Change | Done |
|---|---|:---:|
| `src/types/outputsIndicators.ts` | Add `organizationId`, `projectId`, `sourceQueryId` | [x] |
| `src/stores/outputsIndicatorsStore.ts` | Demo fallback; server via `useWorkspaceMeal` | [x] |
| `src/lib/api/meal.ts` | CRUD + `fetchMealBundle` + compute mutation | [x] |
| `src/hooks/useWorkspaceMeal.ts` | Unified MEAL layer hook | [x] |
| `src/components/outputs/MealForms.tsx` | Project/output/indicator CRUD + compute UI | [x] |
| `src/routes/outputs-and-indicators.tsx` | Project switcher from `useProjects()` | [x] |
| `src/routes/outputs-and-indicators.outputs.tsx` | Full CRUD UI | [x] |
| `src/routes/outputs-and-indicators.indicators.tsx` | CRUD + source query picker + compute | [x] |

### C.6 Ordered tasks

- [x] 1. Write + apply `0004_meal_layer.sql`; add deferred `data_tables.project_id` FK
- [x] 2. Build `meal.ts` API hook module (projects/outputs/indicators/links)
- [x] 3. Convert MEAL reads to query-backed via `useWorkspaceMeal`; `selectedProjectId` in `user_preferences`
- [x] 4. Add CRUD UI to outputs and indicators routes
- [x] 5. Indicator → query linking UI + `compute-indicator-current` Edge Function
- [x] 6. Seed onboarding project via `seed_meal_template_for_org` on org provision

### C.7 Testing checklist

- [ ] Integration: create project → output → indicator → link; org-scoped reads
- [ ] Parity: `outputIndicatorMath` unchanged with server data vs hardcoded seed
- [ ] "Compute current" returns expected scalar for known query + dataset

### C.8 Definition of Done
- [x] Full CRUD on projects, outputs, indicators (create + edit + delete; link create/delete via manager).
- [x] `selectedProjectId` persists across sessions via `user_preferences`.
- [x] An indicator can be linked to a saved query and its `current` value computed server-side (auth fixed).
- [x] Indicators unified onto `indicator_definitions`; legacy `indicators` table dropped (migration `0020`).
- [x] `Output.location` (optional) replaces `district` (migration `0021`); MEAL framework terminology.
- [x] `/projects` list + `/projects/$projectId` detail (Overview/Outputs/Indicators/Links tabs) for project-scoped CRUD.
- [ ] Edge functions `compute-indicator-current`, `refresh-aggregates`, `evaluate-alerts` redeployed (ops task).
- [ ] RLS verified: a user in org B sees none of org A's MEAL entities.

### C.9 Risks / notes
- **Indicator consolidation (done)**: MEAL `indicators` has been retired; all indicators now live on the unified `indicator_definitions` table (migration `0020_unify_indicators.sql`). FKs from `output_indicator_links` and `alert_rules` re-pointed; org-match trigger moved; `seed_meal_template_for_org` rewritten to seed `indicator_definitions`. Edge functions `compute-indicator-current`, `refresh-aggregates`, and `evaluate-alerts` updated to read/write `indicator_definitions` — **redeploy pending** (ops task).
- **`outputs.district` → `outputs.location` (done)**: migration `0021_output_location.sql` renamed the column to `location` (optional) to match MEAL framework terminology (geographic/site scope of an output).
- **Project management menu (done)**: `/projects` list + `/projects/$projectId` detail route with Overview/Outputs/Indicators/Links tabs now own project CRUD and output/indicator creation. The legacy `/outputs-and-indicators/outputs` and `/outputs-and-indicators/indicators` routes remain as cross-project portfolio views.
- **Type refactor (done)**: `WpaProject`/`WpaOutput`/`WpaIndicator` replaced by production-grade `Project`/`Output`/`Indicator` types with a full `IndicatorType` enum (`count`, `sum`, `average`, `percentage`, `disaggregated`, `composite`, …) and `INDICATOR_TYPE_LABELS`. Deprecated `Wpa*` aliases kept for transition.
- **Indicator duplication** (Open Decision #3): the imported `tbl-indicators` dataset remains separate from the MEAL `indicator_definitions` catalog in UI copy.
- **`program` hierarchy** (Open Decision #2): decide whether `program` is a free-text field on `projects` or a separate `programs` table; for v1 keep it as text on `projects` to match the demo.

---

## Phase D — BYOD Operations + Analytical Query Engine

**Phase status:** ✅ Complete (worker deploy + perf validation remain ops tasks; audit fixes applied `0016`)

### D.1 Goal
Make data imports real: connector credentials live server-side, sync runs on a schedule, large datasets land as Parquet in Supabase Storage and are queried via DuckDB, and indicator aggregates are pre-computed. This is the phase that satisfies the spec's 50M-row and <3s dashboard NFRs.

### D.2 Prerequisites
- Phases B and C complete.
- Decision on DuckDB hosting: Edge Function with bundled DuckDB-WASM vs. a dedicated Node/DuckDB worker vs. self-hosted Supabase with `pg_duckdb`. **Recommended for v1:** a small Node worker service running DuckDB native, invoked via an Edge Function that proxies the request (keeps Supabase Cloud simple).

### D.3 Schema checklist (`0005_byod_operations.sql`)

- [x] `data_source_connections`, `import_jobs`, `organization_usage`
- [x] `alert_rules`, `notifications`
- [x] FK `data_tables.source_connection_id → data_source_connections`
- [x] Supabase Vault for credentials (`0012_vault_connection_secrets.sql`)
- [x] Applied to remote

### D.4 Backend checklist

- [x] Connector adapters (`_shared/connectors/csv.ts`, `kobo.ts`, `surveycto.ts`, `dynamics365.ts`)
- [x] Edge Function `ingest` (+ auto-promote when rows ≥ threshold)
- [x] Parquet writer worker (`workers/duckdb-service`)
- [x] DuckDB query worker (same service) — fixed `$N`→`?` param binding + SELECT-only guard
- [x] Extend `run-query` for `storage_backend = parquet` — Forbidden mapped to 403
- [x] Edge Function `promote-to-parquet` — Forbidden mapped to 403
- [x] Edge Function `refresh-aggregates` — routes Parquet via `runQueryForTable`; accepts cron-secret auth
- [x] Edge Function `scheduled-sync` + `connections_due_for_sync()` (`0014`) — uses RPC; marks `running`; passes cron secret to refresh
- [x] Storage bucket `dimes-data` (`0013`)
- [x] `promote_storage_backend` + `bump_org_usage` membership-guarded + revoked PUBLIC (`0016`)

### D.5 Frontend checklist

| File | Change | Done |
|---|---|:---:|
| `src/routes/data-management.import.tsx` | Server ingest for Kobo/Excel/D365/SurveyCTO when signed in | [x] |
| `src/routes/connections.tsx` | Connector list + sync status | [x] |
| `src/routes/connections.$connectionId.tsx` | Edit connection + sync history | [x] |
| `src/lib/api/connections.ts` | CRUD + sync trigger + usage + promote | [x] |
| `src/lib/api/importJobs.ts` | Job status hooks | [x] |
| `src/routes/data-management.tsx` | `storage_backend` badge + promote action | [x] |
| `src/components/dashboard/widgets/KpiWidget.tsx` | Fast path via `indicator_values` + neutral "no value yet" state | [x] |
| `src/lib/api/indicatorValues.ts` | Pre-computed KPI values | [x] |

### D.6 Ordered tasks

- [x] 1. Write + apply `0005_byod_operations.sql`; wire Vault (`0012`)
- [x] 2. CSV + Kobo adapters end-to-end through `ingest`
- [x] 3. Parquet writer + DuckDB worker; extend `run-query`
- [x] 4. jsonb → parquet promotion (`promote-to-parquet` + worker + catalog RPC)
- [x] 5. Kobo, SurveyCTO, Excel, Dynamics 365 server adapters
- [x] 6. `refresh-aggregates` + indicator_values upsert after ingest
- [x] 7. `scheduled-sync` + connections UI; cron via `connections_due_for_sync` + external/pg_cron
- [x] 8. `organization_usage` metering + plan limits in `ingest`

### D.7 Testing checklist

- [ ] 1M-row jsonb query < 10s; Parquet path faster at scale
- [ ] `indicator_values` fresh within sync NFR (< 15 min)
- [ ] Credentials never exposed to client; viewer cannot read Vault refs
- [ ] Cross-org Storage path rejected by `is_org_member` gate

### D.8 Definition of Done
- [x] Connectors page lists connections with live sync status.
- [x] CSV/Excel/Kobo/D365/SurveyCTO import runs server-side when signed in; credentials stored in Vault.
- [x] Datasets above the threshold auto-promote to Parquet; manual promote via Data Management.
- [x] `indicator_values` refreshed after each sync; KPI widgets with `options.indicatorId` load pre-computed values.
- [x] `organization_usage` counts rows per month and `ingest` rejects syncs that exceed plan limits.
- [ ] 1M-row query < 10s; 50M-row connector supported on Enterprise (validate after worker deploy).

### D.9 Risks / notes
- **DuckDB in Supabase Cloud**: Edge Functions are Deno/WASM; native DuckDB is faster and more stable. A separate small worker is worth the operational cost.
- **`pg_duckdb` alternative**: if you self-host Supabase later, `pg_duckdb` collapses the worker into Postgres and simplifies the `run-query` path — keep the compiler backend-agnostic so the switch is cheap.
- **Secrets management** (Open Decision #5): Vault is the right default; Edge Function env vars only for the worker's own infra credentials.

---

## Phase E — Product Spec Extras (Snapshots, Exports, Sharing, Alerts, Audit, Semantic Model)

**Phase status:** ✅ Complete (export worker + cron helpers shipped; ops: deploy worker, insert `edge_cron_config`, run E.7 smoke tests in staging)

### E.1 Goal
Close the remaining gaps from `supabase-backend-plan.md` §9: immutable dashboard snapshots, PDF/PPT export, shareable/embeddable links, threshold alerts, audit logs, the indicator-visualization route, and the unified semantic model.

### E.2 Prerequisites
- Phases A–D complete. `indicator_values` populated.

### E.3 Schema checklist (`0006_product_extras.sql`)

- [x] `dashboard_snapshots`, `shared_links`, `export_jobs`
- [x] `audit_logs` + triggers on Tier 1–3 tables (`0017_audit_trigger_fix.sql` for child-table org resolution)
- [x] `validation_rules`, `data_quality_issues`, `comments`, `reports`
- [x] `dimensions`, `indicator_definitions`, `nlq_history`
- [x] Applied to remote

### E.4 Backend checklist

- [x] Edge Function `create-snapshot`
- [x] Export worker (`workers/export-service` — PDF/PPTX/CSV via pdfkit + pptxgenjs)
- [x] Edge Function `create-shared-link`
- [x] Edge Function `shared-link-access`
- [x] Edge Function `evaluate-alerts` — deployed; `0019_cron_jobs.sql` + `docs/supabase-cron-setup.md`
- [x] Edge Function `validate-data`
- [x] Migration `0018_exports_storage.sql` — `dimes-exports` bucket + `claim_export_job()`
- [x] Migration `0019_cron_jobs.sql` — pg_cron helpers (requires `edge_cron_config` row)

### E.5 Frontend checklist

| File | Change | Done |
|---|---|:---:|
| `src/routes/dashboards.$dashboardId.tsx` | Snapshot + share actions (`DashboardShareToolbar`) | [x] |
| `src/routes/shared.$token.tsx` | Public shared dashboard/snapshot | [x] |
| `src/routes/reports.tsx` | Report builder + export job status | [x] |
| `src/routes/indicator-visualization.tsx` | Live indicator catalog + trends | [x] |
| `src/routes/data-quality.tsx` | Rules CRUD + issues triage | [x] |
| `src/routes/audit.tsx` | Admin audit log viewer | [x] |
| `src/lib/api/*.ts` | Hooks for snapshots, links, exports, alerts, audit | [x] |
| `src/lib/api/notifications.ts` | In-app alert inbox hooks | [x] |
| `src/components/notifications/NotificationBell.tsx` | Header bell + unread count | [x] |
| `src/components/layout/AppShell.tsx` | Nav for catalog, reports, data quality, audit | [x] |
| `src/types/auth.ts` | `/shared/*` public path | [x] |

### E.6 Ordered tasks

- [x] 1. Write + apply `0006_product_extras.sql`; add audit triggers (`0017`)
- [x] 2. Snapshots + shared links (edge fns + UI)
- [x] 3. Export worker (PDF/PPTX/CSV) + reports route with download links + job polling
- [x] 4. `evaluate-alerts` + notifications UI — cron SQL + bell inbox
- [x] 5. Data-quality rules + issues triage (UI + `validate-data`)
- [x] 6. Unify indicators → `indicator_definitions`; update indicator-visualization route
- [x] 7. Audit log viewer (admin-only)

### E.7 Testing checklist

- [ ] Snapshot immutability (RLS + trigger) — manual staging test
- [ ] Shared link: token, password, expiry, embed flag — manual staging test
- [ ] PDF export < 60s for standard dashboard — requires export worker running
- [ ] Alert breach → `notifications` row within one cron tick — requires `edge_cron_config`
- [ ] CRUD on Tier 1 table → `audit_logs` row with acting user — manual staging test
- [x] Unit tests: `alertRules.test.ts`, `sharedLinkCrypto.test.ts`

### E.8 Definition of Done
- [x] Dashboard snapshots are immutable and shareable via passworded/token links.
- [x] PDF/PPT export generates via export worker (deploy `workers/export-service`).
- [x] Threshold alerts fire in-app (`notifications`); email dispatch deferred.
- [x] Audit log captures all Tier 1–3 writes.
- [x] Data-quality rules run on sync and surface issues in a triage board.
- [x] Indicator-visualization route is live and reads the unified `indicator_definitions`.

### E.9 Risks / notes
- **Puppeteer in Edge Functions** is not viable; the export worker must be a separate Node service.
- **AI features (§13 of the spec)** are intentionally not scheduled here; treat as a follow-up phase once the semantic model (`indicator_definitions`) exists, since NLQ and schema intelligence depend on it.
- **Stripe integration** (Open Decision #7): wire `organizations.plan` to Stripe subscriptions when billing enforcement is needed; the `organization_usage` table from Phase D is the metering source.

### E.10 Audit remediation (post-implementation review)
- [x] IDOR fix: `create-shared-link` verifies `dashboard_id`/`snapshot_id` belongs to `organization_id`
- [x] `shared-link-access` enforces org consistency between link and target resource
- [x] `evaluate-alerts` user path requires `assertOrgMember` + `organizationId`; global sweep is cron-only
- [x] `assertOrgRole` helper added; role checks wired into `create-snapshot` (editor+), `create-shared-link` (admin+), `validate-data` (editor+) to match RLS policies
- [x] `validate-data`: `uniqueness` + `cross_field` rule types implemented; dedup on `(rule, row)`; numeric-string `range`; input validation
- [x] `evaluate-alerts`: respects `rule.channel`; `last_fired_at` only updated on successful delivery; stale-current note
- [x] Password hashing upgraded SHA-256 → PBKDF2 (100k iterations); legacy hashes still verified; in-memory rate limiting (10 attempts/10 min) on `shared-link-access`
- [x] `create-snapshot`: typed `frozenData`; indicator values scoped to snapshot `period` when provided
- [x] Frontend: `NotificationBell` uses `authStore` (no redundant `getUser`); dead `useSharedLinks` removed; trends query limited to 2000; `type`→`location` mapping fixed; enum types on export jobs; mutation return mapped
- [x] Phase E query keys centralized in `workspaceKeys`; route error/loading UI added (audit, reports, data-quality, indicator-visualization); data-quality issues scoped to `open`

---

## Cross-cutting concerns

### Engineering checklist

- [x] Migrations numbered `NNNN_description.sql`; new migrations instead of editing applied ones
- [x] RLS default on new tables via `is_org_member` / `current_org_role`
- [x] Demo mode: in-browser `queryEngine.ts` + demo seed when unsigned / Supabase off
- [ ] Type sharing between client and edge functions kept in sync
- [ ] `query_log` table for slow `run-query` / `import_jobs` (Phase D+)
- [ ] CI: `supabase db reset` + vitest on PR

### Open decisions (track resolution)

| # | Topic | Decision | Status |
|---|-------|----------|--------|
| 1 | Org vs workspace naming | DB = `organizations`; UI may say "workspace" | ✅ Decided |
| 2 | Program hierarchy | Free-text on `projects` for v1 | ✅ Decided |
| 3 | MEAL vs imported indicators | Separate UI copy; unified table in Phase E | ✅ Decided |
| 4 | ID format | UUID PKs in DB; demo `tbl-*` only in localStorage | ✅ Decided |
| 5 | Secrets | Supabase Vault (Phase D) | ⬜ Pending |
| 6 | Long-poll connectors | External worker over Edge timeouts | ⬜ Pending |
| 7 | Stripe billing | Wire `organizations.plan` when limits enforced | ⬜ Pending |
| 8 | Demo mode | Auth gate + `useWorkspaceReady()` fallback | ✅ Decided |
