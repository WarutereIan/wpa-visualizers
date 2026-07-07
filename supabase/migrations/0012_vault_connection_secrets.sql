-- Phase D: Vault helpers for connection credentials (server-side only).

create extension if not exists supabase_vault with schema vault;

create or replace function public.store_connection_secret(secret_payload text, secret_name text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  new_id uuid;
begin
  new_id := vault.create_secret(secret_payload, secret_name, 'data_source_connection credential');
  return new_id::text;
end;
$$;

revoke all on function public.store_connection_secret(text, text) from public;
grant execute on function public.store_connection_secret(text, text) to service_role;

comment on function public.store_connection_secret is
  'Stores connector credentials in Supabase Vault; returns secret id for data_source_connections.credentials_secret_id.';
