-- Qunity — the guided "מה קורה עכשיו?" chat
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- ADDED FOR THE GUIDED "מה קורה עכשיו?" CHAT) so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Adds chat labels, keywords and quick picks to the 34 menu tips, and the
-- parent_chat_questions table. Run it BEFORE deploying the app version with
-- the chat. Safe to run more than once.

-- אומר "אתה מכריח אותי"
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '"{parentGender, select, female {את מכריחה} other {אתה מכריח}} אותי"', 'keywords', jsonb_build_array('מכריח', 'מכריחה', 'בכוח'))
where id = '23baf037-0a6c-4e36-aa70-38b867d2af7a';

-- אומר שזה לא חשוב
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {אומרת שזה לא חשוב} other {אומר שזה לא חשוב}}', 'keywords', jsonb_build_array('לא חשוב', 'לא משנה', 'סתם'))
where id = '8a52b7ef-d63f-4c2a-bcad-2c031b1d1feb';

-- לא בא לי
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '"לא בא לי"', 'keywords', jsonb_build_array('לא בא', 'אין לה כוח', 'אין לו כוח', 'לא רוצה', 'משעמם'), 'chatQuick', 1)
where id = 'f06d866f-5705-43e2-bf62-f06d0968902e';

-- לא מפסיק להתווכח
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {לא מפסיקה להתווכח} other {לא מפסיק להתווכח}}', 'keywords', jsonb_build_array('כל הזמן מתווכח', 'לא מפסיקה להתווכח', 'לא מפסיק להתווכח'))
where id = 'a2a5a701-91e2-4e70-bf63-56d7f0ae0b8a';

-- מבקש עוד ועוד דחיות
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מבקשת עוד ועוד דחיות} other {מבקש עוד ועוד דחיות}}', 'keywords', jsonb_build_array('דוח', 'דחי', 'מחר'))
where id = '3a2ee268-8af7-4e07-80a8-6fd87c788b64';

-- מתחיל להתווכח
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מתחילה להתווכח} other {מתחיל להתווכח}}', 'keywords', jsonb_build_array('מתווכח', 'ויכוח', 'וויכוח'))
where id = 'f6914f5a-3a6c-4a63-8e7a-f761828d0242';

-- עוד מעט
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '"עוד מעט"', 'keywords', jsonb_build_array('עוד מעט', 'אחר כך', 'אחרי זה', 'מאוחר יותר'), 'chatQuick', 2)
where id = '013cfdab-3def-4112-a8c2-1dd9cad1a9b0';

-- רוצה לדלג
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', 'רוצה לדלג', 'keywords', jsonb_build_array('לדלג', 'לוותר', 'לקצר'), 'chatQuick', 6)
where id = '450216c4-c447-45a2-b710-b73f43272e52';

-- רוצה לפרוש באמצע
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', 'רוצה לפרוש באמצע', 'keywords', jsonb_build_array('באמצע', 'לפרוש', 'להפסיק', 'עצרה', 'עצר'))
where id = 'f2b0fa50-46ec-4f2f-8f7c-db14eee536d3';

-- שכחתי
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '"שכחתי"', 'keywords', jsonb_build_array('שכח'))
where id = '0747ca16-8d83-4754-95d3-a7d72e267aff';

-- אומר "אני גרוע"
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {"אני גרועה"} other {"אני גרוע"}}', 'keywords', jsonb_build_array('גרוע', 'גרועה', 'אפס'))
where id = '09126f5e-e0d6-4dda-8065-d91953c25e96';

-- אני לא טוב בזה
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {"אני לא טובה בזה"} other {"אני לא טוב בזה"}}', 'keywords', jsonb_build_array('לא טוב', 'לא טובה', 'לא מוצלח'))
where id = '7556600d-48a7-4845-b766-7126cba980cc';

-- אני לא יכול
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {"אני לא יכולה"} other {"אני לא יכול"}}', 'keywords', jsonb_build_array('לא יכול', 'לא מסוגל', 'קשה לי', 'קשה לה', 'קשה לו'), 'chatQuick', 3)
where id = 'dbf29f22-f160-4a7e-9bd4-7881ff692817';

-- הצליח ואז אומר שזה במקרה
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {הצליחה ואומרת שזה במקרה} other {הצליח ואומר שזה במקרה}}', 'keywords', jsonb_build_array('במקרה', 'מזל'))
where id = '713c5a20-97e3-4b51-ba7f-b2bf52b77c84';

-- מבקש עזרה מיד
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מבקשת עזרה מיד} other {מבקש עזרה מיד}}', 'keywords', jsonb_build_array('עזרה', 'תעזור', 'תעזרי'))
where id = '2c86a7db-d7ee-445a-8097-ca83420af3cd';

-- מפחד להיכשל
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מפחדת להיכשל} other {מפחד להיכשל}}', 'keywords', jsonb_build_array('להיכשל', 'כישלון', 'נכשל'), 'chatQuick', 7)
where id = '69e0f58a-ecd1-4d01-9c07-082b55daaf3b';

-- משווה לחבר
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {משווה את עצמה לחברה} other {משווה את עצמו לחבר}}', 'keywords', jsonb_build_array('חבר', 'משווה', 'אחרים'))
where id = '3d60ca67-cf21-4dda-bf5b-f716392994ac';

-- בוכה
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', 'בוכה', 'keywords', jsonb_build_array('בוכ', 'בכי', 'דמעות'), 'chatQuick', 4)
where id = '28ee19c5-078e-4375-a78a-14da6efa3c5d';

-- כועס
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {כועסת} other {כועס}}', 'keywords', jsonb_build_array('כועס', 'עצבני', 'עצבנית', 'עצבים', 'כעס'), 'chatQuick', 5)
where id = 'a7fe945b-592f-4b30-a277-e21e09824aac';

-- מאוכזב
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מאוכזבת} other {מאוכזב}}', 'keywords', jsonb_build_array('מאוכזב', 'אכזבה'))
where id = 'bee0e50d-ccd5-4d5d-86fd-2709416b6837';

-- מפחד
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מפחדת} other {מפחד}}', 'keywords', jsonb_build_array('מפחד', 'פוחד', 'פוחדת', 'חושש', 'חוששת'))
where id = '74679102-a2e8-4a6f-9102-4e9f1d7d4f86';

-- מתבייש
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מתביישת} other {מתבייש}}', 'keywords', jsonb_build_array('מתבייש', 'בושה', 'מביך'))
where id = 'f48cbcfd-5c45-4c95-934b-f2e681753bae';

-- נבוך
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {נבוכה} other {נבוך}}', 'keywords', jsonb_build_array('נבוך', 'נבוכה', 'מבוכה'))
where id = 'a78557fe-112f-4168-be9d-434ad3566261';

-- נסגר
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {נסגרת} other {נסגר}}', 'keywords', jsonb_build_array('נסגר', 'לא מדבר', 'שותק', 'שותקת'))
where id = '08cebad7-1a96-4744-8889-d0c1a8c8c84f';

-- עצוב
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {עצובה} other {עצוב}}', 'keywords', jsonb_build_array('עצוב', 'עצב'))
where id = 'ec06b35f-b35a-414d-a383-625d10127e5d';

-- צועק
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {צועקת} other {צועק}}', 'keywords', jsonb_build_array('צועק', 'צעק', 'צרח'))
where id = 'cf871859-f4b4-4092-bbb0-092fd189a747';

-- עשה למרות שלא בא לו
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {עשתה למרות שלא בא לה} other {עשה למרות שלא בא לו}}', 'keywords', jsonb_build_array('למרות'))
where id = '7e6e4943-024e-4ddc-ad63-2b1c55422af2';

-- רוצה רק לנצח
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', 'רוצה רק לנצח', 'keywords', jsonb_build_array('לנצח', 'ניצחון', 'להפסיד', 'הפסיד'))
where id = '3ab075d8-b569-4e08-a28d-d1fcfa4bdd6c';

-- ההורה ויתר על משהו וחזר
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', 'ויתרתי על משהו וחזרתי', 'keywords', jsonb_build_array('ויתרתי', 'חזרתי'))
where id = 'c96843d1-637f-4e3a-93d8-4cda7f97b0e3';

-- הילד מבקש מחמאה
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מבקשת מחמאה} other {מבקש מחמאה}}', 'keywords', jsonb_build_array('מחמאה', 'מחמאות'))
where id = 'bf56ee97-a8ab-45a7-af46-711d17517302';

-- הילד מזלזל בעצמו
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {מזלזלת בעצמה} other {מזלזל בעצמו}}', 'keywords', jsonb_build_array('מזלזל', 'מקטין', 'מקטינה'))
where id = 'db695367-b568-4c87-9a03-7e315ef59483';

-- הילד עזר למישהו אחר
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {עזרה למישהו אחר} other {עזר למישהו אחר}}', 'keywords', jsonb_build_array('עזר למ', 'עזרה ל'))
where id = 'cd8c38a1-e541-4e9f-a6a3-100b6ec6e8b7';

-- הילד פרגן לעצמו
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {פרגנה לעצמה} other {פרגן לעצמו}}', 'keywords', jsonb_build_array('פרגן', 'פרגנה', 'גאה בעצמ'))
where id = '9556c4b9-ecb3-4d7f-a0d3-0adee6e14910';

-- הילד שואל אם גם אתה מתאמן
update public.parent_tip_rules
set condition_params = condition_params || jsonb_build_object('chatLabel', '{gender, select, female {שואלת אם גם {parentGender, select, female {את מתאמנת} other {אתה מתאמן}}} other {שואל אם גם {parentGender, select, female {את מתאמנת} other {אתה מתאמן}}}}', 'keywords', jsonb_build_array('גם את', 'גם אתה', 'גם אני'))
where id = '2b787ac1-1f5e-4596-81c7-22bf0ab54679';

create table if not exists public.parent_chat_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 500),
  matched_rule_id uuid references public.parent_tip_rules (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.parent_chat_questions enable row level security;

drop policy if exists "parent_chat_questions_insert" on public.parent_chat_questions;
create policy "parent_chat_questions_insert" on public.parent_chat_questions
  for insert to authenticated with check (true);

-- Should show 34 and 7.
select count(*) filter (where condition_params ? 'chatLabel') as chat_labels,
       count(*) filter (where condition_params ? 'chatQuick') as quick_picks
from public.parent_tip_rules;
