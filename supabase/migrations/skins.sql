-- Qunity — skins (and the tables the store will use)
--
-- Extracted verbatim from supabase/schema.sql (the section starting at
-- "ADDED FOR SKINS (AND THE STORE TO COME)") so it can be pasted into the
-- Supabase SQL Editor on its own. schema.sql remains the source of truth.
--
-- Run it BEFORE deploying the app version with "הסקין שלי" (until it runs,
-- every child sees the regular look and can't switch). Safe to run more
-- than once.

-- ============================================================================
-- ADDED FOR SKINS (AND THE STORE TO COME)
--
-- store_items: everything a child can have — today only skins (kind 'skin'),
-- later badges, avatar frames and the like. key is what the app knows the
-- item by (a skin's key in src/lib/skins.ts). is_free items belong to every
-- child; the rest will be bought with points (price_points) — the store
-- isn't built yet, so child_items stays empty for now.
-- child_items: what a child owns (written only by a future security definer
-- purchase function — no insert policy).
-- child_equipped: what a child has on, one item per slot (a slot = a kind).
-- Written only through equip_item(), which checks the child may use it.
-- ============================================================================

create table if not exists public.store_items (
  id text primary key,
  kind text not null,
  key text not null,
  title jsonb not null,
  description jsonb,
  price_points integer not null default 0 check (price_points >= 0),
  is_free boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (kind, key)
);

alter table public.store_items enable row level security;

drop policy if exists "store_items_select_all" on public.store_items;
create policy "store_items_select_all" on public.store_items
  for select to authenticated using (true);

create table if not exists public.child_items (
  child_id uuid not null references public.children (id) on delete cascade,
  item_id text not null references public.store_items (id) on delete cascade,
  points_paid integer not null default 0,
  acquired_at timestamptz not null default now(),
  primary key (child_id, item_id)
);

alter table public.child_items enable row level security;

drop policy if exists "child_items_select_own" on public.child_items;
create policy "child_items_select_own" on public.child_items
  for select using (child_id = auth.uid() or public.is_parent_of(child_id));

create table if not exists public.child_equipped (
  child_id uuid not null references public.children (id) on delete cascade,
  slot text not null,
  item_id text not null references public.store_items (id) on delete cascade,
  equipped_at timestamptz not null default now(),
  primary key (child_id, slot)
);

alter table public.child_equipped enable row level security;

drop policy if exists "child_equipped_select_own" on public.child_equipped;
create policy "child_equipped_select_own" on public.child_equipped
  for select using (child_id = auth.uid() or public.is_parent_of(child_id));

-- The signed-in child puts an item on (replacing what was in its slot). The
-- item must be active, and free or owned by the child.
create or replace function public.equip_item(p_item_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_free boolean;
begin
  if not exists (select 1 from public.children where id = auth.uid()) then
    raise exception 'only a child can equip items';
  end if;

  select kind, is_free into v_kind, v_free
  from public.store_items
  where id = p_item_id and active;
  if not found then
    raise exception 'unknown item %', p_item_id;
  end if;

  if not v_free and not exists (
    select 1 from public.child_items where child_id = auth.uid() and item_id = p_item_id
  ) then
    raise exception 'item % is not owned', p_item_id;
  end if;

  insert into public.child_equipped (child_id, slot, item_id)
  values (auth.uid(), v_kind, p_item_id)
  on conflict (child_id, slot) do update
    set item_id = excluded.item_id, equipped_at = now();
end;
$$;

revoke execute on function public.equip_item(text) from public, anon;
grant execute on function public.equip_item(text) to authenticated;

-- The four skins, all free from the start.
insert into public.store_items (id, kind, key, title, description, price_points, is_free, sort_order) values
  ('skin_qunity', 'skin', 'qunity',
   jsonb_build_object('he', 'Qunity', 'en', 'Qunity'),
   jsonb_build_object('he', 'המראה הרגיל של האפליקציה', 'en', 'The app''s regular look'),
   0, true, 1),
  ('skin_jungle', 'skin', 'jungle',
   jsonb_build_object('he', 'ג''ונגל', 'en', 'Jungle'),
   jsonb_build_object('he', 'עלים, פרחים ושביל בין העצים', 'en', 'Leaves, flowers and a trail through the trees'),
   0, true, 2),
  ('skin_space', 'skin', 'space',
   jsonb_build_object('he', 'חלל', 'en', 'Space'),
   jsonb_build_object('he', 'כוכבים, כוכבי לכת ומסלול בין הגלקסיות', 'en', 'Stars, planets and a route between the galaxies'),
   0, true, 3),
  ('skin_adventure', 'skin', 'adventure',
   jsonb_build_object('he', 'הרפתקאות', 'en', 'Adventure'),
   jsonb_build_object('he', 'מפת אוצר, טירות ודרקונים', 'en', 'A treasure map, castles and dragons'),
   0, true, 4)
on conflict (id) do nothing;
