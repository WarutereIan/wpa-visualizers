# DuckDB worker (Phase D)

Small Node service that writes Parquet files to Supabase Storage and runs analytical queries via native DuckDB. Edge Functions proxy requests here when `DUCKDB_WORKER_URL` is set.

## Setup

```bash
cd workers/duckdb-service
npm install
```

## Environment

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `8787`) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Storage upload + signed URLs) |
| `DUCKDB_WORKER_SECRET` | Shared secret; Edge Functions send `X-Worker-Secret` |
| `DIMES_STORAGE_BUCKET` | Storage bucket (default `dimes-data`) |

## Run

```bash
npm start
# or with watch:
npm run dev
```

## Endpoints

- `GET /health` — liveness
- `POST /promote-parquet` — `{ organizationId, tableId, rows[] }` → writes `orgs/{org}/tables/{table}/data/batch_0.parquet`
- `POST /run-query` — `{ sql, params, parquetSignedUrl }` → DuckDB result rows

## Supabase Edge Function secrets

Set on the Supabase project:

```
DUCKDB_WORKER_URL=https://your-worker.example.com
DUCKDB_WORKER_SECRET=...
CRON_SECRET=...   # for scheduled-sync
```

Deploy edge functions:

```bash
npx supabase functions deploy run-query ingest promote-to-parquet scheduled-sync refresh-aggregates --project-ref <ref>
```

## Scheduled sync

Apply migration `0014_scheduled_sync.sql`, then schedule HTTP calls to `scheduled-sync` with header `X-Cron-Secret` (e.g. via pg_cron + pg_net or an external cron).
