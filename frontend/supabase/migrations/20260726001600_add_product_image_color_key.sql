-- Adds an explicit editable color association for product images.
-- Existing images remain valid with null color_key until an admin assigns one.

alter table public.product_images
  add column if not exists color_key text null;

alter table public.product_images
  drop constraint if exists product_images_color_key_valid;

alter table public.product_images
  add constraint product_images_color_key_valid
  check (
    color_key is null
    or (
      color_key = lower(btrim(color_key))
      and length(btrim(color_key)) between 1 and 80
    )
  );

create index if not exists product_images_product_color_key_idx
on public.product_images (product_id, color_key)
where color_key is not null;

comment on column public.product_images.color_key is
  'Normalized product color key used to associate an image with a public color option.';
