-- 0002_storage.sql
begin;

-- 1) Crear bucket (privado)
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;

-- 2) Policies en storage.objects
-- Permitir CRUD solo al owner en el bucket item-photos

create policy "item_photos_read_own"
on storage.objects for select
using (
  bucket_id = 'item-photos'
  and owner = auth.uid()
);

create policy "item_photos_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'item-photos'
  and owner = auth.uid()
);

create policy "item_photos_update_own"
on storage.objects for update
using (
  bucket_id = 'item-photos'
  and owner = auth.uid()
)
with check (
  bucket_id = 'item-photos'
  and owner = auth.uid()
);

create policy "item_photos_delete_own"
on storage.objects for delete
using (
  bucket_id = 'item-photos'
  and owner = auth.uid()
);

commit;