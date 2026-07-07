-- Phase D: helper for scheduled sync — lists connections due for refresh.
-- Invoke the `scheduled-sync` Edge Function via pg_cron + pg_net (see docs/supabase-setup.md).

create or replace function public.connections_due_for_sync()
returns table (
  connection_id uuid,
  organization_id uuid,
  sync_schedule public.syncSchedule,
  last_sync_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.organization_id,
    c.sync_schedule,
    c.last_sync_at
  from public.data_source_connections c
  where c.sync_schedule <> 'manual'
    and coalesce(c.last_sync_status, '') <> 'running'
    and (
      c.last_sync_at is null
      or (
        c.sync_schedule = 'realtime' and c.last_sync_at < now() - interval '15 minutes'
      )
      or (
        c.sync_schedule = 'hourly' and c.last_sync_at < now() - interval '1 hour'
      )
      or (
        c.sync_schedule = 'daily' and c.last_sync_at < now() - interval '1 day'
      )
      or (
        c.sync_schedule = 'weekly' and c.last_sync_at < now() - interval '7 days'
      )
    );
$$;

grant execute on function public.connections_due_for_sync() to service_role;

comment on function public.connections_due_for_sync is
  'Returns BYOD connections that should be synced. Pair with pg_cron calling scheduled-sync Edge Function.';
