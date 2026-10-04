-- Qunity — "אמרתי!" moments on the parent home screen
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- ADDED FOR THE PARENT HOME SCREEN'S "אמרתי!") so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Adds the parent_tip_moments table. Run it BEFORE deploying the app version
-- with the new parent home screen. Safe to run more than once.

create table if not exists public.parent_tip_moments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  rule_id uuid references public.parent_tip_rules (id) on delete set null,
  said_at timestamptz not null default now()
);

create index if not exists parent_tip_moments_parent_said_at
  on public.parent_tip_moments (parent_id, said_at desc);

alter table public.parent_tip_moments enable row level security;

drop policy if exists "parent_tip_moments_select_own" on public.parent_tip_moments;
create policy "parent_tip_moments_select_own" on public.parent_tip_moments
  for select using (parent_id = auth.uid());

drop policy if exists "parent_tip_moments_insert_own" on public.parent_tip_moments;
create policy "parent_tip_moments_insert_own" on public.parent_tip_moments
  for insert with check (parent_id = auth.uid() and public.is_parent_of(child_id));

-- Should show 0 (the table exists and is empty).
select count(*) as moments from public.parent_tip_moments;
