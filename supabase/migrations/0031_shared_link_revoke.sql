-- Revoke public dashboard/snapshot share links without deleting the row.
-- shared-link-access rejects revoked tokens; re-enabling creates a new token.

alter table public.shared_links
  add column if not exists revoked boolean not null default false;

comment on column public.shared_links.revoked is
  'When true, shared-link-access rejects the token. Re-enable creates a new token.';

create index if not exists shared_links_dashboard_active_idx
  on public.shared_links (dashboard_id)
  where revoked = false and dashboard_id is not null;
