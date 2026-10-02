-- Qunity — gendered stair-challenge descriptions
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR GENDERED CHALLENGE DESCRIPTIONS") so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Safe to run before or after deploying: the app shows the old masculine
-- text until this runs. Running it twice just writes the same text again.

update public.challenges
set description = jsonb_set(description, '{he}', to_jsonb('{gender, select, female {עלי 100 מדרגות ברצף, בקצב שנוח לך.} other {עלה 100 מדרגות ברצף, בקצב שנוח לך.}}'::text))
where id = 'stairs_white';

update public.challenges
set description = jsonb_set(description, '{he}', to_jsonb('{gender, select, female {עלי 200 מדרגות ברצף, בקצב שנוח לך.} other {עלה 200 מדרגות ברצף, בקצב שנוח לך.}}'::text))
where id = 'stairs_orange';

update public.challenges
set description = jsonb_set(description, '{he}', to_jsonb('{gender, select, female {עלי 300 מדרגות ברצף, בקצב שנוח לך.} other {עלה 300 מדרגות ברצף, בקצב שנוח לך.}}'::text))
where id = 'stairs_green';

update public.challenges
set description = jsonb_set(description, '{he}', to_jsonb('{gender, select, female {עלי 400 מדרגות ברצף, בקצב שנוח לך.} other {עלה 400 מדרגות ברצף, בקצב שנוח לך.}}'::text))
where id = 'stairs_blue';

update public.challenges
set description = jsonb_set(description, '{he}', to_jsonb('{gender, select, female {עלי 500 מדרגות ברצף, בקצב שנוח לך.} other {עלה 500 מדרגות ברצף, בקצב שנוח לך.}}'::text))
where id = 'stairs_purple';

