-- Photo storage bucket.
-- Public-read because saree photos are shown on shareable pages and WhatsApp's
-- crawler fetches them unauthenticated. Only signed-in family can write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('saree-photos', 'saree-photos', true, 10485760,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public read saree photos" on storage.objects;
create policy "public read saree photos" on storage.objects
  for select to public using (bucket_id = 'saree-photos');

drop policy if exists "family uploads saree photos" on storage.objects;
create policy "family uploads saree photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'saree-photos');

drop policy if exists "family updates saree photos" on storage.objects;
create policy "family updates saree photos" on storage.objects
  for update to authenticated using (bucket_id = 'saree-photos');

drop policy if exists "family deletes saree photos" on storage.objects;
create policy "family deletes saree photos" on storage.objects
  for delete to authenticated using (bucket_id = 'saree-photos');
