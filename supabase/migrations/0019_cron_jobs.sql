-- Phase E: pg_cron helpers for scheduled-sync + evaluate-alerts.
-- Ops must insert one row into private.edge_cron_config after deploy (see docs/supabase-cron-setup.md).

create schema if not exists private;

create table if not exists private.edge_cron_config (
  singleton boolean primary key default true check (singleton),
  supabase_url text not null,
  cron_secret text not null,
  updated_at timestamptz not null default now()
);

revoke all on table private.edge_cron_config from public;
grant all on table private.edge_cron_config to postgres, service_role;

create or replace function private.fire_edge_function(function_slug text, body jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = private, extensions, public, pg_temp
as $$
declare
  cfg private.edge_cron_config;
  request_id bigint;
begin
  select * into cfg from private.edge_cron_config where singleton = true;
  if cfg is null or cfg.supabase_url = '' or cfg.cron_secret = '' then
    raise notice 'edge_cron_config not configured — skipping %', function_slug;
    return null;
  end if;

  select net.http_post(
    url := rtrim(cfg.supabase_url, '/') || '/functions/v1/' || function_slug,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', cfg.cron_secret
    ),
    body := coalesce(body, '{}'::jsonb)
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function private.fire_edge_function(text, jsonb) from public;
grant execute on function private.fire_edge_function(text, jsonb) to postgres, service_role;

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net') then
    perform cron.unschedule(jobid)
      from cron.job
     where jobname in ('dimes-scheduled-sync', 'dimes-evaluate-alerts');

    perform cron.schedule(
      'dimes-scheduled-sync',
      '*/15 * * * *',
      $$select private.fire_edge_function('scheduled-sync')$$
    );
    perform cron.schedule(
      'dimes-evaluate-alerts',
      '*/15 * * * *',
      $$select private.fire_edge_function('evaluate-alerts')$$
    );
  else
    raise notice 'pg_cron/pg_net not available — schedule cron manually (docs/supabase-cron-setup.md)';
  end if;
end;
$cron$;
