-- Qunity — challenges-screen reveal tracking
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR CHALLENGES-SCREEN REVEAL TRACKING") so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Run this BEFORE deploying the app version that reads revealed_at: until
-- the column exists, the challenges screen's completed-challenges query
-- fails and the "done" tab comes back empty.
--
-- Safe to run exactly once. Re-running fails on "column revealed_at already
-- exists" (by design, same as the rest of schema.sql).

alter table public.child_challenges add column revealed_at timestamptz;

-- Everything already earned counts as revealed, so no child gets a flood of
-- old mystery boxes opening at once.
update public.child_challenges
set revealed_at = coalesce(completed_at, now());
