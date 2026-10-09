-- Qunity — stair challenges pay by the time the server measured
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR TIMED CHALLENGE POINTS") so it can be pasted into the Supabase
-- SQL Editor on its own. schema.sql remains the source of truth.
--
-- Run it BEFORE deploying the app version that calls these functions; the
-- current app keeps working after it runs (nothing is removed). Safe to run
-- more than once.

-- ============================================================================
-- ADDED FOR TIMED CHALLENGE POINTS
--
-- A stair challenge pays by how long it took, timed by the server from
-- Start to Finish (not by the device's clock): we measured how long a child
-- takes to climb those stairs, so finishing much faster most likely means
-- fewer stairs were climbed.
--   under min_seconds                    → 0
--   min_seconds up to full_points_seconds → 1 … bonus_points, in proportion
--   full_points_seconds or more          → bonus_points
-- The thresholds live here rather than in code so they can be tuned after
-- the pilot with a single update. A challenge without them pays its full
-- bonus_points.
-- ============================================================================

alter table public.challenges
  add column if not exists min_seconds integer,
  add column if not exists full_points_seconds integer;

update public.challenges set min_seconds = 20,  full_points_seconds = 98  where id = 'stairs_white';
update public.challenges set min_seconds = 40,  full_points_seconds = 196 where id = 'stairs_orange';
update public.challenges set min_seconds = 60,  full_points_seconds = 294 where id = 'stairs_green';
update public.challenges set min_seconds = 80,  full_points_seconds = 392 where id = 'stairs_blue';
update public.challenges set min_seconds = 100, full_points_seconds = 490 where id = 'stairs_purple';

-- The one scoring rule for every timed challenge.
create or replace function public.calculate_timed_challenge_points(
  p_elapsed_seconds integer,
  p_min_seconds integer,
  p_full_points_seconds integer,
  p_max_points integer
)
returns integer
language sql
immutable
as $$
  select case
    when p_min_seconds is null or p_full_points_seconds is null or p_full_points_seconds <= p_min_seconds
      then p_max_points
    when p_elapsed_seconds < p_min_seconds then 0
    when p_elapsed_seconds >= p_full_points_seconds then p_max_points
    else round(
      1 + (p_max_points - 1) * (p_elapsed_seconds - p_min_seconds)::numeric
        / (p_full_points_seconds - p_min_seconds)
    )::integer
  end;
$$;

-- Start: the server's clock starts, for a repeatable challenge this child
-- has unlocked. Returns the new session's id.
create or replace function public.start_challenge_session(p_challenge_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1
    from public.child_challenges cc
    join public.challenges c on c.id = cc.challenge_id
    where cc.child_id = auth.uid()
      and cc.challenge_id = p_challenge_id
      and c.challenge_type = 'repeatable_workout'
  ) then
    raise exception 'challenge % is not unlocked', p_challenge_id;
  end if;

  insert into public.challenge_sessions (child_id, challenge_id, status, start_time)
  values (auth.uid(), p_challenge_id, 'in_progress', now())
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.start_challenge_session(text) to authenticated;

-- Finish ("סיימתי"): the server's clock stops, the time it measured sets the
-- points, and they go to the child's total only (not the stage), as before.
-- Returns {"seconds", "points"}; calling it again for a finished session
-- returns the same result without paying twice.
create or replace function public.finish_challenge_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.challenge_sessions%rowtype;
  v_challenge public.challenges%rowtype;
  v_seconds integer;
  v_points integer;
begin
  select * into v_session
  from public.challenge_sessions
  where id = p_session_id and child_id = auth.uid()
  for update;

  if not found then
    raise exception 'challenge session % not found', p_session_id;
  end if;

  if v_session.status = 'completed' then
    return jsonb_build_object(
      'seconds', v_session.actual_duration_seconds,
      'points', coalesce(v_session.points_awarded, 0)
    );
  end if;

  select * into v_challenge from public.challenges where id = v_session.challenge_id;

  v_seconds := floor(extract(epoch from now() - v_session.start_time))::integer;
  v_points := public.calculate_timed_challenge_points(
    v_seconds, v_challenge.min_seconds, v_challenge.full_points_seconds, v_challenge.bonus_points
  );

  update public.challenge_sessions
  set status = 'completed',
      end_time = now(),
      actual_duration_seconds = v_seconds,
      points_awarded = v_points
  where id = v_session.id;

  if v_points > 0 then
    insert into public.points_transactions (child_id, session_id, points, reason)
    values (v_session.child_id, null, v_points, 'challenge_workout_' || v_session.challenge_id);

    update public.children
    set total_points = total_points + v_points
    where id = v_session.child_id;
  end if;

  return jsonb_build_object('seconds', v_seconds, 'points', v_points);
end;
$$;

grant execute on function public.finish_challenge_session(uuid) to authenticated;

-- Check: the five stair challenges with their thresholds, and the rule at
-- its edges for "100 stairs" (expect 0, 1, 8, 15, 15).
select id, bonus_points, min_seconds, full_points_seconds
from public.challenges
where id like 'stairs_%'
order by min_seconds;

select
  public.calculate_timed_challenge_points(19, 20, 98, 15) as at_19s,
  public.calculate_timed_challenge_points(20, 20, 98, 15) as at_20s,
  public.calculate_timed_challenge_points(60, 20, 98, 15) as at_60s,
  public.calculate_timed_challenge_points(96, 20, 98, 15) as at_96s,
  public.calculate_timed_challenge_points(98, 20, 98, 15) as at_98s;
