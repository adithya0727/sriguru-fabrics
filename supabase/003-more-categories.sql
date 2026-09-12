-- =============================================================================
-- Three more saree types: Paithani, Chiffon, Cotton.
--
-- Run this AFTER schema.sql. Safe to re-run, and safe on a live database —
-- it only adds rows to the lookup table. No existing saree changes category.
--
-- The sort_order values slot into the gaps the original four left rather than
-- appending on the end, because Fancy has to stay last: it is the "none of
-- the above" bucket, both in the admin dropdown and in the instructions the
-- photo tagger is given. A catch-all sitting in the middle of the list reads
-- as a real type and gets picked like one.
--
-- Keep this in step with CATEGORIES in src/lib/vocabulary.ts, which is what
-- constrains the tagger's choices. A type present in only one of the two is
-- either unpickable by the tagger or unsaveable by the form.
-- =============================================================================

insert into categories (name, sort_order) values
  ('Paithani', 25),
  ('Cotton',   34),
  ('Chiffon',  36)
on conflict (name) do update set sort_order = excluded.sort_order;

-- Resulting order: Gadwal, Ilkal, Paithani, Soft Silk, Cotton, Chiffon, Fancy.
