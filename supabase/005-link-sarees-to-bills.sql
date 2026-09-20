-- =============================================================================
-- Link a saree back to the bill line it was bought on.
--
-- Run this AFTER 004-store-receipts.sql.
--
-- PRIVACY: both columns are family-only and must stay out of PUBLIC_COLUMNS in
-- src/lib/queries.ts. bill_item_name is the supplier's own wording and
-- bill_id leads to what was paid, so either on a public page would undo the
-- whole point of that column list.
--
-- Note what is NOT added here: the shop name does not go in `sarees.tags`.
-- Tags are customer-visible, so that would publish the supplier list on every
-- saree page. The existing `supplier` column is the family-only place for it.
-- =============================================================================

alter table sarees
  add column if not exists bill_id         text references bills(id) on delete set null,
  add column if not exists bill_item_name  text;

comment on column sarees.bill_item_name is
  'The supplier''s exact wording for this saree on their bill. Kept so a saree '
  'can be found by searching the words printed on the paper, while its own '
  'name stays in the shop''s style for customers.';

create index if not exists sarees_bill_idx on sarees (bill_id);

-- Searching the bill wording is the point of storing it, and it is searched
-- with a leading wildcard ("%red pallu%"), which a plain b-tree cannot serve.
create extension if not exists pg_trgm;
create index if not exists sarees_bill_item_name_trgm_idx
  on sarees using gin (bill_item_name gin_trgm_ops);
