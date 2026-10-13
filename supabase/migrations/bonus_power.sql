-- Qunity — the bonus power ("כוח ההצלחה") for finishing the purple stage
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- 'ADDED FOR THE BONUS POWER') so it can be pasted into the Supabase SQL
-- Editor on its own. schema.sql remains the source of truth.
--
-- Run it BEFORE deploying the app version with the bonus power (until it
-- runs, finishing purple shows nothing new). Safe to run more than once.

-- ============================================================================
-- ADDED FOR THE BONUS POWER ("כוח ההצלחה")
--
-- A sixth power, for a child who finishes the purple stage (the last one —
-- there is no stage to move up to): revealed in its own celebration at the
-- end of that workout, then shown as the gold sixth place in the achievements
-- medallion. Recorded like the stage powers, as a one-time 'condition'
-- challenge, but unlocked by the app when the last stage is finished (see
-- completeWorkout / unlockBonusPower), never by the end-of-workout checks.
-- Its 50 points go to the total only: there's no stage left to fill.
-- ============================================================================

insert into public.challenges (id, title, description, bonus_points, condition_type, challenge_type) values
  ('power_success',
   jsonb_build_object('he', 'קבלת כוח ההצלחה', 'en', 'Received the power of success'),
   jsonb_build_object('he', 'סיימת את כל חמשת השלבים וגילית את כוח ההצלחה.', 'en', 'You finished all five stages and discovered the power of success.'),
   50, 'power_success', 'condition')
on conflict (id) do nothing;
