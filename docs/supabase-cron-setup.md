# Supabase cron setup (Phase D + E)

Scheduled jobs call Edge Functions with `X-Cron-Secret`. Apply migration `0019_cron_jobs.sql` after `pg_cron` and `pg_net` are enabled on your project.

## 1. Edge Function secrets

In the Supabase dashboard → Project Settings → Edge Functions → Secrets:

```
CRON_SECRET=<random-long-secret>
```

Redeploy functions that read it: `scheduled-sync`, `refresh-aggregates`, `evaluate-alerts`.

## 2. Database config (required for pg_cron)

Run once in the SQL editor (replace values):

```sql
insert into private.edge_cron_config (singleton, supabase_url, cron_secret)
values (
  true,
  'https://YOUR_PROJECT_REF.supabase.co',
  'YOUR_CRON_SECRET'
)
on conflict (singleton) do update set
  supabase_url = excluded.supabase_url,
  cron_secret = excluded.cron_secret,
  updated_at = now();
```

Migration `0019_cron_jobs.sql` registers:

| Job | Schedule | Function |
|-----|----------|----------|
| `dimes-scheduled-sync` | every 15 min | `scheduled-sync` |
| `dimes-evaluate-alerts` | every 15 min | `evaluate-alerts` |

## 3. Verify

```sql
select * from cron.job where jobname like 'dimes-%';
select private.fire_edge_function('evaluate-alerts');
```

Check Edge Function logs for `{ "fired": N }`.

## 4. External cron (alternative)

If `pg_cron` is unavailable, use any scheduler:

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/evaluate-alerts" \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  -d '{}'
```

Same pattern for `scheduled-sync`.

## 5. Export worker

The export worker polls `export_jobs` independently — no pg_cron required. Deploy `workers/export-service` and set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

Optional: cron `POST` to `http://export-worker:8788/process` with `X-Worker-Secret` if `POLL_INTERVAL_MS=0`.
