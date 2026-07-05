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
