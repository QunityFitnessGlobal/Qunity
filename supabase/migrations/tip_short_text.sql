-- Qunity — short tips for the parent home screen
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR THE PARENT HOME SCREEN'S SHORT TIPS") so it can be pasted into
-- the Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Adds parent_tip_rules.short_text and reason_text, and fills them for the
-- 29 auto-evaluated tips. Run it BEFORE deploying the app version that
-- reads them. Safe to run more than once.

alter table public.parent_tip_rules
  add column if not exists short_text jsonb,
  add column if not exists reason_text jsonb;

-- abandoned_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'רוצה לנסות שוב יחד? דקה אחת ואז נחליט.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} עצרה באמצע האימון האחרון} other {כי {name} עצר באמצע האימון האחרון}}')
where id = 'f2b0fa50-46ec-4f2f-8f7c-db14eee536d3';

-- comeback_after_break
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'יפה שחזרת, כל חזרה מחזקת אותך.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} חזרה להתאמן אחרי {days} ימים של הפסקה} other {כי {name} חזר להתאמן אחרי {days} ימים של הפסקה}}')
where id = '451c414a-7c48-461f-9c1c-71dd31814acf';

-- consecutive_day_streak
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'איך הצלחת להתמיד? זה כוח אמיתי.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} התאמנה {days} ימים ברצף} other {כי {name} התאמן {days} ימים ברצף}}')
where id = '8927ab22-217c-4bf1-8ca4-6522163673da';

-- consecutive_day_streak
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'ראיתי שלא ויתרת, זה כוח רצון.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} התאמנה {days} ימים ברצף} other {כי {name} התאמן {days} ימים ברצף}}')
where id = 'f1704326-99fd-4c59-898e-e62fbb31f0ca';

-- consistent_monthly_activity
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'ראיתי כמה התמדת החודש. איך עשית את זה?'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} השלימה {count} אימונים החודש} other {כי {name} השלים {count} אימונים החודש}}')
where id = '4979769d-6868-4f58-a830-63517f70c012';

-- difficulty_high_and_positive_feeling
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'מה עזר לך לא לעצור?'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהיה מאתגר, ובכל זאת סיימה בהרגשה טובה} other {כי {name} סימן שהיה מאתגר, ובכל זאת סיים בהרגשה טובה}}')
where id = '6426e1f9-ffa3-4867-93b7-202c763465ad';

-- difficulty_high_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'הניסיון חשוב יותר מהתוצאה.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהאימון האחרון היה מאתגר} other {כי {name} סימן שהאימון האחרון היה מאתגר}}')
where id = '60f2484e-d38b-4307-9c94-95e34e2d2a2b';

-- difficulty_high_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'ומה בכל זאת עשית? כל צעד הוא הישג.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהאימון האחרון היה מאתגר} other {כי {name} סימן שהאימון האחרון היה מאתגר}}')
where id = '9dd41fb1-26e0-420a-8a22-a74218184f1c';

-- difficulty_high_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'זה לא פשוט, אבל אני {parentGender, select, female {מאמינה} other {מאמין}} בך.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהאימון האחרון היה מאתגר} other {כי {name} סימן שהאימון האחרון היה מאתגר}}')
where id = '70a49fc7-7b5b-4171-b2e6-4311ca0047f7';

-- difficulty_plateau
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {את ממשיכה להתאמן, וזו ההצלחה האמיתית.} other {אתה ממשיך להתאמן, וזו ההצלחה האמיתית.}}'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} מתאמנת בעקביות באותה רמת קושי} other {כי {name} מתאמן בעקביות באותה רמת קושי}}')
where id = '3b4eb51a-ec06-4fb1-a1a4-d1cd5e2f5017';

-- difficulty_very_hard_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'מה למדת על עצמך מהאימון הקשה?'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהאימון האחרון היה קשה מאוד} other {כי {name} סימן שהאימון האחרון היה קשה מאוד}}')
where id = 'a4c72848-7d98-4dfa-84ce-4624add352da';

-- difficulty_very_hard_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {כאן בדיוק מתחזק השריר שלך. אל תוותרי.} other {כאן בדיוק מתחזק השריר שלך. אל תוותר.}}'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהאימון האחרון היה קשה מאוד} other {כי {name} סימן שהאימון האחרון היה קשה מאוד}}')
where id = '4dcea5af-05ed-4d9f-89a1-759dd9eb356b';

-- feeling_exhausted_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'זה היה המון. מגיעה לך מנוחה אמיתית.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} הרגישה מותשת אחרי האימון האחרון} other {כי {name} הרגיש מותש אחרי האימון האחרון}}')
where id = '169ac51a-1925-4a17-abb1-91fdec74fc12';

-- feeling_frustrated_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'זה מתסכל כשלא מצליחים, אני {parentGender, select, female {מבינה} other {מבין}} אותך.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} הרגישה מתוסכלת אחרי האימון האחרון} other {כי {name} הרגיש מתוסכל אחרי האימון האחרון}}')
where id = 'caa70203-dd20-4fd0-a2bf-43ce73caeefe';

-- feeling_positive_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'אני גאה בדרך שעשית.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סיימה את האימון האחרון בהרגשה טובה} other {כי {name} סיים את האימון האחרון בהרגשה טובה}}')
where id = 'e0d51a84-7a28-4760-8d10-7394a8a965d3';

-- feeling_positive_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {מה עזר לך להצליח? בואי נחזק את זה.} other {מה עזר לך להצליח? בוא נחזק את זה.}}'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סיימה את האימון האחרון בהרגשה טובה} other {כי {name} סיים את האימון האחרון בהרגשה טובה}}')
where id = '8db47520-1c8d-4c52-aab4-004dafacf8e7';

-- feeling_tired_last_session
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'גם עייפות זה בסדר. הגוף צריך לנוח.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} הרגישה עייפה אחרי האימון האחרון} other {כי {name} הרגיש עייף אחרי האימון האחרון}}')
where id = '21a1c58f-3aad-4ade-b3f4-2875e45917aa';

-- high_difficulty_reported
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'היה ממש קשה, נכון? זה בסדר להרגיש ככה.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שהאימון האחרון היה קשה מאוד} other {כי {name} סימן שהאימון האחרון היה קשה מאוד}}')
where id = '2f526750-db66-4989-9137-e00359b875d1';

-- high_total_effort_reminder
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'כל אימון שעשית חיזק אותך. ההתמדה היא ההישג.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} השלימה כבר {count} אימונים} other {כי {name} השלים כבר {count} אימונים}}')
where id = '95c778b2-aa76-4e9b-acc1-dc54744a3362';

-- improvement_between_workouts
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'ראית את ההתקדמות הקטנה? זה מה שחשוב.'),
  reason_text = jsonb_build_object('he', 'כי האימון האחרון של {name} הלך טוב יותר מהקודם')
where id = '7f5be4f7-2110-4917-af32-3b5be1906d90';

-- low_challenge_unlock_rate
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {את מתאמנת בקביעות, וזה כבר הישג.} other {אתה מתאמן בקביעות, וזה כבר הישג.}}'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} מתאמנת בקביעות, גם בלי הרבה אתגרים פתוחים} other {כי {name} מתאמן בקביעות, גם בלי הרבה אתגרים פתוחים}}')
where id = '933d6700-d24c-4ea1-8391-27c686c141aa';

-- low_parent_participation
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {רוצה שנתאמן יחד השבוע? תבחרי את האימון.} other {רוצה שנתאמן יחד השבוע? תבחר את האימון.}}'),
  reason_text = jsonb_build_object('he', 'כי לאחרונה כמעט לא התאמנתם יחד')
where id = 'e36ef5d7-fc7c-44e9-8b00-71aeebe2c76e';

-- negative_feeling_streak
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {איך את מרגישה עם האימונים בזמן האחרון?} other {איך אתה מרגיש עם האימונים בזמן האחרון?}}'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סיימה כמה אימונים ברצף בהרגשה לא טובה} other {כי {name} סיים כמה אימונים ברצף בהרגשה לא טובה}}')
where id = '97557c7a-c767-49ef-97d2-26ff9aacf7b7';

-- no_workout_3_days
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'מתי נוח לך לחזור להתאמן? ההחלטה שלך.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} לא התאמנה כבר {days} ימים} other {כי {name} לא התאמן כבר {days} ימים}}')
where id = '414a3592-67df-470c-b3e4-cc250b56ff7a';

-- no_workout_7_days
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'מה יעזור לך לחזור למסלול? אני כאן איתך.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} לא התאמנה כבר {days} ימים} other {כי {name} לא התאמן כבר {days} ימים}}')
where id = 'c368a084-7a36-4843-98a3-e03cfadab9bc';

-- shorter_than_average_workout
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'גם היום נחשב, כל צעד מקרב אותך.'),
  reason_text = jsonb_build_object('he', 'כי האימון האחרון של {name} היה קצר מהרגיל')
where id = 'aab3f19d-c726-4ed4-8581-065e49ae849d';

-- two_consecutive_hard_difficulty
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', 'כמה פעמים ניסית? כל ניסיון מקרב אותך.'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סימנה שני אימונים קשים ברצף} other {כי {name} סימן שני אימונים קשים ברצף}}')
where id = '511068be-421c-4bbb-834f-7ce7ff6a3133';

-- weekly_summary
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {איפה השבוע ראית את עצמך ממשיכה למרות הקושי?} other {איפה השבוע ראית את עצמך ממשיך למרות הקושי?}}'),
  reason_text = jsonb_build_object('he', '{gender, select, female {כי {name} סגרה את השבוע באימון} other {כי {name} סגר את השבוע באימון}}')
where id = 'ea930fb4-173e-4a88-8483-0278cefa71c0';

-- zero_parent_participation
update public.parent_tip_rules set
  short_text = jsonb_build_object('he', '{gender, select, female {אפשר להצטרף אלייך לאימון הבא?} other {אפשר להצטרף אליך לאימון הבא?}}'),
  reason_text = jsonb_build_object('he', 'כי עוד לא התאמנתם יחד אף פעם')
where id = 'ca4b5505-f62d-44c4-a0e8-fd8e1e12f4ef';

-- Should show 29.
select count(*) as tips_with_short_text from public.parent_tip_rules where short_text is not null;
