# Supabase local setup — DIMES-BI

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Node.js 20+

## 1. Environment

Copy `.env.example` → `.env` and set:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from supabase status after start>
```

## 2. Start local stack + apply migrations

From `bi-dimes/`:

```bash
supabase start
supabase db reset   # applies supabase/migrations/*.sql
supabase status     # copy anon key into .env
```

Migrations run in order:

| File | Phase |
|------|-------|
| `0001_foundations.sql` | Auth, orgs, profiles, RLS helpers |
| `0002_data_storage_layer.sql` | data_tables, jsonb rows, indicator_values |
| `0003_core_workspace_tables.sql` | queries, dashboards, mappings, prefs |
| `0004_meal_layer.sql` | projects, outputs, indicators |
| `0005_byod_operations.sql` | connectors, import jobs, alerts |
| `0006_product_extras.sql` | snapshots, exports, audit, semantic layer |
| `0007_phase_a_auth_helpers.sql` | `create_default_organization()` RPC |

## 3. Run the app

```bash
npm run dev
```

- **Without** Supabase env vars: demo mode (localStorage, no auth gate).
- **With** Supabase env vars: sign up at `/signup` → auto-provisioned org → workspace routes require login.

## 4. Cloud project

Link and push:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your deployment environment to the cloud project values.
