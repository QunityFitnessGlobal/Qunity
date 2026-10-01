-- Qunity — tips for the parent's workouts screen
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR THE PARENT WORKOUTS SCREEN TIP") so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Run this BEFORE deploying the app version with the new workouts screen:
-- until these rows exist, the screen simply shows no tip.
--
-- Safe to run exactly once. Re-running adds a second copy of every row.

insert into public.parent_tip_rules (principle, condition_type, condition_params, tip_text, priority) values
  (jsonb_build_object('he', 'מסגרת מעצימה', 'en', 'Empowering Framework'),
   'history_no_workouts_14_days', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {לא היו אימונים בשבועיים האחרונים - זו הזדמנות להזכיר ל{name} בנועם שהדרך היא צעד אחר צעד, וכשהיא תהיה מוכנה, אתם שם לתמוך בה.} other {לא היו אימונים בשבועיים האחרונים - זו הזדמנות להזכיר ל{name} בנועם שהדרך היא צעד אחר צעד, וכשהוא יהיה מוכן, אתם שם לתמוך בו.}}',
     'en', 'No workouts in the last two weeks - a chance to gently remind {name} that the road is step by step, and when {gender, select, female {she is} other {he is}} ready, you are there to support.'),
   100),
  (jsonb_build_object('he', 'מסגרת מעצימה', 'en', 'Empowering Framework'),
   'history_no_workouts_7_days', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {לא היו אימונים בשבוע האחרון - זו הזדמנות להזכיר ל{name} בנועם שהדרך היא צעד אחר צעד, וכשהיא תהיה מוכנה, אתם שם לתמוך בה.} other {לא היו אימונים בשבוע האחרון - זו הזדמנות להזכיר ל{name} בנועם שהדרך היא צעד אחר צעד, וכשהוא יהיה מוכן, אתם שם לתמוך בו.}}',
     'en', 'No workouts in the last week - a chance to gently remind {name} that the road is step by step, and when {gender, select, female {she is} other {he is}} ready, you are there to support.'),
   90),
  (jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
   'history_comeback_after_hard', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {אחרי אימון מאתגר {name} לא ויתרה וחזרה להשלים את האימון. זה רגע של כוח אמיתי שכדאי לחגוג איתה.} other {אחרי אימון מאתגר {name} לא ויתר וחזר להשלים את האימון. זה רגע של כוח אמיתי שכדאי לחגוג איתו.}}',
     'en', 'After a challenging workout, {name} did not give up and came back to finish. A moment of real strength worth celebrating together.'),
   80),
  (jsonb_build_object('he', 'מותר להרגיש הכל', 'en', 'All Feelings Are Allowed'),
   'history_two_hard_in_a_row', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {{name} התמודדה עם שני אימונים קשים ברצף. קחו רגע להקשיב לה באמת - איך היא מרגישה עכשיו? בלי למהר לתקן, פרגנו לה ופשוט היו שם בשבילה.} other {{name} התמודד עם שני אימונים קשים ברצף. קחו רגע להקשיב לו באמת - איך הוא מרגיש עכשיו? בלי למהר לתקן, פרגנו לו ופשוט היו שם בשבילו.}}',
     'en', '{name} went through two hard workouts in a row. Take a moment to really listen - how is {gender, select, female {she} other {he}} feeling now? No rush to fix, just encourage and be there.'),
   70),
  (jsonb_build_object('he', 'מסגרת מעצימה', 'en', 'Empowering Framework'),
   'history_stopped_not_returned', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {{name} עצרה באמצע האימון ועדיין לא חזרה להשלים אותו. זה בסדר - מה לדעתכם יעזור לה להרגיש מוכנה לחזור?} other {{name} עצר באמצע האימון ועדיין לא חזר להשלים אותו. זה בסדר - מה לדעתכם יעזור לו להרגיש מוכן לחזור?}}',
     'en', '{name} stopped in the middle of a workout and has not come back to finish it yet. That is okay - what do you think would help {gender, select, female {her} other {him}} feel ready to return?'),
   60),
  (jsonb_build_object('he', 'מסגרת מעצימה', 'en', 'Empowering Framework'),
   'history_no_workouts_3_days', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {לא היו אימונים ב-3 הימים האחרונים. בדקו אם {name} זקוקה לעזרה - אם ביקשה, זה רגע של חוסן ופתיחות שכדאי לחזק. אם לא, הקשיבו לה והזכירו לה שאתם שם בשבילה.} other {לא היו אימונים ב-3 הימים האחרונים. בדקו אם {name} זקוק לעזרה - אם ביקש, זה רגע של חוסן ופתיחות שכדאי לחזק. אם לא, הקשיבו לו והזכירו לו שאתם שם בשבילו.}}',
     'en', 'No workouts in the last 3 days. Check whether {name} needs help - if {gender, select, female {she} other {he}} asked, that is resilience and openness worth strengthening. If not, listen and remind {gender, select, female {her} other {him}} you are there.'),
   50),
  (jsonb_build_object('he', 'אמונה משחררת', 'en', 'Liberating Belief'),
   'history_new_difficulty', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {{name} התמודדה עם קושי חדש באימון האחרון - זה סימן לאומץ ולרצון לגדול. אמרו לה את זה.} other {{name} התמודד עם קושי חדש באימון האחרון - זה סימן לאומץ ולרצון לגדול. אמרו לו את זה.}}',
     'en', '{name} faced a new difficulty in the last workout - a sign of courage and wanting to grow. Tell {gender, select, female {her} other {him}} that.'),
   40),
  (jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
   'history_improvement', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {{name} שיפרה את הביצועים שלה באימון האחרון - זה סימן להתקדמות משמעותית. פרגנו לה על זה.} other {{name} שיפר את הביצועים שלו באימון האחרון - זה סימן להתקדמות משמעותית. פרגנו לו על זה.}}',
     'en', '{name} did better in the last workout - a sign of real progress. Give {gender, select, female {her} other {him}} credit for it.'),
   30),
  (jsonb_build_object('he', 'דוגמא אישית והכוונה', 'en', 'Personal Example & Praise'),
   'history_trained_together_this_week', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {התאמנתם יחד השבוע - זה רגע מיוחד. שתפו את {name} במה שהכי נהניתם לראות בה במהלך האימון.} other {התאמנתם יחד השבוע - זה רגע מיוחד. שתפו את {name} במה שהכי נהניתם לראות בו במהלך האימון.}}',
     'en', 'You trained together this week - a special moment. Tell {name} what you enjoyed seeing in {gender, select, female {her} other {him}} most during the workout.'),
   20),
  (jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
   'history_mostly_smiles', jsonb_build_object('screen', 'history'),
   jsonb_build_object(
     'he', '{gender, select, female {רוב האימונים של {name} הסתיימו בחיוך - היא מצאה רגעים של הנאה וכיף בדרך. פרגנו לה ושאלו אותה מה הכי מדליק אותה באימונים.} other {רוב האימונים של {name} הסתיימו בחיוך - הוא מצא רגעים של הנאה וכיף בדרך. פרגנו לו ושאלו אותו מה הכי מדליק אותו באימונים.}}',
     'en', 'Most of {name}s workouts ended with a smile. Encourage {gender, select, female {her} other {him}} and ask what {gender, select, female {she} other {he}} enjoys most.'),
   10);
