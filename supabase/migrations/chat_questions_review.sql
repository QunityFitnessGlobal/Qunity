-- Qunity — the chat questions after the review
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- ADDED AFTER THE CHAT REVIEW) so it can be pasted into the Supabase SQL
-- Editor on its own. schema.sql remains the source of truth.
--
-- Only parents can add chat questions, and rows can mark a rejected match.
-- Run it BEFORE deploying the app version that sends rejected. Safe to run
-- more than once.

alter table public.parent_chat_questions
  add column if not exists rejected boolean not null default false;

drop policy if exists "parent_chat_questions_insert" on public.parent_chat_questions;
create policy "parent_chat_questions_insert" on public.parent_chat_questions
  for insert to authenticated
  with check (exists (select 1 from public.parents where id = auth.uid()));

-- Should show: rejected | boolean
select column_name, data_type from information_schema.columns
where table_name = 'parent_chat_questions' and column_name = 'rejected';
