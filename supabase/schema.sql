-- Qunity database schema
-- Run this once against your Supabase project (SQL Editor -> New query -> paste -> Run).

-- ============================================================================
-- TABLES
-- ============================================================================

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('parent', 'child')),
  created_at timestamptz not null default now()
);

create table public.parents (
  id uuid primary key references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key references public.users (id) on delete cascade,
  nickname text not null,
  child_code text not null unique,
  child_code_used boolean not null default false,
  current_color text not null default 'white',
  total_points integer not null default 0,
  points_in_color integer not null default 0,
  workouts_completed_in_color integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.parent_child_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create table public.bracelet_levels (
  color text primary key,
  order_index integer not null unique,
  required_workouts integer not null default 0,
  required_points integer not null default 0
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  recommended_duration_minutes integer,
  recommended_difficulty integer,
  color text references public.bracelet_levels (color),
  order_in_color integer,
  created_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  workout_id uuid references public.workouts (id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  start_time timestamptz not null default now(),
  end_time timestamptz,
  actual_duration_minutes integer,
  created_at timestamptz not null default now()
);

create table public.workout_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  activity_reported text,
  duration_reported_minutes integer,
  difficulty_reported text,
  trained_longer boolean not null default false,
  parent_trained_together boolean not null default false,
  feeling_after text,
  created_at timestamptz not null default now()
);

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  session_id uuid references public.workout_sessions (id),
  points integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.challenges (
  id text primary key,
  title text not null,
  description text,
  bonus_points integer not null default 0,
  condition_type text,
  created_at timestamptz not null default now()
);

create table public.child_challenges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  challenge_id text not null references public.challenges (id) on delete cascade,
  completed_at timestamptz,
  unique (child_id, challenge_id)
);

create table public.parent_tip_rules (
  id uuid primary key default gen_random_uuid(),
  principle text,
  condition_type text,
  condition_params jsonb not null default '{}'::jsonb,
  tip_text text not null,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.parent_tips (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  rule_id uuid references public.parent_tip_rules (id),
  shown_at timestamptz not null default now()
);

-- ============================================================================
-- SIGNUP AUTOMATION
-- Generates a unique child_code and provisions public.users/parents/children
-- rows automatically whenever a new auth.users row is created.
-- ============================================================================

create or replace function public.generate_child_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I to avoid confusion
  candidate text;
  code_part text;
  i int;
  taken boolean;
begin
  loop
    code_part := '';
    for i in 1..5 loop
      code_part := code_part || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    candidate := 'QNTY-' || code_part;
    select exists (select 1 from public.children where child_code = candidate) into taken;
    exit when not taken;
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'parent');
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');

  insert into public.users (id, full_name, role)
  values (new.id, v_full_name, v_role);

  if v_role = 'parent' then
    insert into public.parents (id) values (new.id);
  elsif v_role = 'child' then
    insert into public.children (id, nickname, child_code)
    values (new.id, v_full_name, public.generate_child_code());
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Rule of thumb: a child can only see their own data; a parent can only see
-- data belonging to children linked to them via parent_child_links.
-- ============================================================================

create or replace function public.is_parent_of(p_child_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.parent_child_links
    where child_id = p_child_id and parent_id = auth.uid()
  );
$$;

alter table public.users enable row level security;
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.parent_child_links enable row level security;
alter table public.bracelet_levels enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_results enable row level security;
alter table public.points_transactions enable row level security;
alter table public.challenges enable row level security;
alter table public.child_challenges enable row level security;
alter table public.parent_tip_rules enable row level security;
alter table public.parent_tips enable row level security;

-- users
create policy "users_select_self" on public.users
  for select using (id = auth.uid());
create policy "users_select_linked_children" on public.users
  for select using (public.is_parent_of(id));
create policy "users_update_self" on public.users
  for update using (id = auth.uid());

-- parents
create policy "parents_select_self" on public.parents
  for select using (id = auth.uid());

-- children
create policy "children_select_self" on public.children
  for select using (id = auth.uid());
create policy "children_select_linked" on public.children
  for select using (public.is_parent_of(id));
create policy "children_update_self" on public.children
  for update using (id = auth.uid());

-- parent_child_links
create policy "links_select_own" on public.parent_child_links
  for select using (parent_id = auth.uid() or child_id = auth.uid());
create policy "links_insert_own" on public.parent_child_links
  for insert with check (parent_id = auth.uid());

-- bracelet_levels / workouts / challenges / parent_tip_rules: shared read-only config
create policy "bracelet_levels_read" on public.bracelet_levels
  for select to authenticated using (true);
create policy "workouts_read" on public.workouts
  for select to authenticated using (true);
create policy "challenges_read" on public.challenges
  for select to authenticated using (true);
create policy "parent_tip_rules_read" on public.parent_tip_rules
  for select to authenticated using (true);

-- workout_sessions
create policy "sessions_select_own" on public.workout_sessions
  for select using (child_id = auth.uid() or public.is_parent_of(child_id));
create policy "sessions_insert_own" on public.workout_sessions
  for insert with check (child_id = auth.uid());
create policy "sessions_update_own" on public.workout_sessions
  for update using (child_id = auth.uid());

-- workout_results
create policy "results_select_own" on public.workout_results
  for select using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id
        and (s.child_id = auth.uid() or public.is_parent_of(s.child_id))
    )
  );
create policy "results_insert_own" on public.workout_results
  for insert with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.child_id = auth.uid()
    )
  );

-- points_transactions
create policy "points_select_own" on public.points_transactions
  for select using (child_id = auth.uid() or public.is_parent_of(child_id));
create policy "points_insert_own" on public.points_transactions
  for insert with check (child_id = auth.uid());

-- child_challenges
create policy "child_challenges_select_own" on public.child_challenges
  for select using (child_id = auth.uid() or public.is_parent_of(child_id));
create policy "child_challenges_insert_own" on public.child_challenges
  for insert with check (child_id = auth.uid());
create policy "child_challenges_update_own" on public.child_challenges
  for update using (child_id = auth.uid());

-- parent_tips
create policy "parent_tips_select_own" on public.parent_tips
  for select using (parent_id = auth.uid());
create policy "parent_tips_insert_own" on public.parent_tips
  for insert with check (parent_id = auth.uid());

-- ============================================================================
-- ADDED IN PROMPT 2/7 — CHILD LINKING
-- Only run the section below if you already ran everything above it in a
-- previous step. It links a parent to a child using the child's code.
--
-- A parent doesn't have RLS access to an unlinked child's row (by design),
-- so the lookup-and-link must happen atomically inside a SECURITY DEFINER
-- function rather than through ordinary client-side select/insert calls.
-- ============================================================================

create or replace function public.link_child_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid := auth.uid();
  v_child public.children%rowtype;
  v_already_linked boolean;
begin
  if v_parent_id is null then
    return jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  end if;

  select * into v_child from public.children where child_code = p_code;

  if not found then
    return jsonb_build_object('success', false, 'error', 'CODE_NOT_FOUND');
  end if;

  if v_child.child_code_used then
    return jsonb_build_object('success', false, 'error', 'CODE_ALREADY_USED');
  end if;

  select exists (
    select 1 from public.parent_child_links
    where parent_id = v_parent_id and child_id = v_child.id
  ) into v_already_linked;

  if v_already_linked then
    return jsonb_build_object('success', false, 'error', 'ALREADY_LINKED');
  end if;

  insert into public.parent_child_links (parent_id, child_id)
  values (v_parent_id, v_child.id);

  update public.children set child_code_used = true where id = v_child.id;

  return jsonb_build_object(
    'success', true,
    'child_id', v_child.id,
    'nickname', v_child.nickname
  );
end;
$$;

grant execute on function public.link_child_by_code(text) to authenticated;

-- ============================================================================
-- ADDED IN PROMPT 3/7 (follow-up) — LIFETIME WORKOUT COUNT
-- Mirrors total_points: an all-time counter that is never reset on level-up,
-- unlike workouts_completed_in_color which resets each time the child levels
-- up. Both counters are incremented together, once per completed workout
-- session, by the workout-completion flow built in a later prompt (not by
-- points.service.awardPoints, which also runs for challenge bonus points and
-- would otherwise double-count).
-- ============================================================================

alter table public.children add column total_workouts_completed integer not null default 0;

-- ============================================================================
-- ADDED IN PROMPT 4/7 — FIX recommended_difficulty COLUMN TYPE
-- Originally created as `text`; the workout flow treats it as a 1-5 numeric
-- scale (compared against the child's self-reported difficulty), so it needs
-- to be an integer. Safe to run whether or not the workouts table already
-- has rows (the USING clause casts any existing numeral text to integer).
-- ============================================================================

alter table public.workouts
  alter column recommended_difficulty type integer using recommended_difficulty::integer;

-- ============================================================================
-- ADDED IN PROMPT 6/7 (follow-up) — FIX difficulty_reported COLUMN TYPE
-- Same mistake as recommended_difficulty above, in a different table:
-- workout_results.difficulty_reported was created as `text`. Postgres/
-- PostgREST returns text columns as JSON strings, so every average computed
-- over it in JS was doing string concatenation ("3"+"4" -> "34") instead of
-- numeric addition before being coerced back to a number — producing the
-- huge, nonsensical "average difficulty" seen on the Parent Dashboard.
-- ============================================================================

alter table public.workout_results
  alter column difficulty_reported type integer using difficulty_reported::integer;

-- ============================================================================
-- ADDED IN PROMPT 6/7 (follow-up) — SWITCH SESSION DURATION TO SECONDS
-- actual_duration_minutes only ever stored whole minutes (rounded down at
-- Finish time), so any workout under 30 seconds recorded as "0" — which is
-- why "total active time" on the Parent Dashboard showed 0 for test runs.
-- Renamed to actual_duration_seconds and existing values (previously whole
-- minutes) are multiplied by 60 so old rows keep the same real-world meaning.
-- ============================================================================

alter table public.workout_sessions
  rename column actual_duration_minutes to actual_duration_seconds;

update public.workout_sessions
  set actual_duration_seconds = actual_duration_seconds * 60
  where actual_duration_seconds is not null;

-- ============================================================================
-- ADDED IN PROMPT 6/7 (follow-up) — MOBILE NAVIGATION RESTRUCTURE
-- Tracks whether a child has already seen their child_code once. The code is
-- shown inline on the Home tab only the first time (code_shown_at is null);
-- after that it is only reachable from Settings -> "הקוד שלי".
-- ============================================================================

alter table public.children add column code_shown_at timestamptz;

-- ============================================================================
-- ADDED IN PROMPT 4.5/7 — SCALE READINESS: INDEXES
-- ============================================================================

create index if not exists idx_children_total_points on public.children (total_points desc);
create index if not exists idx_workout_sessions_child_id on public.workout_sessions (child_id);
create index if not exists idx_workout_results_session_id on public.workout_results (session_id);
create index if not exists idx_points_transactions_child_id on public.points_transactions (child_id);
create index if not exists idx_child_challenges_child_id on public.child_challenges (child_id);
create index if not exists idx_parent_child_links_parent_id on public.parent_child_links (parent_id);
create index if not exists idx_parent_child_links_child_id on public.parent_child_links (child_id);

-- ============================================================================
-- ADDED IN PROMPT 4.5/7 — SCALE READINESS: ATOMIC POINT/WORKOUT-COUNT UPDATES
-- Replaces the previous "read current value in JS, add locally, write it
-- back" pattern in points.service.ts and workout.service.ts. That pattern is
-- not safe under concurrent calls: two updates that read the same starting
-- value before either writes back will silently lose one of the increments.
-- These functions do the read-and-add in a single SQL statement instead, so
-- Postgres itself guarantees the increment is atomic.
-- ============================================================================

create or replace function public.increment_child_points(p_child_id uuid, p_points integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.children
  set total_points = total_points + p_points,
      points_in_color = points_in_color + p_points
  where id = p_child_id;
$$;

grant execute on function public.increment_child_points(uuid, integer) to authenticated;

create or replace function public.increment_child_workout_counts(p_child_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.children
  set workouts_completed_in_color = workouts_completed_in_color + 1,
      total_workouts_completed = total_workouts_completed + 1
  where id = p_child_id;
$$;

grant execute on function public.increment_child_workout_counts(uuid) to authenticated;

-- ============================================================================
-- ADDED IN PROMPT 4.5/7 — i18n: preferred_language
-- ============================================================================

alter table public.users add column preferred_language text not null default 'he';

-- ============================================================================
-- ADDED IN PROMPT 4.5/7 — i18n: MULTI-LANGUAGE CONTENT (JSONB)
-- workouts/challenges/parent_tip_rules hold text written by the team, not by
-- users, so they become {"he": "...", "en": "..."} JSONB instead of plain
-- text. Existing rows are matched by their current (pre-migration) Hebrew
-- text since none of these tables have a stable natural key for title text.
-- Application code falls back to "he" if a language key is missing.
-- ============================================================================

alter table public.workouts add column title_i18n jsonb;
alter table public.workouts add column description_i18n jsonb;

update public.workouts set
  title_i18n = '{"he": "קפיצות במקום", "en": "Jumping jacks"}'::jsonb,
  description_i18n = '{"he": "חימום קליל עם קפיצות פישוק במקום.", "en": "A light warm-up with jumping jacks."}'::jsonb
  where title = 'קפיצות במקום';
update public.workouts set
  title_i18n = '{"he": "ריצה קלה בחצר", "en": "Light yard run"}'::jsonb,
  description_i18n = '{"he": "ריצה בקצב נוח סביב החצר או הגינה.", "en": "An easy-paced run around the yard or garden."}'::jsonb
  where title = 'ריצה קלה בחצר';
update public.workouts set
  title_i18n = '{"he": "מסלול מכשולים ביתי", "en": "Home obstacle course"}'::jsonb,
  description_i18n = '{"he": "בניית מסלול מכשולים פשוט עם כריות וכיסאות.", "en": "Build a simple obstacle course with pillows and chairs."}'::jsonb
  where title = 'מסלול מכשולים ביתי';
update public.workouts set
  title_i18n = '{"he": "ריקוד חופשי", "en": "Free dance"}'::jsonb,
  description_i18n = '{"he": "ריקוד חופשי לשירים אהובים במשך רבע שעה.", "en": "Free dancing to favorite songs for fifteen minutes."}'::jsonb
  where title = 'ריקוד חופשי';
update public.workouts set
  title_i18n = '{"he": "משחק כדור עם ההורה", "en": "Ball game with a parent"}'::jsonb,
  description_i18n = '{"he": "זריקות והעברות כדור יחד עם ההורה.", "en": "Throwing and passing a ball together with a parent."}'::jsonb
  where title = 'משחק כדור עם ההורה';
update public.workouts set
  title_i18n = '{"he": "קפיצה בחבל", "en": "Jump rope"}'::jsonb,
  description_i18n = '{"he": "קפיצות בחבל ברצף עם הפסקות קצרות.", "en": "Jump rope in sets with short breaks."}'::jsonb
  where title = 'קפיצה בחבל';
update public.workouts set
  title_i18n = '{"he": "אימון כוח לילדים", "en": "Kids strength workout"}'::jsonb,
  description_i18n = '{"he": "תרגילי משקל גוף: סקוואטים, פלאנק וכפיפות בטן.", "en": "Bodyweight exercises: squats, planks, and sit-ups."}'::jsonb
  where title = 'אימון כוח לילדים';
update public.workouts set
  title_i18n = '{"he": "ריצת ספרינטים קצרה", "en": "Short sprints"}'::jsonb,
  description_i18n = '{"he": "סטים של ריצות מהירות קצרות עם מנוחה.", "en": "Sets of short fast runs with rest in between."}'::jsonb
  where title = 'ריצת ספרינטים קצרה';
update public.workouts set
  title_i18n = '{"he": "מסלול אתגרים משולב", "en": "Combined challenge course"}'::jsonb,
  description_i18n = '{"he": "שילוב של ריצה, קפיצות ותרגילי כוח במסלול אחד.", "en": "A mix of running, jumping, and strength exercises in one course."}'::jsonb
  where title = 'מסלול אתגרים משולב';
update public.workouts set
  title_i18n = '{"he": "יוגה ומתיחות", "en": "Yoga and stretching"}'::jsonb,
  description_i18n = '{"he": "רצף מתיחות ותנוחות יוגה בסיסיות לגמישות.", "en": "A sequence of stretches and basic yoga poses for flexibility."}'::jsonb
  where title = 'יוגה ומתיחות';

alter table public.workouts drop column title;
alter table public.workouts drop column description;
alter table public.workouts rename column title_i18n to title;
alter table public.workouts rename column description_i18n to description;

alter table public.challenges add column title_i18n jsonb;
alter table public.challenges add column description_i18n jsonb;

update public.challenges set
  title_i18n = '{"he": "האימון הראשון", "en": "First Workout"}'::jsonb,
  description_i18n = '{"he": "השלמת האימון הראשון שלך.", "en": "You completed your first workout."}'::jsonb
  where id = 'first_workout';
update public.challenges set
  title_i18n = '{"he": "כוח ההורה", "en": "Parent Power"}'::jsonb,
  description_i18n = '{"he": "התאמנת יחד עם ההורה שלך.", "en": "You worked out together with your parent."}'::jsonb
  where id = 'parent_power';
update public.challenges set
  title_i18n = '{"he": "רצף של 3 אימונים", "en": "3 Workout Streak"}'::jsonb,
  description_i18n = '{"he": "התאמנת 3 ימים ברצף.", "en": "You worked out 3 days in a row."}'::jsonb
  where id = 'streak_3';
update public.challenges set
  title_i18n = '{"he": "רצף של 5 אימונים", "en": "5 Workout Streak"}'::jsonb,
  description_i18n = '{"he": "התאמנת 5 ימים ברצף.", "en": "You worked out 5 days in a row."}'::jsonb
  where id = 'streak_5';
update public.challenges set
  title_i18n = '{"he": "מועדון 100 הדקות", "en": "100 Minutes Club"}'::jsonb,
  description_i18n = '{"he": "צברת 100 דקות אימון במצטבר.", "en": "You accumulated 100 minutes of exercise."}'::jsonb
  where id = 'minutes_100';
update public.challenges set
  title_i18n = '{"he": "פותח הצבע", "en": "Color Starter"}'::jsonb,
  description_i18n = '{"he": "השלמת את האימון הראשון בצבע חדש.", "en": "You completed your first workout in a new color."}'::jsonb
  where id = 'color_starter';
update public.challenges set
  title_i18n = '{"he": "מסיים הצבע", "en": "Color Finisher"}'::jsonb,
  description_i18n = '{"he": "עמדת בכל הדרישות ועלית לצבע הבא.", "en": "You met every requirement and leveled up to the next color."}'::jsonb
  where id = 'color_finisher';

alter table public.challenges drop column title;
alter table public.challenges drop column description;
alter table public.challenges rename column title_i18n to title;
alter table public.challenges rename column description_i18n to description;

alter table public.parent_tip_rules add column tip_text_i18n jsonb;

update public.parent_tip_rules set tip_text_i18n = jsonb_build_object('he', tip_text, 'en', english) from (values
  ('כבר 3 ימים שהילד/ה לא התאמן/ה. זה הזמן להזכיר לו/לה שהבחירה בידיים שלו/ה - שאלו אותו/ה מתי נוח לו/לה להתחיל שוב, בלי לחץ.',
   'It has been 3 days since your child last worked out. This is a good moment to remind them the choice is theirs - ask when they would feel ready to start again, without pressure.'),
  ('עבר שבוע שלם בלי אימון. במקום להזכיר, נסו לשאול את הילד/ה מה יעזור לו/לה לחזור למסלול - התשובה שלו/ה חשובה יותר מהתזכורת שלכם.',
   'A full week has passed without a workout. Instead of reminding them, try asking what would help them get back on track - their answer matters more than your reminder.'),
  ('הילד/ה דיווח/ה על קושי גבוה באימון האחרון. הרגשות האלה לגיטימיים - הכי חשוב להכיר בהם בלי למזער, ולא בהכרח להוריד את רמת הקושי.',
   'Your child reported high difficulty in their last workout. These feelings are valid - the most important thing is acknowledging them, not necessarily lowering the difficulty.'),
  ('כמה אימונים ברצף שהילד/ה מדווח/ת שהיה קשה. שווה לשבת יחד ולשאול איך הוא/היא מרגיש/ה, בלי לנסות לתקן מיד.',
   'Several workouts in a row, your child reported that it was hard. It is worth sitting down together and asking how they feel, without rushing to fix it.'),
  ('התאמנתם יחד בפחות מ-10% מהאימונים האחרונים. ילדים לומדים הרבה מהדוגמה האישית - אימון אחד ביחד יכול לשנות המון.',
   'You have trained together in less than 10 percent of recent workouts. Kids learn a lot from personal example - one workout together can make a big difference.'),
  ('עדיין לא התאמנתם ביחד ולו פעם אחת. נסו להצטרף לאימון אחד השבוע - הנוכחות שלכם משפיעה יותר ממה שנדמה.',
   'You have not trained together even once yet. Try joining one workout this week - your presence matters more than you might think.'),
  ('הילד/ה ממשיך/ה להתאמן בעקביות אבל רמת הקושי לא עולה - וזה בסדר גמור. ההתמדה עצמה היא ההצלחה, לא בהכרח הקושי.',
   'Your child keeps training consistently, but the difficulty level is not increasing - and that is perfectly fine. The consistency itself is the success, not necessarily the difficulty.'),
  ('הילד/ה כבר השלים/ה הרבה אימונים לאורך הדרך. שווה להזכיר לו/לה (ולעצמכם) שההשקעה נמדדת בעקביות, לא רק בתגים שנפתחו.',
   'Your child has already completed a lot of workouts along the way. It is worth reminding them, and yourself, that the effort is measured by consistency, not just by badges unlocked.'),
  ('הילד/ה משלים/ה אימונים באופן סדיר אבל עוד לא פתח/ה הרבה אתגרים. כדאי להדגיש את המסע עצמו ולא רק את התגים - ההתמדה כבר הישג.',
   'Your child completes workouts regularly but has not unlocked many challenges yet. It is worth emphasizing the journey itself, not just the badges - the consistency is already an achievement.'),
  ('הילד/ה התאמן/ה הרבה החודש! זה הזמן המושלם לחגוג את העקביות עצמה, לא רק תוצאה או מעבר שלב.',
   'Your child has worked out a lot this month. This is the perfect time to celebrate the consistency itself, not just a result or leveling up.')
) as translations(hebrew, english)
where parent_tip_rules.tip_text = translations.hebrew;

alter table public.parent_tip_rules drop column tip_text;
alter table public.parent_tip_rules rename column tip_text_i18n to tip_text;
alter table public.parent_tip_rules alter column tip_text set not null;

-- ============================================================================
-- ADDED IN PROMPT 7/7 — LEADERBOARD
-- children RLS only allows a row's own child or their linked parent to see
-- it (by design — see Prompt 1/7), so there is no policy that lets a child
-- see OTHER children's rows at all. Opening a broad "select using (true)"
-- policy on children would also expose child_code to every authenticated
-- user, which would break the whole code-based linking security model (any
-- signed-in user could then link themselves to any child).
--
-- Instead, this SECURITY DEFINER function bypasses RLS internally but only
-- ever returns the four public-safe columns, pre-sorted and pre-limited —
-- nothing else in `children` is reachable through it.
-- ============================================================================

create or replace function public.get_leaderboard(p_limit integer default 20)
returns table (
  id uuid,
  nickname text,
  current_color text,
  total_points integer
)
language sql
security definer
set search_path = public
stable
as $$
  select id, nickname, current_color, total_points
  from public.children
  order by total_points desc
  limit p_limit;
$$;

grant execute on function public.get_leaderboard(integer) to authenticated;

-- ============================================================================
-- ADDED FOR JOURNEY MAP — stable upsert key for the Excel workout import
--
-- exercise_code is the human/spreadsheet-authored identifier (e.g. "white_01")
-- used by scripts/import-workouts.mjs as the upsert conflict target, instead
-- of the internal `id`, so re-importing an updated spreadsheet updates
-- existing rows rather than duplicating them. Nullable because the current
-- seed.sql sample rows predate this column; a unique index still allows
-- multiple NULLs in Postgres, so this does not need a backfill.
--
-- The (color, order_in_color) unique constraint guarantees the journey map
-- can always derive a single unambiguous station ordering per belt color.
-- ============================================================================

alter table public.workouts add column exercise_code text unique;
alter table public.workouts add constraint workouts_color_order_unique unique (color, order_in_color);

-- ============================================================================
-- ADDED FOR JOURNEY MAP — exercise bank + per-workout exercise sequence
--
-- The real workout spreadsheet composes each workout from 2-5 exercises
-- drawn from a shared exercise bank (e.g. "SQ01" = a squat variation), not a
-- single freeform title/description. Storing this as two related tables
-- (rather than flattening it into workouts.description) keeps the real
-- structure available for future screens (e.g. "show me the exercises in
-- this workout") without another migration.
-- ============================================================================

create table public.exercises (
  id text primary key, -- stable code from the spreadsheet's exercise_bank sheet, e.g. "SQ01"
  pattern_en text,
  pattern_he text,
  name_he text not null,
  name_en text not null,
  description_he text,
  difficulty_tip_he text,
  created_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  slot_number integer not null,
  exercise_id text not null references public.exercises (id),
  unique (workout_id, slot_number)
);

alter table public.exercises enable row level security;
alter table public.workout_exercises enable row level security;

create policy "exercises_read" on public.exercises
  for select to authenticated using (true);
create policy "workout_exercises_read" on public.workout_exercises
  for select to authenticated using (true);

-- ============================================================================
-- ADDED FOR INTERVAL WORKOUT TIMER
--
-- Per-belt Tabata-style structure (from the spreadsheet's levels_overview
-- sheet: rounds, work_sec, rest_sec) driving WorkoutRunner's countdown
-- timer. Nullable until scripts/import-workouts.mjs populates them, so the
-- app falls back to the old plain stopwatch when they're absent.
-- ============================================================================

alter table public.bracelet_levels add column interval_rounds integer;
alter table public.bracelet_levels add column interval_work_seconds integer;
alter table public.bracelet_levels add column interval_rest_seconds integer;

-- ============================================================================
-- ADDED FOR GENDERED TIP PHRASING
--
-- Same underlying value for both roles ("male"/"female") — the signup form
-- just shows different labels (הורה: אמא/אבא, ילד/ה: זכר/נקבה) depending on
-- role. Nullable for existing accounts created before this column existed.
--
-- Used to pick the correct Hebrew grammatical gender when rendering
-- parent_tip_rules.tip_text (see resolveGenderedText in i18n-content.ts) —
-- tips describe the CHILD's behavior, so it's the child's gender that
-- matters here, not the parent's.
-- ============================================================================

alter table public.users add column gender text check (gender in ('male', 'female'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_gender text;
begin
  v_role := coalesce(new.raw_user_meta_data ->> 'role', 'parent');
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  v_gender := new.raw_user_meta_data ->> 'gender';

  insert into public.users (id, full_name, role, gender)
  values (new.id, v_full_name, v_role, v_gender);

  if v_role = 'parent' then
    insert into public.parents (id) values (new.id);
  elsif v_role = 'child' then
    insert into public.children (id, nickname, child_code)
    values (new.id, v_full_name, public.generate_child_code());
  end if;

  return new;
end;
$$;

-- ============================================================================
-- ADDED FOR GENDERED TIP PHRASING — rewrite tip_text.he as ICU gender-select
--
-- Only 8 of the 10 tips reference the child directly (הילד/ה, התאמן/ה, ...);
-- low_parent_participation and zero_parent_participation only address the
-- parent in plural/neutral forms and are left as-is. "other" keeps the
-- original slash-form as a safety net if gender is ever null/unrecognized.
-- resolveGenderedText() (src/lib/i18n-content.ts) evaluates this syntax;
-- plain strings without "{gender" pass through unchanged, so this is safe
-- even before every row is converted.
-- ============================================================================

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {כבר 3 ימים שהילד לא התאמן. זה הזמן להזכיר לו שהבחירה בידיים שלו - שאלו אותו מתי נוח לו להתחיל שוב, בלי לחץ.} female {כבר 3 ימים שהילדה לא התאמנה. זה הזמן להזכיר לה שהבחירה בידיים שלה - שאלו אותה מתי נוח לה להתחיל שוב, בלי לחץ.} other {כבר 3 ימים שהילד/ה לא התאמן/ה. זה הזמן להזכיר לו/לה שהבחירה בידיים שלו/ה - שאלו אותו/ה מתי נוח לו/לה להתחיל שוב, בלי לחץ.}}'::text
))
where condition_type = 'no_workout_3_days';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {עבר שבוע שלם בלי אימון. במקום להזכיר, נסו לשאול את הילד מה יעזור לו לחזור למסלול - התשובה שלו חשובה יותר מהתזכורת שלכם.} female {עבר שבוע שלם בלי אימון. במקום להזכיר, נסו לשאול את הילדה מה יעזור לה לחזור למסלול - התשובה שלה חשובה יותר מהתזכורת שלכם.} other {עבר שבוע שלם בלי אימון. במקום להזכיר, נסו לשאול את הילד/ה מה יעזור לו/לה לחזור למסלול - התשובה שלו/ה חשובה יותר מהתזכורת שלכם.}}'::text
))
where condition_type = 'no_workout_7_days';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {הילד דיווח על קושי גבוה באימון האחרון. הרגשות האלה לגיטימיים - הכי חשוב להכיר בהם בלי למזער, ולא בהכרח להוריד את רמת הקושי.} female {הילדה דיווחה על קושי גבוה באימון האחרון. הרגשות האלה לגיטימיים - הכי חשוב להכיר בהם בלי למזער, ולא בהכרח להוריד את רמת הקושי.} other {הילד/ה דיווח/ה על קושי גבוה באימון האחרון. הרגשות האלה לגיטימיים - הכי חשוב להכיר בהם בלי למזער, ולא בהכרח להוריד את רמת הקושי.}}'::text
))
where condition_type = 'high_difficulty_reported';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {כמה אימונים ברצף שהילד מדווח שהיה קשה. שווה לשבת יחד ולשאול איך הוא מרגיש, בלי לנסות לתקן מיד.} female {כמה אימונים ברצף שהילדה מדווחת שהיה קשה. שווה לשבת יחד ולשאול איך היא מרגישה, בלי לנסות לתקן מיד.} other {כמה אימונים ברצף שהילד/ה מדווח/ת שהיה קשה. שווה לשבת יחד ולשאול איך הוא/היא מרגיש/ה, בלי לנסות לתקן מיד.}}'::text
))
where condition_type = 'negative_feeling_streak';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {הילד ממשיך להתאמן בעקביות אבל רמת הקושי לא עולה - וזה בסדר גמור. ההתמדה עצמה היא ההצלחה, לא בהכרח הקושי.} female {הילדה ממשיכה להתאמן בעקביות אבל רמת הקושי לא עולה - וזה בסדר גמור. ההתמדה עצמה היא ההצלחה, לא בהכרח הקושי.} other {הילד/ה ממשיך/ה להתאמן בעקביות אבל רמת הקושי לא עולה - וזה בסדר גמור. ההתמדה עצמה היא ההצלחה, לא בהכרח הקושי.}}'::text
))
where condition_type = 'difficulty_plateau';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {הילד כבר השלים הרבה אימונים לאורך הדרך. שווה להזכיר לו (ולעצמכם) שההשקעה נמדדת בעקביות, לא רק בתגים שנפתחו.} female {הילדה כבר השלימה הרבה אימונים לאורך הדרך. שווה להזכיר לה (ולעצמכם) שההשקעה נמדדת בעקביות, לא רק בתגים שנפתחו.} other {הילד/ה כבר השלים/ה הרבה אימונים לאורך הדרך. שווה להזכיר לו/לה (ולעצמכם) שההשקעה נמדדת בעקביות, לא רק בתגים שנפתחו.}}'::text
))
where condition_type = 'high_total_effort_reminder';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {הילד משלים אימונים באופן סדיר אבל עוד לא פתח הרבה אתגרים. כדאי להדגיש את המסע עצמו ולא רק את התגים - ההתמדה כבר הישג.} female {הילדה משלימה אימונים באופן סדיר אבל עוד לא פתחה הרבה אתגרים. כדאי להדגיש את המסע עצמו ולא רק את התגים - ההתמדה כבר הישג.} other {הילד/ה משלים/ה אימונים באופן סדיר אבל עוד לא פתח/ה הרבה אתגרים. כדאי להדגיש את המסע עצמו ולא רק את התגים - ההתמדה כבר הישג.}}'::text
))
where condition_type = 'low_challenge_unlock_rate';

update public.parent_tip_rules
set tip_text = jsonb_set(tip_text, '{he}', to_jsonb(
  '{gender, select, male {הילד התאמן הרבה החודש! זה הזמן המושלם לחגוג את העקביות עצמה, לא רק תוצאה או מעבר שלב.} female {הילדה התאמנה הרבה החודש! זה הזמן המושלם לחגוג את העקביות עצמה, לא רק תוצאה או מעבר שלב.} other {הילד/ה התאמן/ה הרבה החודש! זה הזמן המושלם לחגוג את העקביות עצמה, לא רק תוצאה או מעבר שלב.}}'::text
))
where condition_type = 'consistent_monthly_activity';

-- ============================================================================
-- ADDED FOR PROMPT 8 — 50-tip expansion
--
-- trigger_source records which channel actually showed a tip: 'auto' (the
-- normal getRelevantTips() evaluation on dashboard load), 'manual' (parent
-- picked it from the "What's happening now" accordion), or 'test' (the
-- temporary manual-test-mode number field). Defaults to 'auto' so existing
-- rows don't need backfilling.
-- ============================================================================

alter table public.parent_tips
  add column trigger_source text not null default 'auto'
    check (trigger_source in ('auto', 'manual', 'test'));

-- ============================================================================
-- CATEGORY 1 — automatic, cumulative-data conditions (7 condition_types,
-- 8 rows since consecutive_day_streak is shared by #35/#44 and
-- abandoned_session is also tagged into the category-3 menu below).
-- ============================================================================

insert into public.parent_tip_rules (principle, condition_type, condition_params, tip_text, priority) values
  ('Empowering Framework', 'abandoned_session',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'רוצה לפרוש באמצע', 'labelEn', 'Wants to quit mid-workout'),
   jsonb_build_object(
     'he', 'מה קורה כאן: פוגש מאמץ.
מה לא לעשות: אל תמהר להסכים.
מה כן לעשות: תציע נקודת בדיקה.
משפט לדוגמה: "עוד דקה אחת ואז נחליט."',
     'en', 'What''s happening: They''re hitting real effort.
What not to do: Don''t rush to agree to stopping.
What to do instead: Offer a check-in point.
Example: "One more minute, then we''ll decide."'
   ), 9),
  ('Liberating Belief', 'two_consecutive_hard_difficulty', '{}'::jsonb,
   jsonb_build_object(
     'he', 'מה קורה כאן: מאבד אמונה.
מה לא לעשות: אל תמהר לתקן.
מה כן לעשות: תזכיר דרך.
משפט לדוגמה: "כמה פעמים ניסית היום?"',
     'en', 'What''s happening: They''re losing confidence.
What not to do: Don''t rush to fix it.
What to do instead: Remind them of their own path.
Example: "How many times did you try today?"'
   ), 7),
  ('Focus On The Journey', 'improvement_between_workouts', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "ראית את ההתקדמות הקטנה?"', 'en', 'Example: "Did you notice that small improvement?"'), 5),
  ('Focus On The Journey', 'consecutive_day_streak', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "איך הצלחת להתמיד?"', 'en', 'Example: "How did you manage to keep it up?"'), 5),
  ('Personal Example & Praise', 'consecutive_day_streak', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "ראיתי שלא ויתרת."', 'en', 'Example: "I saw that you didn''t give up."'), 5),
  ('Focus On The Journey', 'comeback_after_break', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "יפה שחזרת."', 'en', 'Example: "Good to have you back."'), 6),
  ('Focus On The Journey', 'shorter_than_average_workout', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "גם היום נחשב."', 'en', 'Example: "Today counts too."'), 4),
  ('Personal Example & Praise', 'weekly_summary', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "איפה השבוע ראית את עצמך ממשיך למרות שהיה קשה?"', 'en', 'Example: "Where this week did you see yourself keep going even when it was hard?"'), 3);

-- ============================================================================
-- CATEGORY 2 — questionnaire-based, single most-recent-session conditions
-- (7 condition_types, 11 rows — duals share a condition_type on purpose so
-- getRelevantTips shows them together; see tips.service.ts).
-- ============================================================================

insert into public.parent_tip_rules (principle, condition_type, condition_params, tip_text, priority) values
  ('Liberating Belief', 'difficulty_high_last_session', '{}'::jsonb,
   jsonb_build_object(
     'he', 'מה קורה כאן: חושש שלא יצליח.
מה לא לעשות: אל תקטין.
מה כן לעשות: תאמין בו.
משפט לדוגמה: "נכון שקשה. אני חושב שאתה מסוגל."',
     'en', 'What''s happening: They''re worried they won''t succeed.
What not to do: Don''t minimize it.
What to do instead: Believe in them.
Example: "It really is hard. I think you can do it."'
   ), 7),
  ('Personal Example & Praise', 'difficulty_high_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "ומה בכל זאת עשית?"', 'en', 'Example: "And what did you do anyway?"'), 7),
  ('Focus On The Journey', 'difficulty_high_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "הניסיון חשוב היום יותר מהתוצאה."', 'en', 'Example: "The effort matters more today than the result."'), 7),
  ('Liberating Belief', 'difficulty_very_hard_last_session', '{}'::jsonb,
   jsonb_build_object(
     'he', 'מה קורה כאן: מפרש קושי ככישלון.
מה לא לעשות: אל תסכים.
מה כן לעשות: תחבר למשמעות.
משפט לדוגמה: "דווקא כאן מתחזק השריר."',
     'en', 'What''s happening: They''re reading difficulty as failure.
What not to do: Don''t agree to quitting.
What to do instead: Connect it to meaning.
Example: "This is exactly where the muscle gets stronger."'
   ), 8),
  ('Focus On The Journey', 'difficulty_very_hard_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "מה למדת על עצמך?"', 'en', 'Example: "What did you learn about yourself?"'), 8),
  ('All Feelings Are Allowed', 'feeling_frustrated_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "זה באמת מתסכל כשלא מצליחים."', 'en', 'Example: "It really is frustrating when things don''t work out."'), 7),
  ('Focus On The Journey', 'feeling_positive_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "מה עזר לך להצליח?"', 'en', 'Example: "What helped you succeed?"'), 5),
  ('Personal Example & Praise', 'feeling_positive_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "אני גאה בדרך שעשית."', 'en', 'Example: "I''m proud of the way you did it."'), 5),
  ('Focus On The Journey', 'difficulty_high_and_positive_feeling', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "מה עזר לך לא לעצור?"', 'en', 'Example: "What helped you not stop?"'), 7),
  ('All Feelings Are Allowed', 'feeling_tired_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "גם עייפות זה בסדר. לפעמים הגוף רק צריך לנוח."', 'en', 'Example: "Tiredness is okay too. Sometimes the body just needs to rest."'), 6),
  ('All Feelings Are Allowed', 'feeling_exhausted_last_session', '{}'::jsonb,
   jsonb_build_object('he', 'משפט לדוגמה: "נשמע שזה היה המון בשבילו. מגיע לו מנוחה אמיתית."', 'en', 'Example: "Sounds like that was a lot for them. They deserve real rest."'), 6);

-- ============================================================================
-- CATEGORY 3 — parent-initiated "What's happening now" accordion menu
-- (34 rows, condition_type='manual_selection' — never auto-evaluated by
-- getRelevantTips; the UI queries condition_params->>'menuGroup' directly).
-- Priority is irrelevant here (not competing for a slot) so left at 0.
-- ============================================================================

insert into public.parent_tip_rules (principle, condition_type, condition_params, tip_text, priority) values
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'לא בא לי', 'labelEn', 'I don''t feel like it'),
   jsonb_build_object('he', 'מה קורה כאן: הוא לא בהכרח מתנגד. הוא פשוט לא רוצה להתחיל.
מה לא לעשות: אל תתווכח.
מה כן לעשות: תציע בחירה.
משפט לדוגמה: "אתה מעדיף 5 דקות קלות או 3 דקות גיבור?"',
     'en', 'What''s happening: They''re not necessarily refusing. They just don''t want to start.
What not to do: Don''t argue.
What to do instead: Offer a choice.
Example: "Would you rather 5 easy minutes or 3 hero minutes?"'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'עוד מעט', 'labelEn', 'In a minute'),
   jsonb_build_object('he', 'מה קורה כאן: הוא דוחה את אי הנוחות.
מה לא לעשות: אל תרדוף אחריו.
מה כן לעשות: תגדיר זמן.
משפט לדוגמה: "סבבה. בעוד 10 דקות מתחילים."',
     'en', 'What''s happening: They''re postponing the discomfort.
What not to do: Don''t chase after them.
What to do instead: Set a specific time.
Example: "Okay. We start in 10 minutes."'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'שכחתי', 'labelEn', 'I forgot'),
   jsonb_build_object('he', 'מה קורה כאן: האחריות עדיין לא אצלו.
מה לא לעשות: אל תכעס.
מה כן לעשות: תחזיר אחריות.
משפט לדוגמה: "מה יכול לעזור לך לזכור בפעם הבאה?"',
     'en', 'What''s happening: The responsibility isn''t theirs yet.
What not to do: Don''t get angry.
What to do instead: Hand responsibility back.
Example: "What could help you remember next time?"'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'מתחיל להתווכח', 'labelEn', 'Starting to argue'),
   jsonb_build_object('he', 'מה קורה כאן: הוא בודק את המסגרת.
מה לא לעשות: אל תיכנס למאבק.
מה כן לעשות: תחזור על הבחירה.
משפט לדוגמה: "אפשר עכשיו או בעוד 10 דקות. אתה בוחר."',
     'en', 'What''s happening: They''re testing the boundary.
What not to do: Don''t get pulled into a fight.
What to do instead: Repeat the choice.
Example: "Now or in 10 minutes. You choose."'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'רוצה לדלג', 'labelEn', 'Wants to skip'),
   jsonb_build_object('he', 'מה קורה כאן: מחפש דרך קלה יותר.
מה לא לעשות: אל תוותר מיד.
מה כן לעשות: תקטין משימה.
משפט לדוגמה: "בוא נעשה רק 2 דקות ונחליט מחדש."',
     'en', 'What''s happening: They''re looking for an easier way out.
What not to do: Don''t give in right away.
What to do instead: Shrink the task.
Example: "Let''s just do 2 minutes and decide again."'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'מבקש עוד ועוד דחיות', 'labelEn', 'Keeps asking for delays'),
   jsonb_build_object('he', 'מה קורה כאן: בורח מהתחלה.
מה לא לעשות: אל תנהל מו"מ אינסופי.
מה כן לעשות: תסגור החלטה.
משפט לדוגמה: "בחר זמן אחד ונתחיל."',
     'en', 'What''s happening: They''re avoiding the start.
What not to do: Don''t negotiate endlessly.
What to do instead: Close on one decision.
Example: "Pick one time and we start."'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'אומר שזה לא חשוב', 'labelEn', 'Says it doesn''t matter'),
   jsonb_build_object('he', 'מה קורה כאן: לא מחובר למשמעות.
מה לא לעשות: אל תטיף.
מה כן לעשות: תחזיר לבחירה שלו.
משפט לדוגמה: "מה היית רוצה להצליח לעשות יותר טוב?"',
     'en', 'What''s happening: They''re not connected to the meaning.
What not to do: Don''t lecture.
What to do instead: Return it to their own choice.
Example: "What would you like to get better at?"'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'לא מפסיק להתווכח', 'labelEn', 'Won''t stop arguing'),
   jsonb_build_object('he', 'מה קורה כאן: מחפש שליטה.
מה לא לעשות: אל תנצח אותו.
מה כן לעשות: תישאר רגוע.
משפט לדוגמה: "אני שומע אותך. ועדיין עושים היום."',
     'en', 'What''s happening: They''re looking for control.
What not to do: Don''t try to "win".
What to do instead: Stay calm.
Example: "I hear you. And we''re still doing it today."'), 0),
  ('Empowering Framework', 'manual_selection',
   jsonb_build_object('menuGroup', 1, 'labelHe', 'אומר "אתה מכריח אותי"', 'labelEn', 'Says "you''re forcing me"'),
   jsonb_build_object('he', 'מה קורה כאן: מרגיש שאין לו בחירה.
מה לא לעשות: אל תתגונן.
מה כן לעשות: תציע בחירה בתוך המסגרת.
משפט לדוגמה: "את האתגר אתה בוחר."',
     'en', 'What''s happening: They feel like they have no choice.
What not to do: Don''t get defensive.
What to do instead: Offer a choice within the frame.
Example: "You choose the challenge."'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'אני לא טוב בזה', 'labelEn', 'I''m not good at this'),
   jsonb_build_object('he', 'מה קורה כאן: מזהה את עצמו עם התוצאה.
מה לא לעשות: אל תתווכח.
מה כן לעשות: תפריד בין הילד לביצוע.
משפט לדוגמה: "עדיין לא הצלחת. זה לא אומר שאתה לא טוב."',
     'en', 'What''s happening: They''re identifying themselves with the result.
What not to do: Don''t argue.
What to do instead: Separate the child from the performance.
Example: "You haven''t succeeded yet. That doesn''t mean you''re not good."'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'אני לא יכול', 'labelEn', 'I can''t'),
   jsonb_build_object('he', 'מה קורה כאן: חסר ביטחון כרגע.
מה לא לעשות: אל תשכנע.
מה כן לעשות: תבקש ניסיון.
משפט לדוגמה: "בוא נבדוק ביחד."',
     'en', 'What''s happening: They''re lacking confidence right now.
What not to do: Don''t try to convince them.
What to do instead: Ask for one attempt.
Example: "Let''s check together."'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'מפחד להיכשל', 'labelEn', 'Afraid to fail'),
   jsonb_build_object('he', 'מה קורה כאן: מגן על עצמו.
מה לא לעשות: אל תלחץ.
מה כן לעשות: תנרמל.
משפט לדוגמה: "להיכשל זה חלק מהלמידה."',
     'en', 'What''s happening: They''re protecting themselves.
What not to do: Don''t pressure them.
What to do instead: Normalize it.
Example: "Failing is part of learning."'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'מבקש עזרה מיד', 'labelEn', 'Asks for help immediately'),
   jsonb_build_object('he', 'מה קורה כאן: לא בטוח בעצמו.
מה לא לעשות: אל תפתור מיד.
מה כן לעשות: תן ניסיון עצמאי.
משפט לדוגמה: "מה היית מנסה לפני שאני עוזר?"',
     'en', 'What''s happening: They''re unsure of themselves.
What not to do: Don''t solve it right away.
What to do instead: Let them try independently first.
Example: "What would you try before I help?"'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'משווה לחבר', 'labelEn', 'Comparing to a friend'),
   jsonb_build_object('he', 'מה קורה כאן: מחפש ערך עצמי.
מה לא לעשות: אל תשווה בחזרה.
מה כן לעשות: תחזיר לעצמו.
משפט לדוגמה: "אני מסתכל על ההתקדמות שלך."',
     'en', 'What''s happening: They''re looking for self-worth.
What not to do: Don''t compare back.
What to do instead: Bring it back to them.
Example: "I''m looking at your own progress."'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'אומר "אני גרוע"', 'labelEn', 'Says "I''m terrible"'),
   jsonb_build_object('he', 'מה קורה כאן: מדבר מתוך תסכול.
מה לא לעשות: אל תבטל.
מה כן לעשות: תשקף.
משפט לדוגמה: "אתה מאוכזב כרגע."',
     'en', 'What''s happening: They''re speaking out of frustration.
What not to do: Don''t dismiss it.
What to do instead: Reflect it back.
Example: "You''re disappointed right now."'), 0),
  ('Liberating Belief', 'manual_selection',
   jsonb_build_object('menuGroup', 2, 'labelHe', 'הצליח ואז אומר שזה במקרה', 'labelEn', 'Succeeded, then says it was luck'),
   jsonb_build_object('he', 'מה קורה כאן: מתקשה לייחס הצלחה לעצמו.
מה לא לעשות: אל תתווכח.
מה כן לעשות: תחבר למאמץ.
משפט לדוגמה: "המקרה לא התאמן. אתה כן."',
     'en', 'What''s happening: They struggle to credit themselves for success.
What not to do: Don''t argue.
What to do instead: Connect it to effort.
Example: "Luck didn''t train. You did."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'בוכה', 'labelEn', 'Crying'),
   jsonb_build_object('he', 'משפט לדוגמה: "מותר לבכות. אני איתך."', 'en', 'Example: "It''s okay to cry. I''m here with you."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'כועס', 'labelEn', 'Angry'),
   jsonb_build_object('he', 'משפט לדוגמה: "אני רואה שאתה ממש כועס עכשיו."', 'en', 'Example: "I can see you''re really angry right now."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'מתבייש', 'labelEn', 'Ashamed'),
   jsonb_build_object('he', 'משפט לדוגמה: "הרבה ילדים מרגישים ככה."', 'en', 'Example: "A lot of kids feel that way."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'נבוך', 'labelEn', 'Embarrassed'),
   jsonb_build_object('he', 'משפט לדוגמה: "לא חייב להיות מושלם."', 'en', 'Example: "You don''t have to be perfect."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'עצוב', 'labelEn', 'Sad'),
   jsonb_build_object('he', 'משפט לדוגמה: "רוצה לספר מה מבאס?"', 'en', 'Example: "Want to tell me what''s bothering you?"'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'מאוכזב', 'labelEn', 'Disappointed'),
   jsonb_build_object('he', 'משפט לדוגמה: "גם אכזבה היא חלק מהדרך."', 'en', 'Example: "Disappointment is part of the journey too."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'מפחד', 'labelEn', 'Scared'),
   jsonb_build_object('he', 'משפט לדוגמה: "פחד לא אומר לעצור."', 'en', 'Example: "Fear doesn''t mean stop."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'נסגר', 'labelEn', 'Shutting down'),
   jsonb_build_object('he', 'משפט לדוגמה: "אני כאן כשתרצה לדבר."', 'en', 'Example: "I''m here whenever you want to talk."'), 0),
  ('All Feelings Are Allowed', 'manual_selection',
   jsonb_build_object('menuGroup', 3, 'labelHe', 'צועק', 'labelEn', 'Yelling'),
   jsonb_build_object('he', 'משפט לדוגמה: "אני מקשיב גם בלי צעקות."', 'en', 'Example: "I listen even without yelling."'), 0),
  ('Focus On The Journey', 'manual_selection',
   jsonb_build_object('menuGroup', 4, 'labelHe', 'עשה למרות שלא בא לו', 'labelEn', 'Did it despite not wanting to'),
   jsonb_build_object('he', 'משפט לדוגמה: "זה אומץ אמיתי."', 'en', 'Example: "That''s real courage."'), 0),
  ('Focus On The Journey', 'manual_selection',
   jsonb_build_object('menuGroup', 4, 'labelHe', 'רוצה רק לנצח', 'labelEn', 'Only wants to win'),
   jsonb_build_object('he', 'משפט לדוגמה: "מה אתה רוצה ללמוד היום?"', 'en', 'Example: "What do you want to learn today?"'), 0),
  ('Personal Example & Praise', 'manual_selection',
   jsonb_build_object('menuGroup', 5, 'labelHe', 'הילד שואל אם גם אתה מתאמן', 'labelEn', 'Child asks if you work out too'),
   jsonb_build_object('he', 'משפט לדוגמה: "כן, וגם לי לפעמים קשה."', 'en', 'Example: "Yes, and it''s hard for me sometimes too."'), 0),
  ('Personal Example & Praise', 'manual_selection',
   jsonb_build_object('menuGroup', 5, 'labelHe', 'ההורה ויתר על משהו וחזר', 'labelEn', 'You once gave up on something and came back'),
   jsonb_build_object('he', 'משפט לדוגמה: "ספר לו איך חזרת לנסות."', 'en', 'Example: "Tell them how you went back to trying."'), 0),
  ('Personal Example & Praise', 'manual_selection',
   jsonb_build_object('menuGroup', 5, 'labelHe', 'הילד עזר למישהו אחר', 'labelEn', 'Child helped someone else'),
   jsonb_build_object('he', 'משפט לדוגמה: "זה מראה על כוח פנימי."', 'en', 'Example: "That shows real inner strength."'), 0),
  ('Personal Example & Praise', 'manual_selection',
   jsonb_build_object('menuGroup', 5, 'labelHe', 'הילד פרגן לעצמו', 'labelEn', 'Child gave themselves credit'),
   jsonb_build_object('he', 'משפט לדוגמה: "מה אתה הכי גאה בו היום?"', 'en', 'Example: "What are you most proud of today?"'), 0),
  ('Personal Example & Praise', 'manual_selection',
   jsonb_build_object('menuGroup', 5, 'labelHe', 'הילד מבקש מחמאה', 'labelEn', 'Child is fishing for a compliment'),
   jsonb_build_object('he', 'משפט לדוגמה: "במה אתה גאה בעצמך?"', 'en', 'Example: "What are you proud of yourself for?"'), 0),
  ('Personal Example & Praise', 'manual_selection',
   jsonb_build_object('menuGroup', 5, 'labelHe', 'הילד מזלזל בעצמו', 'labelEn', 'Child is putting themselves down'),
   jsonb_build_object('he', 'משפט לדוגמה: "איזה דבר אחד כן הלך לך טוב?"', 'en', 'Example: "What''s one thing that did go well for you?"'), 0);

-- ============================================================================
-- ADDED FOR TIP LIKE/DISMISS FEATURE
--
-- One counter per tip overall (not per-child, per the product decision —
-- we only want to know how often a card is liked in general, not who liked
-- it). Incremented via a security-definer RPC rather than a raw UPDATE RLS
-- policy, since parents otherwise have no write access to parent_tip_rules
-- (team-authored content) and this keeps the writable surface to exactly
-- one counter column.
-- ============================================================================

alter table public.parent_tip_rules add column like_count integer not null default 0;

create or replace function public.increment_tip_like_count(p_rule_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.parent_tip_rules
  set like_count = like_count + 1
  where id = p_rule_id;
$$;

grant execute on function public.increment_tip_like_count(uuid) to authenticated;

-- ============================================================================
-- ADDED FOR POINTS HEADROOM
--
-- required_points used to equal exactly base_points(20) * required_workouts
-- for every color, i.e. zero headroom for any bonus (trained_longer +5,
-- harder_than_recommended +5, parent_together +10, first_in_color +10 —
-- see points.service.ts). The moment a child earned even one bonus,
-- points_in_color raced past required_points before workouts_completed_in_color
-- reached required_workouts, so the dashboard showed "0 points left" while
-- a workout was still required (progression needs BOTH thresholds — see
-- evaluateProgression). Bumped required_points to 1.5x (30/workout) so
-- typical bonus-earning play doesn't hit 0 early.
-- ============================================================================

update public.bracelet_levels set required_points = 300 where color = 'white';
update public.bracelet_levels set required_points = 420 where color = 'orange';
update public.bracelet_levels set required_points = 540 where color = 'green';
update public.bracelet_levels set required_points = 660 where color = 'blue';
update public.bracelet_levels set required_points = 780 where color = 'purple';

-- ============================================================================
-- ADDED FOR EXERCISE IMAGES
--
-- Nullable — the UI only renders an <img> when this is set, so exercises
-- without one just show as before. Upload the image to Supabase Storage
-- (or any public host) and update this column with the resulting URL; see
-- the app's reply for the step-by-step.
-- ============================================================================

alter table public.exercises add column image_url text;

-- ============================================================================
-- ADDED FOR REPEATABLE ("TYPE B") CHALLENGES
--
-- Two kinds of challenges now exist, distinguished by challenge_type:
--   'condition'          — the original 7 challenges: auto-detected from
--                           cumulative activity (first workout, streaks,
--                           etc — see challenge.service.ts's isConditionMet),
--                           unlock and complete in the same moment, one-time.
--   'repeatable_workout' — a challenging "workout" of its own (e.g. a
--                           stairs climb) that unlocks when a child FINISHES
--                           a given belt color (unlock_color) and can then be
--                           performed any number of times, each time
--                           awarding bonus_points again. Does not appear on
--                           the journey map — only in the Challenges tab.
--
-- child_challenges keeps tracking one-time UNLOCK state for both kinds (for
-- 'condition' rows, unlocking IS completing, so completed_at already means
-- that; for 'repeatable_workout' rows it just marks "became available" —
-- the actual per-attempt history lives in challenge_sessions below).
-- ============================================================================

alter table public.challenges
  add column challenge_type text not null default 'condition'
    check (challenge_type in ('condition', 'repeatable_workout'));
alter table public.challenges
  add column unlock_color text references public.bracelet_levels (color);

create table public.challenge_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  challenge_id text not null references public.challenges (id) on delete cascade,
  status text not null default 'completed' check (status in ('in_progress', 'completed')),
  start_time timestamptz not null default now(),
  end_time timestamptz,
  actual_duration_seconds integer,
  difficulty_reported integer,
  feeling_after text,
  parent_trained_together boolean not null default false,
  points_awarded integer,
  created_at timestamptz not null default now()
);

alter table public.challenge_sessions enable row level security;

create policy "challenge_sessions_select_own" on public.challenge_sessions
  for select using (child_id = auth.uid() or public.is_parent_of(child_id));
create policy "challenge_sessions_insert_own" on public.challenge_sessions
  for insert with check (child_id = auth.uid());
create policy "challenge_sessions_update_own" on public.challenge_sessions
  for update using (child_id = auth.uid());

-- 5 sample repeatable challenges, one per color, for testing the flow end
-- to end. Content/points are placeholders — easy to edit later since this is
-- all DB-driven (see the challenges DB-unification change).
insert into public.challenges (id, title, description, bonus_points, condition_type, challenge_type, unlock_color) values
  ('stairs_white', jsonb_build_object('he', '100 מדרגות', 'en', '100 stairs'),
   jsonb_build_object('he', 'עלה 100 מדרגות ברצף, בקצב שנוח לך.', 'en', 'Climb 100 stairs in a row, at your own pace.'),
   15, null, 'repeatable_workout', 'white'),
  ('stairs_orange', jsonb_build_object('he', '200 מדרגות', 'en', '200 stairs'),
   jsonb_build_object('he', 'עלה 200 מדרגות ברצף, בקצב שנוח לך.', 'en', 'Climb 200 stairs in a row, at your own pace.'),
   20, null, 'repeatable_workout', 'orange'),
  ('stairs_green', jsonb_build_object('he', '300 מדרגות', 'en', '300 stairs'),
   jsonb_build_object('he', 'עלה 300 מדרגות ברצף, בקצב שנוח לך.', 'en', 'Climb 300 stairs in a row, at your own pace.'),
   25, null, 'repeatable_workout', 'green'),
  ('stairs_blue', jsonb_build_object('he', '400 מדרגות', 'en', '400 stairs'),
   jsonb_build_object('he', 'עלה 400 מדרגות ברצף, בקצב שנוח לך.', 'en', 'Climb 400 stairs in a row, at your own pace.'),
   30, null, 'repeatable_workout', 'blue'),
  ('stairs_purple', jsonb_build_object('he', '500 מדרגות', 'en', '500 stairs'),
   jsonb_build_object('he', 'עלה 500 מדרגות ברצף, בקצב שנוח לך.', 'en', 'Climb 500 stairs in a row, at your own pace.'),
   35, null, 'repeatable_workout', 'purple');

-- ============================================================================
-- ADDED FOR CHALLENGE POINTS ISOLATION
--
-- Repeatable ("type B") challenges can be done any number of times, so
-- their points must NOT feed points_in_color (the belt-progression gate —
-- see progression.service.ts's calculateProgressPercent) or they'd inflate
-- the displayed progress bar without any matching real workout progress.
-- They still count toward total_points (lifetime score / leaderboard).
-- ============================================================================

create or replace function public.increment_child_total_points_only(p_child_id uuid, p_points integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.children
  set total_points = total_points + p_points
  where id = p_child_id;
$$;

grant execute on function public.increment_child_total_points_only(uuid, integer) to authenticated;
