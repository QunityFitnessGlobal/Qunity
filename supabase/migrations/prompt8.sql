-- Qunity — Prompt 8 migration (50-tip expansion)
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR PROMPT 8 — 50-tip expansion") so it can be copy-pasted into the
-- Supabase SQL Editor on its own, without scrolling through the full
-- cumulative schema file. schema.sql remains the source of truth — if the
-- two ever diverge, schema.sql wins; re-export this file from it.
--
-- Prerequisite: everything ABOVE this section in schema.sql must already be
-- applied, including the "ADDED FOR GENDERED TIP PHRASING" block (the
-- users.gender column + the 8 tip_text gender-select updates). If you're not
-- sure, check: `select column_name from information_schema.columns where
-- table_name = 'users' and column_name = 'gender';` — if that returns a row,
-- you're ready to run this file.
--
-- Safe to run exactly once. Re-running will fail on
-- "column trigger_source already exists" (by design — this is not an
-- idempotent upsert, same as the rest of schema.sql).

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
