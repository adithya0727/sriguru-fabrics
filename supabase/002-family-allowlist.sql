-- =============================================================================
-- Restrict access to an explicit list of family members.
--
-- Until now, any signed-in account could read every cost price and edit stock.
-- The only thing preventing that was the "allow new users to sign up" toggle in
-- the Supabase dashboard — a single switch, easy to flip by accident, and one
-- that has already caused a lockout once on this project. A dashboard setting
-- is not a good last line of defence for supplier pricing.
--
-- After this runs, registering an account grants nothing. Access requires a row
-- in family_members.
--
-- Run this AFTER schema.sql.
-- =============================================================================

create table if not exists family_members (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  added_at    timestamptz not null default now()
);

alter table family_members enable row level security;

-- Members can see who else is a member, but cannot add or remove anyone.
-- Granting rows is deliberately a dashboard-only action: if a compromised
-- account could add accounts, the allowlist would protect nothing.
drop policy if exists "members can read the list" on family_members;
create policy "members can read the list" on family_members
  for select to authenticated
  using (exists (select 1 from family_members m where m.user_id = auth.uid()));

-- Stable, cheap membership test.
create or replace function is_family() returns boolean as $$
  select exists (select 1 from family_members where user_id = auth.uid());
$$ language sql stable security definer set search_path = public;

-- Replace the "any signed-in user" policies with membership checks.
drop policy if exists "family full access" on sarees;
create policy "family full access" on sarees
  for all to authenticated using (is_family()) with check (is_family());

drop policy if exists "family full access" on customers;
create policy "family full access" on customers
  for all to authenticated using (is_family()) with check (is_family());

drop policy if exists "family full access" on sales;
create policy "family full access" on sales
  for all to authenticated using (is_family()) with check (is_family());

drop policy if exists "family reads categories" on categories;
create policy "family reads categories" on categories
  for all to authenticated using (is_family()) with check (is_family());

-- Photo uploads too — otherwise a stray account could fill the storage quota.
drop policy if exists "family uploads saree photos" on storage.objects;
create policy "family uploads saree photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'saree-photos' and is_family());

drop policy if exists "family updates saree photos" on storage.objects;
create policy "family updates saree photos" on storage.objects
  for update to authenticated using (bucket_id = 'saree-photos' and is_family());

drop policy if exists "family deletes saree photos" on storage.objects;
create policy "family deletes saree photos" on storage.objects
  for delete to authenticated using (bucket_id = 'saree-photos' and is_family());

-- ---------------------------------------------------------------------------
-- Enrol everyone who already has an account. Safe to re-run.
--
-- IMPORTANT: run this in the same session, or you will lock yourself out of
-- your own admin. After this, add new people with:
--
--   insert into family_members (user_id, name)
--   select id, 'Their Name' from auth.users where email = 'them@example.com';
-- ---------------------------------------------------------------------------
insert into family_members (user_id, name)
select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1))
from auth.users
on conflict (user_id) do nothing;
