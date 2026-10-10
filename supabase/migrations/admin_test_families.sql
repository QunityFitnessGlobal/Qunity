-- Qunity — test families marked from the admin dashboard
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR THE ADMIN DASHBOARD'S TEST FAMILIES") so it can be pasted into
-- the Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Run it BEFORE deploying the app version with the "משפחת בדיקה" button
-- (until it runs, no family counts as a test one). Safe to run more than once.

-- ============================================================================
-- ADDED FOR THE ADMIN DASHBOARD'S TEST FAMILIES
--
-- Families an admin marked "משפחת בדיקה" on the dashboard's families screen:
-- left out of its numbers while "בלי משתמשי בדיקה" is on. Only the server
-- writes and reads these rows (service role, after checking the admin), so
-- there are no policies.
-- ============================================================================

create table if not exists public.admin_test_families (
  parent_id uuid primary key references public.parents (id) on delete cascade,
  marked_at timestamptz not null default now()
);

alter table public.admin_test_families enable row level security;
