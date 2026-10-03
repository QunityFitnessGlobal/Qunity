-- Qunity — TEMPORARY: lets scripts/copy-users.mjs read the sign-in accounts
-- (with their encrypted passwords) from the OLD project, so users keep the
-- same email and password in the new one.
--
-- Run this in the OLD project's SQL Editor before the copy. Only the
-- service-role / secret key can call it (anon and signed-in users cannot).
-- Delete it right after the copy with the line at the bottom.

create or replace function public.export_auth_users()
returns table (
  id uuid,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb
)
language sql
security definer
set search_path = auth, public
as $$
  select id, email::text, encrypted_password::text, email_confirmed_at, raw_user_meta_data
  from auth.users
  where email is not null;
$$;

revoke all on function public.export_auth_users() from public, anon, authenticated;
grant execute on function public.export_auth_users() to service_role;

-- After the copy, remove it:
-- drop function public.export_auth_users();
