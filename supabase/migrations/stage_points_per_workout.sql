-- Qunity — a stage needs 20 points per workout (was 30)
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- 'ADDED FOR "ALL THE WORKOUTS DONE = NEXT STAGE"') so it can be pasted into
-- the Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Run it BEFORE deploying the app version without the "harder than
-- recommended" bonus. Safe to run more than once.

-- ============================================================================
-- ADDED FOR "ALL THE WORKOUTS DONE = NEXT STAGE"
--
-- Replaces the POINTS HEADROOM numbers above (30 per workout). A stage now
-- needs exactly what its workouts are worth — 20 points each — so a child
-- who does every workout of the stage in full moves up, with the stage's
-- sure bonuses (first workout in the stage +10, the power +10…) as a little
-- slack for a workout or two stopped early. Parent, streak and challenge
-- bonuses help but are no longer needed. A child who passes every workout at
-- just 60% still falls short, so a star keeps meaning something.
--
-- The "0 points left while workouts remain" display the old note worries
-- about no longer shows: the home and achievements screens only mention the
-- part still missing (see ChildHomeView's remaining line).
--
-- A child who already finished the stage's workouts and now has enough
-- points moves up at the end of their next workout (evaluateProgression
-- runs after every workout).
-- ============================================================================

update public.bracelet_levels set required_points = 200 where color = 'white';
update public.bracelet_levels set required_points = 280 where color = 'orange';
update public.bracelet_levels set required_points = 360 where color = 'green';
update public.bracelet_levels set required_points = 440 where color = 'blue';
update public.bracelet_levels set required_points = 520 where color = 'purple';
