-- Per-model stock for case products without removing legacy compatibility fields.
create table if not exists public.product_model_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  brand text not null,
  model text not null,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_model_variants_brand_not_empty check (length(btrim(brand)) > 0),
  constraint product_model_variants_model_not_empty check (length(btrim(model)) > 0),
  constraint product_model_variants_stock_non_negative check (stock >= 0),
  constraint product_model_variants_unique_product_brand_model unique (product_id, brand, model)
);

create index if not exists product_model_variants_product_id_idx
on public.product_model_variants (product_id);

create index if not exists product_model_variants_product_active_idx
on public.product_model_variants (product_id, is_active);

alter table public.product_model_variants enable row level security;

revoke all on table public.product_model_variants from public;
revoke all on table public.product_model_variants from anon;
revoke all on table public.product_model_variants from authenticated;
grant select on table public.product_model_variants to anon;
grant select, insert, update, delete on table public.product_model_variants to authenticated;

drop policy if exists "Public can read active product model variants" on public.product_model_variants;
create policy "Public can read active product model variants"
on public.product_model_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products
    where products.id = product_model_variants.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admins can read all product model variants" on public.product_model_variants;
create policy "Admins can read all product model variants"
on public.product_model_variants
for select
to authenticated
using ((select public.has_admin_access()));

drop policy if exists "Admins can insert product model variants" on public.product_model_variants;
create policy "Admins can insert product model variants"
on public.product_model_variants
for insert
to authenticated
with check ((select public.has_admin_access()));

drop policy if exists "Admins can update product model variants" on public.product_model_variants;
create policy "Admins can update product model variants"
on public.product_model_variants
for update
to authenticated
using ((select public.has_admin_access()))
with check ((select public.has_admin_access()));

drop policy if exists "Admins can delete product model variants" on public.product_model_variants;
create policy "Admins can delete product model variants"
on public.product_model_variants
for delete
to authenticated
using ((select public.has_admin_access()));

create or replace function public.set_product_model_variant_updated_at()
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

drop trigger if exists set_product_model_variant_updated_at on public.product_model_variants;
create trigger set_product_model_variant_updated_at
before update on public.product_model_variants
for each row
execute function public.set_product_model_variant_updated_at();

create or replace function public.create_product_with_model_variants(
  product_payload jsonb,
  model_variants_payload jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_product_id uuid;
  variant_payload jsonb;
begin
  if not (select public.has_admin_access()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  insert into public.products (
    availability_type,
    badge,
    battery_health,
    brand,
    category_id,
    colors,
    compatibility,
    condition,
    cosmetic_condition,
    description,
    estimated_delivery_text,
    included_accessories,
    is_active,
    is_featured,
    model,
    name,
    previous_price,
    price,
    short_description,
    slug,
    specifications,
    stock,
    storage_capacity,
    technical_details
  )
  values (
    coalesce(nullif(product_payload ->> 'availability_type', ''), 'in_stock'),
    nullif(btrim(coalesce(product_payload ->> 'badge', '')), ''),
    nullif(product_payload ->> 'battery_health', '')::smallint,
    nullif(btrim(coalesce(product_payload ->> 'brand', '')), ''),
    nullif(product_payload ->> 'category_id', '')::uuid,
    coalesce(
      array(
        select value
        from jsonb_array_elements_text(coalesce(product_payload -> 'colors', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    ),
    coalesce(
      array(
        select value
        from jsonb_array_elements_text(coalesce(product_payload -> 'compatibility', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    ),
    coalesce(nullif(product_payload ->> 'condition', ''), 'new'),
    nullif(btrim(coalesce(product_payload ->> 'cosmetic_condition', '')), ''),
    nullif(btrim(coalesce(product_payload ->> 'description', '')), ''),
    nullif(btrim(coalesce(product_payload ->> 'estimated_delivery_text', '')), ''),
    coalesce(
      array(
        select value
        from jsonb_array_elements_text(coalesce(product_payload -> 'included_accessories', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    ),
    coalesce((product_payload ->> 'is_active')::boolean, false),
    coalesce((product_payload ->> 'is_featured')::boolean, false),
    nullif(btrim(coalesce(product_payload ->> 'model', '')), ''),
    btrim(product_payload ->> 'name'),
    nullif(product_payload ->> 'previous_price', '')::integer,
    (product_payload ->> 'price')::integer,
    nullif(btrim(coalesce(product_payload ->> 'short_description', '')), ''),
    btrim(product_payload ->> 'slug'),
    coalesce(product_payload -> 'specifications', '{}'::jsonb),
    (product_payload ->> 'stock')::integer,
    nullif(btrim(coalesce(product_payload ->> 'storage_capacity', '')), ''),
    coalesce(product_payload -> 'technical_details', '{}'::jsonb)
  )
  returning id into created_product_id;

  for variant_payload in
    select value
    from jsonb_array_elements(coalesce(model_variants_payload, '[]'::jsonb)) as value
  loop
    insert into public.product_model_variants (
      product_id,
      brand,
      model,
      stock,
      is_active
    )
    values (
      created_product_id,
      btrim(variant_payload ->> 'brand'),
      btrim(variant_payload ->> 'model'),
      (variant_payload ->> 'stock')::integer,
      coalesce((variant_payload ->> 'is_active')::boolean, true)
    );
  end loop;

  return created_product_id;
end;
$$;

create or replace function public.update_product_with_model_variants(
  product_id_value uuid,
  product_payload jsonb,
  model_variants_payload jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  variant_payload jsonb;
begin
  if not (select public.has_admin_access()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.products
  set
    availability_type = coalesce(nullif(product_payload ->> 'availability_type', ''), 'in_stock'),
    badge = nullif(btrim(coalesce(product_payload ->> 'badge', '')), ''),
    battery_health = nullif(product_payload ->> 'battery_health', '')::smallint,
    brand = nullif(btrim(coalesce(product_payload ->> 'brand', '')), ''),
    category_id = nullif(product_payload ->> 'category_id', '')::uuid,
    colors = coalesce(
      array(
        select value
        from jsonb_array_elements_text(coalesce(product_payload -> 'colors', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    ),
    compatibility = coalesce(
      array(
        select value
        from jsonb_array_elements_text(coalesce(product_payload -> 'compatibility', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    ),
    condition = coalesce(nullif(product_payload ->> 'condition', ''), 'new'),
    cosmetic_condition = nullif(btrim(coalesce(product_payload ->> 'cosmetic_condition', '')), ''),
    description = nullif(btrim(coalesce(product_payload ->> 'description', '')), ''),
    estimated_delivery_text = nullif(btrim(coalesce(product_payload ->> 'estimated_delivery_text', '')), ''),
    included_accessories = coalesce(
      array(
        select value
        from jsonb_array_elements_text(coalesce(product_payload -> 'included_accessories', '[]'::jsonb)) as value
      ),
      '{}'::text[]
    ),
    is_active = coalesce((product_payload ->> 'is_active')::boolean, false),
    is_featured = coalesce((product_payload ->> 'is_featured')::boolean, false),
    model = nullif(btrim(coalesce(product_payload ->> 'model', '')), ''),
    name = btrim(product_payload ->> 'name'),
    previous_price = nullif(product_payload ->> 'previous_price', '')::integer,
    price = (product_payload ->> 'price')::integer,
    short_description = nullif(btrim(coalesce(product_payload ->> 'short_description', '')), ''),
    slug = btrim(product_payload ->> 'slug'),
    specifications = coalesce(product_payload -> 'specifications', '{}'::jsonb),
    stock = (product_payload ->> 'stock')::integer,
    storage_capacity = nullif(btrim(coalesce(product_payload ->> 'storage_capacity', '')), ''),
    technical_details = coalesce(product_payload -> 'technical_details', '{}'::jsonb)
  where id = product_id_value;

  if not found then
    raise exception 'product_not_found';
  end if;

  delete from public.product_model_variants
  where product_id = product_id_value;

  for variant_payload in
    select value
    from jsonb_array_elements(coalesce(model_variants_payload, '[]'::jsonb)) as value
  loop
    insert into public.product_model_variants (
      product_id,
      brand,
      model,
      stock,
      is_active
    )
    values (
      product_id_value,
      btrim(variant_payload ->> 'brand'),
      btrim(variant_payload ->> 'model'),
      (variant_payload ->> 'stock')::integer,
      coalesce((variant_payload ->> 'is_active')::boolean, true)
    );
  end loop;
end;
$$;

revoke execute on function public.set_product_model_variant_updated_at() from public;
revoke execute on function public.set_product_model_variant_updated_at() from anon;
revoke execute on function public.set_product_model_variant_updated_at() from authenticated;

revoke execute on function public.create_product_with_model_variants(jsonb, jsonb) from public;
revoke execute on function public.create_product_with_model_variants(jsonb, jsonb) from anon;
grant execute on function public.create_product_with_model_variants(jsonb, jsonb) to authenticated;

revoke execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) from public;
revoke execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) from anon;
grant execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) to authenticated;
