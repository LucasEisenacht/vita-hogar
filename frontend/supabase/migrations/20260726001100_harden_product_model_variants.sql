-- Incremental hardening for product model variants after the base migration was applied.

do $$
declare
  semantic_duplicate_count integer;
begin
  select count(*)
  into semantic_duplicate_count
  from (
    select
      product_id,
      lower(btrim(brand)) as normalized_brand,
      lower(btrim(model)) as normalized_model
    from public.product_model_variants
    group by
      product_id,
      lower(btrim(brand)),
      lower(btrim(model))
    having count(*) > 1
  ) as duplicate_groups;

  if semantic_duplicate_count > 0 then
    raise exception
      'Cannot create case-insensitive uniqueness for product_model_variants: % duplicate group(s) must be resolved manually.',
      semantic_duplicate_count
      using detail = 'Run the duplicate diagnostic query in this migration, merge or rename duplicates, then rerun it.';
  end if;
end;
$$;

/*
Diagnostic query for manual review before applying the unique functional index:

select
  product_id,
  lower(btrim(brand)) as normalized_brand,
  lower(btrim(model)) as normalized_model,
  count(*) as duplicate_count,
  array_agg(id order by created_at, id) as variant_ids
from public.product_model_variants
group by
  product_id,
  lower(btrim(brand)),
  lower(btrim(model))
having count(*) > 1
order by duplicate_count desc, product_id;
*/

alter table public.product_model_variants
drop constraint if exists product_model_variants_unique_product_brand_model;

drop index if exists public.product_model_variants_unique_product_brand_model_idx;

create unique index if not exists product_model_variants_unique_product_brand_model_ci_idx
on public.product_model_variants (
  product_id,
  lower(btrim(brand)),
  lower(btrim(model))
);

create or replace function public.sync_product_stock_from_model_variants()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  old_product_id uuid;
  new_product_id uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    old_product_id := old.product_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    new_product_id := new.product_id;
  end if;

  if old_product_id is not null and old_product_id is distinct from new_product_id then
    update public.products
    set stock = coalesce(
      (
        select sum(variant.stock)::integer
        from public.product_model_variants as variant
        where variant.product_id = old_product_id
          and variant.is_active = true
      ),
      0
    )
    where id = old_product_id;
  end if;

  if new_product_id is not null then
    update public.products
    set stock = coalesce(
      (
        select sum(variant.stock)::integer
        from public.product_model_variants as variant
        where variant.product_id = new_product_id
          and variant.is_active = true
      ),
      0
    )
    where id = new_product_id;
  elsif old_product_id is not null then
    update public.products
    set stock = coalesce(
      (
        select sum(variant.stock)::integer
        from public.product_model_variants as variant
        where variant.product_id = old_product_id
          and variant.is_active = true
      ),
      0
    )
    where id = old_product_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_product_stock_from_model_variants on public.product_model_variants;
create trigger sync_product_stock_from_model_variants
after insert or delete or update of stock, is_active, product_id
on public.product_model_variants
for each row
execute function public.sync_product_stock_from_model_variants();

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
      using detail = 'Active products in category fundas must include at least one model variant.';
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
      using detail = 'Active products in category fundas must include at least one model variant.';
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

grant execute on function public.has_admin_access() to authenticated;

revoke execute on function public.sync_product_stock_from_model_variants() from public;
revoke execute on function public.sync_product_stock_from_model_variants() from anon;
revoke execute on function public.sync_product_stock_from_model_variants() from authenticated;

revoke execute on function public.create_product_with_model_variants(jsonb, jsonb) from public;
revoke execute on function public.create_product_with_model_variants(jsonb, jsonb) from anon;
grant execute on function public.create_product_with_model_variants(jsonb, jsonb) to authenticated;

revoke execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) from public;
revoke execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) from anon;
grant execute on function public.update_product_with_model_variants(uuid, jsonb, jsonb) to authenticated;
