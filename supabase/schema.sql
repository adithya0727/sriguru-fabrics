-- =============================================================================
-- Sri Guru Raghavendra Fabrics — inventory schema
--
-- Privacy rule that governs this whole file: cost_price and supplier are
-- family-only. No anonymous role can read ANY table here. Public saree pages
-- are rendered by the Next.js server, which selects an explicit safe column
-- list (see src/lib/queries.ts). That keeps the leak surface in one auditable
-- place instead of spread across RLS policies and views.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Short, unambiguous ids for shareable links: srgf.in/s/k3n9qr
-- Alphabet omits i, l, o, 0, 1 so a number read aloud over the phone works.
create or replace function gen_short_id() returns text as $$
  select string_agg(
    substr('abcdefghjkmnpqrstuvwxyz23456789',
           floor(random() * 31)::int + 1, 1), '')
  from generate_series(1, 6);
$$ language sql volatile;

-- -----------------------------------------------------------------------------
-- Categories — a lookup table so the admin dropdown stays consistent.
-- Free-text would fragment into "Gadwal" / "gadwal" / "Gadwal " within a week.
-- -----------------------------------------------------------------------------
create table if not exists categories (
  name        text primary key,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

-- Fancy is deliberately last: it is the "none of the above" bucket, and the
-- photo tagger is told to reach for it only when nothing else fits. Leave
-- gaps in sort_order so a new type can be slotted in without renumbering.
insert into categories (name, sort_order) values
  ('Gadwal', 10), ('Ilkal', 20), ('Paithani', 25), ('Soft Silk', 30),
  ('Cotton', 34), ('Chiffon', 36), ('Fancy', 40)
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- Sarees
--
-- quantity_total / quantity_available handle the "mix of both" stock model:
-- a one-off piece is simply quantity_total = 1. Nothing special-cases it.
-- -----------------------------------------------------------------------------
create table if not exists sarees (
  id                  text primary key default gen_short_id(),

  -- What the customer sees
  name                text not null,
  description         text not null default '',
  category            text not null references categories(name) on update cascade,
  photos              text[] not null default '{}',

  -- Attributes, mostly filled by the photo tagger
  fabric              text,
  colors              text[] not null default '{}',
  border              text,
  motifs              text[] not null default '{}',
  tags                text[] not null default '{}',
  has_blouse          boolean not null default false,
  occasion            text,

  -- Money. cost_price is family-only and must never reach a public response.
  cost_price          numeric(10,2),
  price               numeric(10,2) not null default 0,

  -- Stock
  quantity_total      int not null default 1 check (quantity_total >= 0),
  quantity_available  int not null default 1 check (quantity_available >= 0),

  -- Provenance, family-only
  supplier            text,
  purchased_on        date,

  -- Fields the tagger was unsure about, so the admin can highlight them
  low_confidence      text[] not null default '{}',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint available_not_over_total
    check (quantity_available <= quantity_total)
);

create index if not exists sarees_category_idx on sarees (category);
create index if not exists sarees_available_idx
  on sarees (quantity_available) where quantity_available > 0;
create index if not exists sarees_created_idx on sarees (created_at desc);

-- -----------------------------------------------------------------------------
-- Customers — the asset that makes WhatsApp sends targeted instead of spam.
-- -----------------------------------------------------------------------------
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text unique,
  area        text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists customers_phone_idx on customers (phone);

-- -----------------------------------------------------------------------------
-- Sales — one row per piece sold. Margin is derived, never stored, so it can
-- never drift out of sync with the cost price.
-- -----------------------------------------------------------------------------
create table if not exists sales (
  id           uuid primary key default gen_random_uuid(),
  saree_id     text not null references sarees(id) on delete restrict,
  customer_id  uuid references customers(id) on delete set null,  -- null = walk-in
  quantity     int not null default 1 check (quantity > 0),
  unit_price   numeric(10,2) not null,
  unit_cost    numeric(10,2),   -- snapshot at time of sale
  channel      text not null default 'home'
                 check (channel in ('home','stall','whatsapp','reseller','other')),
  notes        text,
  sold_at      timestamptz not null default now()
);

create index if not exists sales_saree_idx on sales (saree_id);
create index if not exists sales_customer_idx on sales (customer_id);
create index if not exists sales_date_idx on sales (sold_at desc);

-- -----------------------------------------------------------------------------
-- record_sale: the one-tap flow. Decrements stock and logs the sale atomically
-- so a half-applied sale can't leave the catalog lying about availability.
-- -----------------------------------------------------------------------------
create or replace function record_sale(
  p_saree_id    text,
  p_unit_price  numeric,
  p_quantity    int default 1,
  p_customer_id uuid default null,
  p_channel     text default 'home',
  p_notes       text default null
) returns sales as $$
declare
  v_cost numeric;
  v_sale sales;
begin
  select cost_price into v_cost from sarees where id = p_saree_id for update;
  if not found then
    raise exception 'Saree % not found', p_saree_id;
  end if;

  update sarees
     set quantity_available = quantity_available - p_quantity,
         updated_at = now()
   where id = p_saree_id;   -- the check constraint rejects overselling

  insert into sales (saree_id, customer_id, quantity, unit_price, unit_cost, channel, notes)
  values (p_saree_id, p_customer_id, p_quantity, p_unit_price, v_cost, p_channel, p_notes)
  returning * into v_sale;

  return v_sale;
end;
$$ language plpgsql security definer set search_path = public;

-- -----------------------------------------------------------------------------
-- Reporting views (family-only, behind RLS)
-- -----------------------------------------------------------------------------

-- Per-sale margin.
create or replace view sale_margins as
select
  s.*,
  (s.unit_price - coalesce(s.unit_cost, 0)) * s.quantity as margin,
  sr.name     as saree_name,
  sr.category as category
from sales s
join sarees sr on sr.id = s.saree_id;

-- Dead stock: still on the rack, bought a while ago, never sold a single piece.
create or replace view dead_stock as
select
  sr.*,
  (current_date - coalesce(sr.purchased_on, sr.created_at::date)) as days_held
from sarees sr
where sr.quantity_available > 0
  and (current_date - coalesce(sr.purchased_on, sr.created_at::date)) >= 90
  and not exists (select 1 from sales s where s.saree_id = sr.id);

-- Which categories actually earn, and how fast they turn.
create or replace view category_performance as
select
  c.name                                          as category,
  count(distinct sr.id)                           as designs_stocked,
  coalesce(sum(sm.quantity), 0)                   as pieces_sold,
  coalesce(sum(sm.margin), 0)                     as total_margin,
  round(avg(sm.margin), 2)                        as avg_margin_per_piece,
  round(avg(extract(day from sm.sold_at - sr.created_at)), 1) as avg_days_to_sell
from categories c
left join sarees sr on sr.category = c.name
left join sale_margins sm on sm.saree_id = sr.id
group by c.name;

-- -----------------------------------------------------------------------------
-- Row-level security
--
-- Deny-by-default for everyone; signed-in family members get full access.
-- The anon key can read nothing at all — public pages go through the server.
-- -----------------------------------------------------------------------------
alter table sarees    enable row level security;
alter table customers enable row level security;
alter table sales     enable row level security;
alter table categories enable row level security;

drop policy if exists "family full access" on sarees;
create policy "family full access" on sarees
  for all to authenticated using (true) with check (true);

drop policy if exists "family full access" on customers;
create policy "family full access" on customers
  for all to authenticated using (true) with check (true);

drop policy if exists "family full access" on sales;
create policy "family full access" on sales
  for all to authenticated using (true) with check (true);

drop policy if exists "family reads categories" on categories;
create policy "family reads categories" on categories
  for all to authenticated using (true) with check (true);

-- Keep updated_at honest.
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sarees_touch on sarees;
create trigger sarees_touch before update on sarees
  for each row execute function touch_updated_at();
