-- RLS smoke test (manual / CI with two test users in different orgs)
-- Run as authenticated user A via Supabase SQL editor or psql with JWT.
-- Expect: zero rows when selecting another org's workspace data.

-- Replace with real UUIDs from your test fixtures:
-- \set org_a 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- \set org_b 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

-- As user in org A, should return only org A tables:
-- select id, name from data_tables where organization_id = :'org_a';

-- As user in org B, org A tables must be invisible (RLS):
-- select count(*) from data_tables where organization_id = :'org_a';
-- expected: 0

-- Repeat for:
--   data_table_rows (join via data_table_id)
--   query_definitions
--   dashboards
--   mappings

-- Cross-org insert must fail:
-- insert into data_tables (organization_id, name) values (:'org_b', 'evil');
-- expected: RLS violation or zero rows inserted
