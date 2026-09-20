-- =============================================================================
-- Sales Book — a sale records what was actually charged, not the asking price.
--
-- Run this AFTER 005-link-sarees-to-bills.sql. Safe to re-run.
--
-- The important change is not the new columns, it is `sale_margins`. Profit was
-- computed from unit_price, which is the price before any discount. The moment
-- a discount is given, every profit figure on the Sales screen overstates by
-- exactly the amount discounted — silently, and on every sale. The view moves
-- to the final price below.
-- =============================================================================

-- Wrapped in a transaction on purpose: this migration drops a function and
-- three views before rebuilding them. If a statement failed halfway through
-- without this, the app would be left with the old code calling functions and
-- views that no longer exist.
begin;

alter table sales
  add column if not exists discount_percent  numeric(5,2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  -- What the customer actually paid per piece, after the discount.
  add column if not exists final_unit_price  numeric(10,2),
  -- The receipt SHE writes for the customer. Optional, and often filled later.
  add column if not exists receipt_number    text,
  -- Kept on the sale itself so a name can be recorded without a phone number,
  -- which is the common case at the counter.
  add column if not exists customer_name     text;

-- Sales taken before discounts existed were charged at the asking price.
update sales set final_unit_price = unit_price where final_unit_price is null;

create index if not exists sales_receipt_idx on sales (receipt_number);

-- -----------------------------------------------------------------------------
-- record_sale: one piece, one row, stock decremented atomically.
--
-- The old six-argument version is dropped rather than overloaded — leaving both
-- would make every call ambiguous to resolve and a caller could silently reach
-- the one without discounts.
-- -----------------------------------------------------------------------------
drop function if exists record_sale(text, numeric, int, uuid, text, text);

create or replace function record_sale(
  p_saree_id         text,
  p_unit_price       numeric,
  p_final_unit_price numeric,
  p_discount_percent numeric default 0,
  p_customer_name    text default null,
  p_receipt_number   text default null,
  p_notes            text default null
) returns sales as $$
declare
  v_cost numeric;
  v_sale sales;
begin
  -- This function is security definer, so it must check membership itself.
  -- Without this it would be a way to change stock while bypassing every
  -- policy on the table.
  if not is_family() then
    raise exception 'Not permitted';
  end if;

  select cost_price into v_cost from sarees where id = p_saree_id for update;
  if not found then
    raise exception 'Saree % not found', p_saree_id;
  end if;

  update sarees
     set quantity_available = quantity_available - 1,
         updated_at = now()
   where id = p_saree_id;   -- the check constraint rejects overselling

  insert into sales (
    saree_id, quantity, unit_price, final_unit_price, discount_percent,
    unit_cost, customer_name, receipt_number, notes
  )
  values (
    p_saree_id, 1, p_unit_price, coalesce(p_final_unit_price, p_unit_price),
    coalesce(p_discount_percent, 0), v_cost, p_customer_name, p_receipt_number,
    p_notes
  )
  returning * into v_sale;

  return v_sale;
end;
$$ language plpgsql security definer set search_path = public;

-- A security definer function is executable by PUBLIC unless told otherwise,
-- which would let the anon key decrement stock and write sales rows.
revoke all on function record_sale(text, numeric, numeric, numeric, text, text, text)
  from public;
grant execute on function record_sale(text, numeric, numeric, numeric, text, text, text)
  to authenticated;

-- -----------------------------------------------------------------------------
-- Reporting views.
--
-- security_invoker makes a view run as whoever queries it, so the row-level
-- security on sales and sarees applies through it. Without it a view runs as
-- its owner and quietly bypasses RLS — dead_stock selects sr.*, so that meant
-- cost_price and supplier were reachable by any role holding a grant on it.
-- -----------------------------------------------------------------------------
-- Dropped rather than replaced. CREATE OR REPLACE VIEW may only append columns
-- to the end of a view's output, and `s.*` now expands to four more columns
-- than it did — sitting before `margin` — so replacing in place fails with a
-- column-mismatch error. category_performance is dropped first because it
-- reads sale_margins, and is rebuilt below.
drop view if exists category_performance;
drop view if exists sale_margins;
drop view if exists dead_stock;

create view sale_margins with (security_invoker = on) as
select
  s.*,
  (coalesce(s.final_unit_price, s.unit_price) - coalesce(s.unit_cost, 0))
    * s.quantity                        as margin,
  sr.name     as saree_name,
  sr.category as category,
  sr.supplier as supplier
from sales s
join sarees sr on sr.id = s.saree_id;

-- sarees gained bill_id and bill_item_name in 005, so `sr.*` shifted here too.
create view dead_stock with (security_invoker = on) as
select
  sr.*,
  (current_date - coalesce(sr.purchased_on, sr.created_at::date)) as days_held
from sarees sr
where sr.quantity_available > 0
  and (current_date - coalesce(sr.purchased_on, sr.created_at::date)) >= 90
  and not exists (select 1 from sales s where s.saree_id = sr.id);

create view category_performance with (security_invoker = on) as
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

commit;
