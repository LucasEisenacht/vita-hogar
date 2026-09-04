-- Extends product model variants so case products can manage model + color stock.
-- Existing variants remain valid with null color fields until an admin assigns colors.

alter table public.product_model_variants
  add column if not exists color_name text null,
  add column if not exists color_key text null;

alter table public.product_model_variants
  drop constraint if exists product_model_variants_color_key_valid;

alter table public.product_model_variants
  add constraint product_model_variants_color_key_valid
  check (
    color_key is null
    or (
      color_key = lower(btrim(color_key))
      and length(btrim(color_key)) between 1 and 80
    )
  );

alter table public.product_model_variants
  drop constraint if exists product_model_variants_color_name_valid;

alter table public.product_model_variants
  add constraint product_model_variants_color_name_valid
  check (color_name is null or length(btrim(color_name)) between 1 and 80);

drop index if exists public.product_model_variants_unique_product_brand_model_ci_idx;
alter table public.product_model_variants
  drop constraint if exists product_model_variants_unique_product_brand_model;

create unique index if not exists product_model_variants_unique_product_brand_model_color_ci_idx
on public.product_model_variants (
  product_id,
  lower(btrim(brand)),
  lower(btrim(model)),
  coalesce(color_key, '')
);

create index if not exists product_model_variants_product_color_idx
on public.product_model_variants (product_id, color_key)
where color_key is not null;

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
  is_active_product boolean;
  is_case_category boolean;
  variant_payload jsonb;
begin
  if not (select public.has_admin_access()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  is_active_product := coalesce((product_payload ->> 'is_active')::boolean, false);

  select exists (
    select 1
    from public.categories
    where categories.id = nullif(product_payload ->> 'category_id', '')::uuid
      and categories.slug = 'fundas'
  )
  into is_case_category;

  if is_active_product and is_case_category and jsonb_array_length(coalesce(model_variants_payload, '[]'::jsonb)) = 0 then
    raise exception 'active_case_requires_model_variants'
      using detail = 'Active products in category fundas must include at least one model + color variant.';
  end if;

  if is_active_product and is_case_category and exists (
    select 1
    from jsonb_array_elements(coalesce(model_variants_payload, '[]'::jsonb)) as variant
    where nullif(btrim(coalesce(variant ->> 'color_key', '')), '') is null
  ) then
    raise exception 'active_case_requires_color_variants'
      using detail = 'Active case variants must include color_key.';
  end if;

  insert into public.products (
    availability_type, badge, battery_health, brand, category_id, colors,
    compatibility, condition, cosmetic_condition, description,
    estimated_delivery_text, included_accessories, is_active, is_featured,
    model, name, previous_price, price, short_description, slug,
    specifications, stock, storage_capacity, technical_details
  )
  values (
    coalesce(nullif(product_payload ->> 'availability_type', ''), 'in_stock'),
    nullif(btrim(coalesce(product_payload ->> 'badge', '')), ''),
    nullif(product_payload ->> 'battery_health', '')::smallint,
    nullif(btrim(coalesce(product_payload ->> 'brand', '')), ''),
    nullif(product_payload ->> 'category_id', '')::uuid,
    coalesce(array(select value from jsonb_array_elements_text(coalesce(product_payload -> 'colors', '[]'::jsonb)) as value), '{}'::text[]),
    coalesce(array(select value from jsonb_array_elements_text(coalesce(product_payload -> 'compatibility', '[]'::jsonb)) as value), '{}'::text[]),
    coalesce(nullif(product_payload ->> 'condition', ''), 'new'),
    nullif(btrim(coalesce(product_payload ->> 'cosmetic_condition', '')), ''),
    nullif(btrim(coalesce(product_payload ->> 'description', '')), ''),
    nullif(btrim(coalesce(product_payload ->> 'estimated_delivery_text', '')), ''),
    coalesce(array(select value from jsonb_array_elements_text(coalesce(product_payload -> 'included_accessories', '[]'::jsonb)) as value), '{}'::text[]),
    is_active_product,
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
      product_id, brand, model, color_name, color_key, stock, is_active
    )
    values (
      created_product_id,
      btrim(variant_payload ->> 'brand'),
      btrim(variant_payload ->> 'model'),
      nullif(btrim(coalesce(variant_payload ->> 'color_name', '')), ''),
      nullif(btrim(coalesce(variant_payload ->> 'color_key', '')), ''),
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
  is_active_product boolean;
  is_case_category boolean;
  variant_payload jsonb;
begin
  if not (select public.has_admin_access()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  is_active_product := coalesce((product_payload ->> 'is_active')::boolean, false);

  select exists (
    select 1
    from public.categories
    where categories.id = nullif(product_payload ->> 'category_id', '')::uuid
      and categories.slug = 'fundas'
  )
  into is_case_category;

  if is_active_product and is_case_category and jsonb_array_length(coalesce(model_variants_payload, '[]'::jsonb)) = 0 then
    raise exception 'active_case_requires_model_variants'
      using detail = 'Active products in category fundas must include at least one model + color variant.';
  end if;

  if is_active_product and is_case_category and exists (
    select 1
    from jsonb_array_elements(coalesce(model_variants_payload, '[]'::jsonb)) as variant
    where nullif(btrim(coalesce(variant ->> 'color_key', '')), '') is null
  ) then
    raise exception 'active_case_requires_color_variants'
      using detail = 'Active case variants must include color_key.';
  end if;

  update public.products
  set
    availability_type = coalesce(nullif(product_payload ->> 'availability_type', ''), 'in_stock'),
    badge = nullif(btrim(coalesce(product_payload ->> 'badge', '')), ''),
    battery_health = nullif(product_payload ->> 'battery_health', '')::smallint,
    brand = nullif(btrim(coalesce(product_payload ->> 'brand', '')), ''),
    category_id = nullif(product_payload ->> 'category_id', '')::uuid,
    colors = coalesce(array(select value from jsonb_array_elements_text(coalesce(product_payload -> 'colors', '[]'::jsonb)) as value), '{}'::text[]),
    compatibility = coalesce(array(select value from jsonb_array_elements_text(coalesce(product_payload -> 'compatibility', '[]'::jsonb)) as value), '{}'::text[]),
    condition = coalesce(nullif(product_payload ->> 'condition', ''), 'new'),
    cosmetic_condition = nullif(btrim(coalesce(product_payload ->> 'cosmetic_condition', '')), ''),
    description = nullif(btrim(coalesce(product_payload ->> 'description', '')), ''),
    estimated_delivery_text = nullif(btrim(coalesce(product_payload ->> 'estimated_delivery_text', '')), ''),
    included_accessories = coalesce(array(select value from jsonb_array_elements_text(coalesce(product_payload -> 'included_accessories', '[]'::jsonb)) as value), '{}'::text[]),
    is_active = is_active_product,
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
      product_id, brand, model, color_name, color_key, stock, is_active
    )
    values (
      product_id_value,
      btrim(variant_payload ->> 'brand'),
      btrim(variant_payload ->> 'model'),
      nullif(btrim(coalesce(variant_payload ->> 'color_name', '')), ''),
      nullif(btrim(coalesce(variant_payload ->> 'color_key', '')), ''),
      (variant_payload ->> 'stock')::integer,
      coalesce((variant_payload ->> 'is_active')::boolean, true)
    );
  end loop;
end;
$$;

revoke execute on function public.create_product_with_model_variants(jsonb, jsonb) from public;
revoke execute on function public.create_product_with_model_variants(jsonb, jsonb) from anon;
grant execute on function public.create_product_with_model_variants(jsonb, jsonb) to authenticated;

revoke execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) from public;
revoke execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) from anon;
grant execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) to authenticated;
