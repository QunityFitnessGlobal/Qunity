-- Qunity — texts for the "רגע לחגוג" card on the parent home screen
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- ADDED FOR THE PARENT HOME SCREEN'S "רגע לחגוג" CARD) so it can be pasted
-- into the Supabase SQL Editor on its own. schema.sql remains the source of
-- truth.
--
-- Adds six rows to parent_tip_rules. Run it BEFORE deploying the app version
-- with the card. Safe to run more than once (a row already there is skipped).

insert into public.parent_tip_rules (condition_type, condition_params, principle, short_text, tip_text, priority)
select 'celebrate_stage_up',
       jsonb_build_object('screen', 'celebrate'),
       jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
       jsonb_build_object('he', '{gender, select, female {{name} עלתה לשלב ה{stage}!} other {{name} עלה לשלב ה{stage}!}}', 'en', '{name} moved up to the {stage} stage!'),
       jsonb_build_object('he', '{gender, select, female {שאלו אותה מה היה הכי קשה בדרך, ומה עזר לה להמשיך.} other {שאלו אותו מה היה הכי קשה בדרך, ומה עזר לו להמשיך.}}', 'en', '{gender, select, female {Ask her what was hardest along the way, and what helped her keep going.} other {Ask him what was hardest along the way, and what helped him keep going.}}'),
       60
where not exists (select 1 from public.parent_tip_rules where condition_type = 'celebrate_stage_up');

insert into public.parent_tip_rules (condition_type, condition_params, principle, short_text, tip_text, priority)
select 'celebrate_power',
       jsonb_build_object('screen', 'celebrate'),
       jsonb_build_object('he', 'אמונה משחררת', 'en', 'Liberating Belief'),
       jsonb_build_object('he', '{gender, select, female {{name} גילתה את {power}!} other {{name} גילה את {power}!}}', 'en', '{name} discovered {power}!'),
       jsonb_build_object('he', '{gender, select, female {המשפט של הכוח הוא "{quote}". שאלו אותה מתי הרגישה ככה השבוע.} other {המשפט של הכוח הוא "{quote}". שאלו אותו מתי הרגיש ככה השבוע.}}', 'en', '{gender, select, female {The power''s sentence is "{quote}". Ask her when she felt that way this week.} other {The power''s sentence is "{quote}". Ask him when he felt that way this week.}}'),
       50
where not exists (select 1 from public.parent_tip_rules where condition_type = 'celebrate_power');

insert into public.parent_tip_rules (condition_type, condition_params, principle, short_text, tip_text, priority)
select 'celebrate_first_workout',
       jsonb_build_object('screen', 'celebrate'),
       jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
       jsonb_build_object('he', 'האימון הראשון של {name}!', 'en', '{name}''s first workout!'),
       jsonb_build_object('he', '{gender, select, female {שאלו אותה מה הכי אהבה באימון, וספרו לה כמה אתם גאים בצעד הראשון.} other {שאלו אותו מה הכי אהב באימון, וספרו לו כמה אתם גאים בצעד הראשון.}}', 'en', '{gender, select, female {Ask her what she liked most, and tell her how proud you are of the first step.} other {Ask him what he liked most, and tell him how proud you are of the first step.}}'),
       40
where not exists (select 1 from public.parent_tip_rules where condition_type = 'celebrate_first_workout');

insert into public.parent_tip_rules (condition_type, condition_params, principle, short_text, tip_text, priority)
select 'celebrate_first_together',
       jsonb_build_object('screen', 'celebrate'),
       jsonb_build_object('he', 'דוגמא אישית והכוונה', 'en', 'Personal Example And Guidance'),
       jsonb_build_object('he', 'האימון המשותף הראשון שלכם!', 'en', 'Your first workout together!'),
       jsonb_build_object('he', '{gender, select, female {ספרו ל{name} מה הכי נהניתם לראות בה, וקבעו יחד את האימון המשותף הבא.} other {ספרו ל{name} מה הכי נהניתם לראות בו, וקבעו יחד את האימון המשותף הבא.}}', 'en', '{gender, select, female {Tell {name} what you enjoyed seeing in her most, and plan your next workout together.} other {Tell {name} what you enjoyed seeing in him most, and plan your next workout together.}}'),
       30
where not exists (select 1 from public.parent_tip_rules where condition_type = 'celebrate_first_together');

insert into public.parent_tip_rules (condition_type, condition_params, principle, short_text, tip_text, priority)
select 'celebrate_challenge',
       jsonb_build_object('screen', 'celebrate'),
       jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
       jsonb_build_object('he', '{gender, select, female {{name} השלימה אתגר: {challenge}!} other {{name} השלים אתגר: {challenge}!}}', 'en', '{name} completed a challenge: {challenge}!'),
       jsonb_build_object('he', '{gender, select, female {שאלו אותה מה עבר לה בראש באמצע, ואיך הצליחה להמשיך.} other {שאלו אותו מה עבר לו בראש באמצע, ואיך הצליח להמשיך.}}', 'en', '{gender, select, female {Ask her what went through her mind halfway, and how she kept going.} other {Ask him what went through his mind halfway, and how he kept going.}}'),
       20
where not exists (select 1 from public.parent_tip_rules where condition_type = 'celebrate_challenge');

insert into public.parent_tip_rules (condition_type, condition_params, principle, short_text, tip_text, priority)
select 'celebrate_streak',
       jsonb_build_object('screen', 'celebrate'),
       jsonb_build_object('he', 'פוקוס על הדרך', 'en', 'Focus On The Journey'),
       jsonb_build_object('he', '{gender, select, female {{name} מתאמנת {days} ימים ברצף!} other {{name} מתאמן {days} ימים ברצף!}}', 'en', '{name} has trained {days} days in a row!'),
       jsonb_build_object('he', '{gender, select, female {שאלו אותה מה עוזר לה להתמיד, וחגגו את ההתמדה עצמה, לא רק את התוצאה.} other {שאלו אותו מה עוזר לו להתמיד, וחגגו את ההתמדה עצמה, לא רק את התוצאה.}}', 'en', '{gender, select, female {Ask her what helps her keep at it, and celebrate the persistence itself, not just the result.} other {Ask him what helps him keep at it, and celebrate the persistence itself, not just the result.}}'),
       10
where not exists (select 1 from public.parent_tip_rules where condition_type = 'celebrate_streak');

-- Should show 6.
select count(*) as celebrate_texts from public.parent_tip_rules where condition_params->>'screen' = 'celebrate';
