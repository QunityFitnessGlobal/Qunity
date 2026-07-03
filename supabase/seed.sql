-- Qunity seed data (Prompt 3/7)
-- Run once in the SQL Editor, after supabase/schema.sql (including the
-- Prompt 2/7 addition) has already been applied.

insert into public.bracelet_levels (color, order_index, required_workouts, required_points) values
  ('white',  1, 10, 200),
  ('orange', 2, 14, 280),
  ('green',  3, 18, 360),
  ('blue',   4, 22, 440),
  ('purple', 5, 26, 520);

insert into public.workouts (title, description, recommended_duration_minutes, recommended_difficulty, color, order_in_color) values
  ('קפיצות במקום', 'חימום קליל עם קפיצות פישוק במקום.', 10, 1, 'white', 1),
  ('ריצה קלה בחצר', 'ריצה בקצב נוח סביב החצר או הגינה.', 15, 1, 'white', 2),
  ('מסלול מכשולים ביתי', 'בניית מסלול מכשולים פשוט עם כריות וכיסאות.', 15, 2, 'orange', 1),
  ('ריקוד חופשי', 'ריקוד חופשי לשירים אהובים במשך רבע שעה.', 20, 2, 'orange', 2),
  ('משחק כדור עם ההורה', 'זריקות והעברות כדור יחד עם ההורה.', 20, 2, 'green', 1),
  ('קפיצה בחבל', 'קפיצות בחבל ברצף עם הפסקות קצרות.', 15, 3, 'green', 2),
  ('אימון כוח לילדים', 'תרגילי משקל גוף: סקוואטים, פלאנק וכפיפות בטן.', 25, 3, 'blue', 1),
  ('ריצת ספרינטים קצרה', 'סטים של ריצות מהירות קצרות עם מנוחה.', 20, 4, 'blue', 2),
  ('מסלול אתגרים משולב', 'שילוב של ריצה, קפיצות ותרגילי כוח במסלול אחד.', 30, 4, 'purple', 1),
  ('יוגה ומתיחות', 'רצף מתיחות ותנוחות יוגה בסיסיות לגמישות.', 25, 3, 'purple', 2);

insert into public.challenges (id, title, description, bonus_points, condition_type) values
  ('first_workout',  'First Workout',       'השלמת האימון הראשון שלך.',              20, 'first_workout'),
  ('parent_power',   'Parent Power',        'התאמנת יחד עם ההורה שלך.',               10, 'parent_power'),
  ('streak_3',       '3 Workout Streak',    'התאמנת 3 ימים ברצף.',                    15, 'streak_3'),
  ('streak_5',       '5 Workout Streak',    'התאמנת 5 ימים ברצף.',                    30, 'streak_5'),
  ('minutes_100',    '100 Minutes Club',    'צברת 100 דקות אימון במצטבר.',            25, 'total_minutes_100'),
  ('color_starter',  'Color Starter',       'השלמת את האימון הראשון בצבע חדש.',       10, 'color_starter'),
  ('color_finisher', 'Color Finisher',      'עמדת בכל הדרישות ועלית לצבע הבא.',       50, 'color_finisher');

-- ============================================================================
-- ADDED IN PROMPT 6/7 — PARENT TIP RULES
-- condition_type must match a key in
-- src/services/tip-conditions/index.ts (TIP_CONDITION_REGISTRY).
-- priority: higher number = more urgent/relevant; getRelevantTips() shows
-- only the top 3 matching rules, sorted by priority descending.
-- Mirrored for reference (not used at runtime) in src/data/tips.data.ts.
-- ============================================================================

insert into public.parent_tip_rules (principle, condition_type, condition_params, tip_text, priority) values
  ('Empowering Framework', 'no_workout_3_days', '{"days": 3}'::jsonb,
   'כבר 3 ימים שהילד/ה לא התאמן/ה. זה הזמן להזכיר לו/לה שהבחירה בידיים שלו/ה - שאלו אותו/ה מתי נוח לו/לה להתחיל שוב, בלי לחץ.', 8),
  ('Empowering Framework', 'no_workout_7_days', '{"days": 7}'::jsonb,
   'עבר שבוע שלם בלי אימון. במקום להזכיר, נסו לשאול את הילד/ה מה יעזור לו/לה לחזור למסלול - התשובה שלו/ה חשובה יותר מהתזכורת שלכם.', 9),
  ('All Feelings Are Allowed', 'high_difficulty_reported', '{"minDifficulty": 4}'::jsonb,
   'הילד/ה דיווח/ה על קושי גבוה באימון האחרון. הרגשות האלה לגיטימיים - הכי חשוב להכיר בהם בלי למזער, ולא בהכרח להוריד את רמת הקושי.', 6),
  ('All Feelings Are Allowed', 'negative_feeling_streak', '{"streak": 3}'::jsonb,
   'כמה אימונים ברצף שהילד/ה מדווח/ת שהיה קשה. שווה לשבת יחד ולשאול איך הוא/היא מרגיש/ה, בלי לנסות לתקן מיד.', 7),
  ('Personal Example', 'low_parent_participation', '{"maxPercent": 10}'::jsonb,
   'התאמנתם יחד בפחות מ-10% מהאימונים האחרונים. ילדים לומדים הרבה מהדוגמה האישית - אימון אחד ביחד יכול לשנות המון.', 5),
  ('Personal Example', 'zero_parent_participation', '{}'::jsonb,
   'עדיין לא התאמנתם ביחד ולו פעם אחת. נסו להצטרף לאימון אחד השבוע - הנוכחות שלכם משפיעה יותר ממה שנדמה.', 6),
  ('Liberating Belief', 'difficulty_plateau', '{"lookback": 5}'::jsonb,
   'הילד/ה ממשיך/ה להתאמן בעקביות אבל רמת הקושי לא עולה - וזה בסדר גמור. ההתמדה עצמה היא ההצלחה, לא בהכרח הקושי.', 4),
  ('Liberating Belief', 'high_total_effort_reminder', '{"minWorkouts": 15}'::jsonb,
   'הילד/ה כבר השלים/ה הרבה אימונים לאורך הדרך. שווה להזכיר לו/לה (ולעצמכם) שההשקעה נמדדת בעקביות, לא רק בתגים שנפתחו.', 3),
  ('Focus On The Journey', 'low_challenge_unlock_rate', '{"maxRatio": 0.2}'::jsonb,
   'הילד/ה משלים/ה אימונים באופן סדיר אבל עוד לא פתח/ה הרבה אתגרים. כדאי להדגיש את המסע עצמו ולא רק את התגים - ההתמדה כבר הישג.', 3),
  ('Focus On The Journey', 'consistent_monthly_activity', '{"minWorkoutsThisMonth": 8}'::jsonb,
   'הילד/ה התאמן/ה הרבה החודש! זה הזמן המושלם לחגוג את העקביות עצמה, לא רק תוצאה או מעבר שלב.', 2);
