-- Product image infrastructure backed by Supabase Storage.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  width integer,
  height integer,
  file_size integer,
  mime_type text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_images_storage_path_not_empty check (length(btrim(storage_path)) > 0),
  constraint product_images_storage_path_shape check (storage_path like 'products/%/%'),
  constraint product_images_sort_order_non_negative check (sort_order >= 0),
  constraint product_images_width_positive check (width is null or width > 0),
  constraint product_images_height_positive check (height is null or height > 0),
  constraint product_images_file_size_positive check (file_size is null or file_size > 0),
  constraint product_images_mime_type_allowed check (
    mime_type is null or mime_type in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif'
    )
  )
);

create index if not exists product_images_product_id_idx
on public.product_images (product_id);

create index if not exists product_images_product_sort_order_idx
on public.product_images (product_id, sort_order);

create index if not exists product_images_product_primary_idx
on public.product_images (product_id, is_primary);

create unique index if not exists product_images_one_primary_per_product_idx
on public.product_images (product_id)
where is_primary = true;

alter table public.product_images enable row level security;

revoke all on table public.product_images from public;
revoke all on table public.product_images from anon;
revoke all on table public.product_images from authenticated;
grant select on table public.product_images to anon;
grant select, insert, update, delete on table public.product_images to authenticated;

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admins can read all product images" on public.product_images;
create policy "Admins can read all product images"
on public.product_images
for select
to authenticated
using ((select public.has_admin_access()));

drop policy if exists "Admins can insert product images" on public.product_images;
create policy "Admins can insert product images"
on public.product_images
for insert
to authenticated
with check ((select public.has_admin_access()));

drop policy if exists "Admins can update product images" on public.product_images;
create policy "Admins can update product images"
on public.product_images
for update
to authenticated
using ((select public.has_admin_access()))
with check ((select public.has_admin_access()));

drop policy if exists "Admins can delete product images" on public.product_images;
create policy "Admins can delete product images"
on public.product_images
for delete
to authenticated
using ((select public.has_admin_access()));

create or replace function public.set_product_image_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_product_image_updated_at on public.product_images;
create trigger set_product_image_updated_at
before update on public.product_images
for each row
execute function public.set_product_image_updated_at();

create or replace function public.set_product_image_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = old.created_by;
  end if;

  return new;
end;
$$;

drop trigger if exists set_product_image_audit_fields on public.product_images;
create trigger set_product_image_audit_fields
before insert or update on public.product_images
for each row
execute function public.set_product_image_audit_fields();

create or replace function public.keep_single_primary_product_image()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_primary then
    update public.product_images
    set is_primary = false
    where product_id = new.product_id
      and id <> new.id
      and is_primary = true;
  end if;

  return new;
end;
$$;

drop trigger if exists keep_single_primary_product_image on public.product_images;
create trigger keep_single_primary_product_image
before insert or update of is_primary on public.product_images
for each row
execute function public.keep_single_primary_product_image();

create or replace function public.promote_next_product_image_after_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_image_id uuid;
begin
  if old.is_primary then
    select id
    into next_image_id
    from public.product_images
    where product_id = old.product_id
    order by sort_order asc, created_at asc
    limit 1;

    if next_image_id is not null then
      update public.product_images
      set is_primary = true
      where id = next_image_id;
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists promote_next_product_image_after_delete on public.product_images;
create trigger promote_next_product_image_after_delete
after delete on public.product_images
for each row
execute function public.promote_next_product_image_after_delete();

drop policy if exists "Public can read product image objects" on storage.objects;
create policy "Public can read product image objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can insert product image objects" on storage.objects;
create policy "Admins can insert product image objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and name like 'products/%/%'
  and (select public.has_admin_access())
);

drop policy if exists "Admins can update product image objects" on storage.objects;
create policy "Admins can update product image objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and name like 'products/%/%'
  and (select public.has_admin_access())
)
with check (
  bucket_id = 'product-images'
  and name like 'products/%/%'
  and (select public.has_admin_access())
);

drop policy if exists "Admins can delete product image objects" on storage.objects;
create policy "Admins can delete product image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and name like 'products/%/%'
  and (select public.has_admin_access())
);

revoke execute on function public.set_product_image_updated_at() from public;
revoke execute on function public.set_product_image_updated_at() from anon;
revoke execute on function public.set_product_image_updated_at() from authenticated;

revoke execute on function public.set_product_image_audit_fields() from public;
revoke execute on function public.set_product_image_audit_fields() from anon;
revoke execute on function public.set_product_image_audit_fields() from authenticated;

revoke execute on function public.keep_single_primary_product_image() from public;
revoke execute on function public.keep_single_primary_product_image() from anon;
revoke execute on function public.keep_single_primary_product_image() from authenticated;

revoke execute on function public.promote_next_product_image_after_delete() from public;
revoke execute on function public.promote_next_product_image_after_delete() from anon;
revoke execute on function public.promote_next_product_image_after_delete() from authenticated;
