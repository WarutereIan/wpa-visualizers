-- Phase B: flexible per-user UI state (selected demo project key, sidebar, etc.)
-- until Phase C migrates selected_project_id to the projects table FK.

alter table public.user_preferences
  add column if not exists ui_state jsonb not null default '{}'::jsonb;

comment on column public.user_preferences.ui_state is
  'Arbitrary UI keys (e.g. selectedProjectId string) until server-backed projects exist.';
