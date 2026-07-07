# Export worker (Phase E)

Node service that processes `export_jobs` (PDF, PPTX, CSV, PNG) and uploads results to Supabase Storage.

## Setup

```bash
cd workers/export-service
npm install
```

Apply migration `0018_exports_storage.sql` (creates `dimes-exports` bucket + `claim_export_job()`).

## Environment

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `8788`) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `EXPORT_WORKER_SECRET` | Optional; require `X-Worker-Secret` on `/process` |
| `DIMES_EXPORTS_BUCKET` | Storage bucket (default `dimes-exports`) |
| `POLL_INTERVAL_MS` | Poll interval (default `30000`; set `0` to disable) |

## Run

```bash
npm start
```

## Endpoints

- `GET /health` — liveness
- `POST /process` — claim and process up to 5 queued jobs

PNG exports currently render the same layout as PDF (raster PNG via headless browser can be added later).

## Cron (alerts + sync)

See `docs/supabase-cron-setup.md` for `pg_cron` configuration of `scheduled-sync` and `evaluate-alerts`.
