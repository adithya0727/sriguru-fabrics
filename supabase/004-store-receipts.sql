-- =============================================================================
-- Store Receipts — supplier bills photographed, read by Claude, checked by hand.
--
-- Run this AFTER 002-family-allowlist.sql. Safe to re-run.
--
-- PRIVACY: a bill photo shows supplier names and what was paid — the exact
-- information PUBLIC_COLUMNS in src/lib/queries.ts exists to keep off public
-- surfaces. So these photos do NOT go in the `saree-photos` bucket, which is
-- public-read because WhatsApp's crawler has to fetch saree images without
-- logging in. They get their own private bucket, read through signed URLs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Companies bills come from.
--
-- normalised_name collapses case and punctuation so "SRI LAKSHMI TEXTILES" and
-- "Sri Lakshmi Textiles" are one company rather than two. It cannot catch
-- everything ("… , B'lore" still differs), which is why the add screen also
-- offers the existing companies to attach to.
-- -----------------------------------------------------------------------------
create table if not exists bill_companies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  normalised_name  text generated always as (
                     upper(regexp_replace(name, '[^a-zA-Z0-9]+', '', 'g'))
                   ) stored,
  created_at       timestamptz not null default now()
);

create unique index if not exists bill_companies_normalised_idx
  on bill_companies (normalised_name);

-- -----------------------------------------------------------------------------
-- Bills. One row is one photographed bill, and one table on screen.
--
-- items/columns/totals are jsonb because no two suppliers' bills carry the same
-- columns. A bill is read, corrected and saved as a whole, so storing it as one
-- document matches how it is actually edited — and lets a bill with an HSN
-- column sit beside one without, neither inventing empty cells for the other.
-- -----------------------------------------------------------------------------
create table if not exists bills (
  id            text primary key default gen_short_id(),
  company_id    uuid not null references bill_companies(id) on delete restrict,

  bill_number   text,
  bill_date     date,

  -- Path inside the private bucket, not a URL. URLs are signed on demand.
  photo_path    text,

  -- The columns this bill shows, in display order. Standard keys (description,
  -- quantity, rate …) sit alongside whatever headings this supplier uses of
  -- its own (HSN, Discount), because no two bills carry the same set.
  columns       jsonb not null default '[]'::jsonb,

  -- [{ sl_no, description, quantity, unit, rate, amount, extra: [{label,value}] }]
  items         jsonb not null default '[]'::jsonb,

  -- [{ label: "Grand Total", value: "12,450.00" }] — only what the bill shows.
  totals        jsonb not null default '[]'::jsonb,

  notes            text,
  low_confidence   jsonb not null default '[]'::jsonb,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists bills_company_idx on bills (company_id);
create index if not exists bills_date_idx on bills (bill_date desc nulls last);
create index if not exists bills_created_idx on bills (created_at desc);

drop trigger if exists bills_touch on bills;
create trigger bills_touch before update on bills
  for each row execute function touch_updated_at();

-- -----------------------------------------------------------------------------
-- Row-level security — family allowlist only, same as everything else.
-- No anonymous role can read either table. There is no public surface for bills
-- and there must never be one.
-- -----------------------------------------------------------------------------
alter table bill_companies enable row level security;
alter table bills          enable row level security;

drop policy if exists "family full access" on bill_companies;
create policy "family full access" on bill_companies
  for all to authenticated using (is_family()) with check (is_family());

drop policy if exists "family full access" on bills;
create policy "family full access" on bills
  for all to authenticated using (is_family()) with check (is_family());

-- -----------------------------------------------------------------------------
-- Private photo bucket. Note `public = false`: unlike saree-photos, nothing
-- here may be fetched without a session.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bill-photos', 'bill-photos', false, 10485760,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "family reads bill photos" on storage.objects;
create policy "family reads bill photos" on storage.objects
  for select to authenticated using (bucket_id = 'bill-photos' and is_family());

drop policy if exists "family uploads bill photos" on storage.objects;
create policy "family uploads bill photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'bill-photos' and is_family());

drop policy if exists "family deletes bill photos" on storage.objects;
create policy "family deletes bill photos" on storage.objects
  for delete to authenticated using (bucket_id = 'bill-photos' and is_family());
