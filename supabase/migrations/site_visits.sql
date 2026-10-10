-- Qunity — site visits for the admin dashboard's funnel
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR THE ADMIN DASHBOARD'S VISITS") so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Safe to run before or after deploying (the dashboard shows the funnel
-- without the visits line until this runs) and safe to run more than once.

-- ============================================================================
-- ADDED FOR THE ADMIN DASHBOARD'S VISITS
--
-- One row per browser session that opens the welcome or sign-up screen while
-- signed out: where it came from (utm_* parameters, or the referring site),
-- and nothing about who it is — no IP, no device, no cookie. The admin
-- dashboard's funnel starts from these, and its per-channel table splits
-- them by source. Only the server writes and reads them (service role), so
-- there are no policies.
-- ============================================================================

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text,
  medium text,
  campaign text,
  referrer text,
  path text
);

alter table public.site_visits enable row level security;

create index if not exists site_visits_created_at_idx on public.site_visits (created_at);
