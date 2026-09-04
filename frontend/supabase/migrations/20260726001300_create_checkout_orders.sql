-- Real checkout order flow: guest-safe confirmation, idempotency, payments and variant stock.
-- This migration replaces the draft checkout migration before it was applied anywhere.

create extension if not exists pgcrypto;

create sequence if not exists public.order_number_sequence;

alter table public.orders
  alter column order_number drop identity if exists;

alter table public.orders
  alter column order_number type text
  using (
    case
      when order_number::text like 'WT-%' then order_number::text
      else 'WT-' || to_char(created_at, 'YYYY') || '-' || lpad(order_number::text, 6, '0')
    end
  );

create or replace function public.generate_order_number()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return 'WT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_sequence')::text, 6, '0');
end;
$$;

do $$
declare
  max_suffix bigint;
begin
  select coalesce(max((matches.match_result)[1]::bigint), 0)
  into max_suffix
  from public.orders as existing_order
  cross join lateral regexp_match(
    existing_order.order_number,
    '^WT-[0-9]{4}-([0-9]+)$'
  ) as matches(match_result);

  if max_suffix > 0 then
    perform setval('public.order_number_sequence'::regclass, max_suffix, true);
  else
    perform setval('public.order_number_sequence'::regclass, 1, false);
  end if;
end;
$$;

alter table public.orders
  alter column order_number set default public.generate_order_number();

alter table public.orders
  alter column status set default 'pending_payment';

alter table public.orders
  add column if not exists customer_first_name text,
  add column if not exists customer_last_name text,
  add column if not exists customer_dni text,
  add column if not exists payment_method text not null default 'bank_transfer',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists shipping_address jsonb,
  add column if not exists shipping_cost_status text not null default 'fixed',
  add column if not exists admin_notes text,
  add column if not exists confirmation_token_hash text not null default encode(digest(encode(gen_random_bytes(24), 'hex'), 'sha256'), 'hex'),
  add column if not exists confirmation_token_secret_version integer not null default 1,
  add column if not exists idempotency_key text,
  add column if not exists paid_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists stock_restored_at timestamptz;

alter table public.order_items
  add column if not exists variant_id uuid references public.product_model_variants(id) on delete set null,
  add column if not exists variant_brand text,
  add column if not exists variant_model text;

alter table public.order_status_history
  add column if not exists internal_note text,
  add column if not exists public_note text;

update public.order_status_history
set internal_note = coalesce(internal_note, note)
where note is not null;

update public.orders
set
  customer_first_name = coalesce(
    nullif(customer_first_name, ''),
    nullif(split_part(coalesce(customer_name, ''), ' ', 1), ''),
    'Cliente'
  ),
  customer_last_name = coalesce(
    nullif(customer_last_name, ''),
    nullif(btrim(regexp_replace(coalesce(customer_name, ''), '^\S+\s*', '')), ''),
    'W.todocell'
  ),
  customer_email = coalesce(nullif(customer_email, ''), 'sin-email@wtodocell.local'),
  customer_name = coalesce(
    nullif(customer_name, ''),
    btrim(
      coalesce(nullif(customer_first_name, ''), 'Cliente') || ' ' ||
      coalesce(nullif(customer_last_name, ''), 'W.todocell')
    )
  ),
  payment_status = case status
    when 'confirmed' then 'approved'
    else coalesce(payment_status, 'pending')
  end,
  delivery_method = case delivery_method
    when 'retiro' then 'pickup'
    when 'moto_amba' then 'amba_courier'
    when 'correo_argentino' then 'nationwide_shipping'
    else delivery_method
  end,
  status = case status
    when 'pending' then 'pending_payment'
    when 'confirmed' then 'payment_confirmed'
    else status
  end,
  shipping_address = coalesce(
    shipping_address,
    case
      when delivery_method in ('retiro', 'pickup') then null
      else jsonb_strip_nulls(
        jsonb_build_object(
          'street', delivery_address,
          'number', null,
          'floorApartment', null,
          'city', delivery_city,
          'province', delivery_province,
          'postalCode', postal_code,
          'references', null
        )
      )
    end
  ),
  shipping_cost_status = case
    when delivery_method in ('correo_argentino', 'nationwide_shipping') and shipping_cost = 0 then 'to_be_confirmed'
    else coalesce(shipping_cost_status, 'fixed')
  end,
  discount_amount = coalesce(discount_amount, 0);

alter table public.orders
  alter column customer_first_name set not null,
  alter column customer_last_name set not null,
  alter column customer_email set not null,
  alter column customer_name set not null;

alter table public.orders
  drop constraint if exists orders_customer_name_not_empty,
  drop constraint if exists orders_status_allowed,
  drop constraint if exists orders_delivery_method_allowed,
  drop constraint if exists orders_total_consistent,
  drop constraint if exists orders_total_non_negative,
  drop constraint if exists orders_payment_method_allowed,
  drop constraint if exists orders_payment_status_allowed,
  drop constraint if exists orders_shipping_cost_status_allowed,
  drop constraint if exists orders_confirmation_token_hash_shape,
  drop constraint if exists orders_confirmation_token_secret_version_valid,
  add constraint orders_customer_name_not_empty check (length(btrim(customer_name)) > 0),
  add constraint orders_customer_first_name_not_empty check (length(btrim(customer_first_name)) > 0),
  add constraint orders_customer_last_name_not_empty check (length(btrim(customer_last_name)) > 0),
  add constraint orders_customer_email_not_empty check (length(btrim(customer_email)) > 0),
  add constraint orders_status_allowed check (
    status in ('pending_payment', 'payment_confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled')
  ),
  add constraint orders_payment_method_allowed check (payment_method in ('bank_transfer')),
  add constraint orders_payment_status_allowed check (
    payment_status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled')
  ),
  add constraint orders_delivery_method_allowed check (
    delivery_method in ('pickup', 'amba_courier', 'nationwide_shipping')
  ),
  add constraint orders_shipping_cost_status_allowed check (
    shipping_cost_status in ('fixed', 'to_be_confirmed')
  ),
  add constraint orders_confirmation_token_hash_shape check (
    confirmation_token_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint orders_confirmation_token_secret_version_valid check (
    confirmation_token_secret_version >= 1 and confirmation_token_secret_version <= 100
  ),
  add constraint orders_total_consistent check (total = subtotal + shipping_cost - discount_amount),
  add constraint orders_total_non_negative check (total >= 0);

update public.order_status_history
set
  previous_status = case previous_status
    when 'pending' then 'pending_payment'
    when 'confirmed' then 'payment_confirmed'
    else previous_status
  end,
  new_status = case new_status
    when 'pending' then 'pending_payment'
    when 'confirmed' then 'payment_confirmed'
    else new_status
  end;

alter table public.order_status_history
  drop constraint if exists order_status_history_previous_status_allowed,
  drop constraint if exists order_status_history_new_status_allowed,
  add constraint order_status_history_previous_status_allowed check (
    previous_status is null or previous_status in (
      'pending_payment', 'payment_confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'
    )
  ),
  add constraint order_status_history_new_status_allowed check (
    new_status in ('pending_payment', 'payment_confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled')
  );

create unique index if not exists orders_idempotency_key_idx
on public.orders (idempotency_key)
where idempotency_key is not null;

create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists order_items_variant_id_idx on public.order_items (variant_id);

drop function if exists public.get_order_confirmation(text, text);

create function public.get_order_confirmation(
  order_number_value text,
  confirmation_token_value text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  order_record public.orders%rowtype;
  items_value jsonb;
begin
  if length(btrim(coalesce(order_number_value, ''))) > 40
    or length(btrim(coalesce(confirmation_token_value, ''))) > 160 then
    return null;
  end if;

  select *
  into order_record
  from public.orders
  where order_number = btrim(order_number_value)
    and confirmation_token_hash = encode(digest(btrim(confirmation_token_value), 'sha256'), 'hex');

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', order_item.id,
    'productId', order_item.product_id,
    'variantId', order_item.variant_id,
    'variantBrand', order_item.variant_brand,
    'variantModel', order_item.variant_model,
    'productName', order_item.product_name,
    'productSlug', order_item.product_slug,
    'unitPrice', order_item.unit_price,
    'quantity', order_item.quantity,
    'lineTotal', order_item.line_total,
    'selectedColor', order_item.selected_color,
    'selectedCompatibility', order_item.selected_compatibility,
    'availabilityType', order_item.availability_type,
    'productCondition', order_item.product_condition,
    'imageUrl', order_item.image_url
  ) order by order_item.created_at), '[]'::jsonb)
  into items_value
  from public.order_items as order_item
  where order_item.order_id = order_record.id;

  return jsonb_build_object(
    'orderNumber', order_record.order_number,
    'status', order_record.status,
    'paymentStatus', order_record.payment_status,
    'paymentMethod', order_record.payment_method,
    'shippingMethod', order_record.delivery_method,
    'shippingCost', order_record.shipping_cost,
    'shippingCostStatus', order_record.shipping_cost_status,
    'subtotal', order_record.subtotal,
    'total', order_record.total,
    'currency', order_record.currency,
    'customerFirstName', order_record.customer_first_name,
    'createdAt', order_record.created_at,
    'items', items_value,
    'history', '[]'::jsonb
  );
end;
$$;

drop function if exists public.create_order(jsonb);

create function public.create_order(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid;
  existing_order public.orders%rowtype;
  customer_first_name_value text;
  customer_last_name_value text;
  customer_email_value text;
  customer_phone_value text;
  customer_phone_digits_value text;
  customer_dni_value text;
  customer_notes_value text;
  delivery_method_value text;
  payment_method_value text;
  confirmation_token_value text;
  confirmation_token_hash_value text;
  confirmation_token_secret_version_value integer := 1;
  shipping_address_payload jsonb;
  shipping_address_value jsonb;
  street_value text;
  number_value text;
  floor_apartment_value text;
  city_value text;
  province_value text;
  postal_code_value text;
  references_value text;
  shipping_cost_value integer := 0;
  shipping_cost_status_value text := 'fixed';
  idempotency_key_value text;
  items_value jsonb;
  item_value jsonb;
  product_record public.products%rowtype;
  variant_record public.product_model_variants%rowtype;
  stock_group record;
  request_item record;
  order_id_value uuid;
  order_number_value text;
  product_id_value uuid;
  variant_id_value uuid;
  quantity_value integer;
  client_unit_price_value integer;
  selected_color_value text;
  selected_compatibility_value text;
  subtotal_value integer := 0;
  line_total_value integer;
  created_items jsonb := '[]'::jsonb;
  product_has_variants boolean;
  primary_image_url text;
begin
  if jsonb_typeof(order_payload) <> 'object' or octet_length(order_payload::text) > 50000 then
    raise exception 'invalid_payload';
  end if;

  current_user_id := (select auth.uid());
  customer_first_name_value := left(btrim(coalesce(order_payload ->> 'customerFirstName', '')), 80);
  customer_last_name_value := left(btrim(coalesce(order_payload ->> 'customerLastName', '')), 80);
  customer_email_value := lower(left(btrim(coalesce(order_payload ->> 'customerEmail', '')), 180));
  customer_phone_value := left(btrim(coalesce(order_payload ->> 'customerPhone', '')), 60);
  customer_phone_digits_value := regexp_replace(customer_phone_value, '\D', '', 'g');
  customer_dni_value := nullif(left(btrim(coalesce(order_payload ->> 'customerDni', '')), 24), '');
  customer_notes_value := nullif(left(btrim(coalesce(order_payload ->> 'customerNotes', '')), 500), '');
  delivery_method_value := left(btrim(coalesce(order_payload ->> 'deliveryMethod', '')), 40);
  payment_method_value := left(btrim(coalesce(order_payload ->> 'paymentMethod', '')), 40);
  confirmation_token_value := btrim(coalesce(order_payload ->> 'confirmationToken', ''));
  confirmation_token_secret_version_value := floor(coalesce((order_payload ->> 'confirmationTokenSecretVersion')::numeric, 1))::integer;
  idempotency_key_value := nullif(left(btrim(coalesce(order_payload ->> 'idempotencyKey', '')), 120), '');
  shipping_address_payload := coalesce(order_payload -> 'shippingAddress', '{}'::jsonb);
  items_value := coalesce(order_payload -> 'items', '[]'::jsonb);

  if length(customer_first_name_value) = 0 or length(customer_last_name_value) = 0 then
    raise exception 'invalid_customer_name';
  end if;

  if length(customer_email_value) = 0 or customer_email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_customer_email';
  end if;

  if length(customer_phone_digits_value) < 8 or length(customer_phone_digits_value) > 15 then
    raise exception 'invalid_customer_phone';
  end if;

  if idempotency_key_value is null or length(idempotency_key_value) < 16 then
    raise exception 'missing_idempotency_key';
  end if;

  if length(confirmation_token_value) < 32 or length(confirmation_token_value) > 160 then
    raise exception 'missing_confirmation_token';
  end if;

  if confirmation_token_secret_version_value < 1 or confirmation_token_secret_version_value > 100 then
    raise exception 'invalid_confirmation_token_secret_version';
  end if;

  if delivery_method_value not in ('pickup', 'amba_courier', 'nationwide_shipping') then
    raise exception 'invalid_delivery_method';
  end if;

  if payment_method_value <> 'bank_transfer' then
    raise exception 'invalid_payment_method';
  end if;

  if jsonb_typeof(items_value) <> 'array' or jsonb_array_length(items_value) = 0 then
    raise exception 'empty_cart';
  end if;

  if jsonb_array_length(items_value) > 50 then
    raise exception 'too_many_items';
  end if;

  if jsonb_typeof(shipping_address_payload) <> 'object' then
    raise exception 'invalid_shipping_address';
  end if;

  street_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'street', '')), 120), '');
  number_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'streetNumber', shipping_address_payload ->> 'number', '')), 40), '');
  floor_apartment_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'apartment', shipping_address_payload ->> 'floorApartment', '')), 80), '');
  city_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'city', '')), 120), '');
  province_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'province', '')), 120), '');
  postal_code_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'postalCode', '')), 24), '');
  references_value := nullif(left(btrim(coalesce(shipping_address_payload ->> 'reference', shipping_address_payload ->> 'references', '')), 240), '');

  if delivery_method_value <> 'pickup' then
    if street_value is null or number_value is null or city_value is null or province_value is null or postal_code_value is null then
      raise exception 'invalid_shipping_address';
    end if;

    shipping_address_value := jsonb_strip_nulls(jsonb_build_object(
      'street', street_value,
      'number', number_value,
      'floorApartment', floor_apartment_value,
      'city', city_value,
      'province', province_value,
      'postalCode', postal_code_value,
      'references', references_value
    ));
  else
    shipping_address_value := null;
  end if;

  shipping_cost_value := case when delivery_method_value = 'amba_courier' then 5000 else 0 end;
  shipping_cost_status_value := case when delivery_method_value = 'nationwide_shipping' then 'to_be_confirmed' else 'fixed' end;
  confirmation_token_hash_value := encode(digest(confirmation_token_value, 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtextextended(idempotency_key_value, 0));

  select *
  into existing_order
  from public.orders
  where idempotency_key = idempotency_key_value
  for update;

  if found then
    if not (
      existing_order.confirmation_token_hash = confirmation_token_hash_value
      and existing_order.confirmation_token_secret_version = confirmation_token_secret_version_value
      and (
        (current_user_id is not null and existing_order.user_id = current_user_id)
        or (
          current_user_id is null
          and existing_order.user_id is null
          and existing_order.customer_email = customer_email_value
          and regexp_replace(existing_order.customer_phone, '\D', '', 'g') = customer_phone_digits_value
        )
      )
    ) then
      raise exception 'idempotency_key_conflict';
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'productId', order_item.product_id,
      'variantId', order_item.variant_id,
      'variantBrand', order_item.variant_brand,
      'variantModel', order_item.variant_model,
      'productName', order_item.product_name,
      'productSlug', order_item.product_slug,
      'unitPrice', order_item.unit_price,
      'quantity', order_item.quantity,
      'lineTotal', order_item.line_total,
      'selectedColor', order_item.selected_color,
      'selectedCompatibility', order_item.selected_compatibility,
      'availabilityType', order_item.availability_type,
      'productCondition', order_item.product_condition
    ) order by order_item.created_at), '[]'::jsonb)
    into created_items
    from public.order_items as order_item
    where order_item.order_id = existing_order.id;

    return jsonb_build_object(
      'id', existing_order.id,
      'orderNumber', existing_order.order_number,
      'confirmationToken', confirmation_token_value,
      'status', existing_order.status,
      'paymentStatus', existing_order.payment_status,
      'subtotal', existing_order.subtotal,
      'shippingCost', existing_order.shipping_cost,
      'shippingCostStatus', existing_order.shipping_cost_status,
      'total', existing_order.total,
      'currency', existing_order.currency,
      'items', created_items
    );
  end if;

  create temporary table if not exists checkout_request_items (
    line_index integer,
    product_id uuid,
    variant_id uuid,
    quantity integer,
    client_unit_price integer,
    selected_color text,
    selected_compatibility text
  ) on commit drop;

  truncate table checkout_request_items;

  for item_value in select * from jsonb_array_elements(items_value)
  loop
    begin
      product_id_value := (item_value ->> 'productId')::uuid;
      variant_id_value := nullif(item_value ->> 'variantId', '')::uuid;
      quantity_value := floor(coalesce((item_value ->> 'quantity')::numeric, 0))::integer;
      client_unit_price_value := floor(coalesce((item_value ->> 'clientUnitPrice')::numeric, -1))::integer;
    exception when others then
      raise exception 'invalid_product';
    end;

    selected_color_value := nullif(left(btrim(coalesce(item_value ->> 'selectedColor', '')), 80), '');
    selected_compatibility_value := nullif(left(btrim(coalesce(item_value ->> 'selectedCompatibility', '')), 120), '');

    if quantity_value < 1 or quantity_value > 99 then
      raise exception 'invalid_quantity';
    end if;

    if client_unit_price_value < 0 then
      raise exception 'missing_client_price';
    end if;

    insert into checkout_request_items (
      line_index,
      product_id,
      variant_id,
      quantity,
      client_unit_price,
      selected_color,
      selected_compatibility
    )
    values (
      (select count(*) + 1 from checkout_request_items),
      product_id_value,
      variant_id_value,
      quantity_value,
      client_unit_price_value,
      selected_color_value,
      selected_compatibility_value
    );
  end loop;

  for stock_group in
    select
      product_id,
      variant_id,
      sum(quantity)::integer as requested_quantity,
      array_agg(distinct client_unit_price) as client_prices
    from checkout_request_items
    group by product_id, variant_id
  loop
    select *
    into product_record
    from public.products
    where id = stock_group.product_id
      and is_active = true
    for update;

    if not found then
      raise exception 'product_unavailable';
    end if;

    if product_record.price is null or product_record.price < 0 then
      raise exception 'product_unavailable';
    end if;

    if array_length(stock_group.client_prices, 1) <> 1
      or stock_group.client_prices[1] <> product_record.price then
      raise exception 'price_changed';
    end if;

    select exists (
      select 1
      from public.product_model_variants as variant
      where variant.product_id = product_record.id
        and variant.is_active = true
    )
    into product_has_variants;

    if product_has_variants and stock_group.variant_id is null then
      raise exception 'variant_required';
    end if;

    if stock_group.variant_id is not null then
      select *
      into variant_record
      from public.product_model_variants
      where id = stock_group.variant_id
        and product_id = product_record.id
        and is_active = true
      for update;

      if not found then
        raise exception 'variant_unavailable';
      end if;

      if variant_record.stock < stock_group.requested_quantity then
        raise exception 'insufficient_stock';
      end if;

      update public.product_model_variants
      set stock = stock - stock_group.requested_quantity
      where id = variant_record.id;
    elsif product_record.availability_type = 'in_stock' then
      if product_record.stock < stock_group.requested_quantity then
        raise exception 'insufficient_stock';
      end if;

      update public.products
      set stock = stock - stock_group.requested_quantity
      where id = product_record.id;
    elsif stock_group.requested_quantity > 10 then
      raise exception 'invalid_quantity';
    end if;
  end loop;

  insert into public.orders (
    user_id,
    customer_name,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    customer_dni,
    customer_notes,
    status,
    delivery_method,
    payment_method,
    payment_status,
    shipping_address,
    shipping_cost,
    shipping_cost_status,
    subtotal,
    discount_amount,
    total,
    currency,
    source,
    idempotency_key,
    confirmation_token_hash,
    confirmation_token_secret_version
  )
  values (
    current_user_id,
    btrim(customer_first_name_value || ' ' || customer_last_name_value),
    customer_first_name_value,
    customer_last_name_value,
    customer_email_value,
    customer_phone_value,
    customer_dni_value,
    customer_notes_value,
    'pending_payment',
    delivery_method_value,
    payment_method_value,
    'pending',
    shipping_address_value,
    shipping_cost_value,
    shipping_cost_status_value,
    0,
    0,
    shipping_cost_value,
    'ARS',
    'web',
    idempotency_key_value,
    confirmation_token_hash_value,
    confirmation_token_secret_version_value
  )
  returning id, order_number into order_id_value, order_number_value;

  for request_item in
    select *
    from checkout_request_items
    order by line_index
  loop
    select *
    into product_record
    from public.products
    where id = request_item.product_id;

    if request_item.variant_id is not null then
      select *
      into variant_record
      from public.product_model_variants
      where id = request_item.variant_id;
    end if;

    line_total_value := product_record.price * request_item.quantity;
    subtotal_value := subtotal_value + line_total_value;

    select image.storage_path
    into primary_image_url
    from public.product_images as image
    where image.product_id = product_record.id
      and image.is_primary = true
    order by image.sort_order, image.created_at
    limit 1;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      variant_brand,
      variant_model,
      product_name,
      product_slug,
      unit_price,
      quantity,
      line_total,
      selected_color,
      selected_compatibility,
      image_url,
      availability_type,
      product_condition
    )
    values (
      order_id_value,
      product_record.id,
      request_item.variant_id,
      case when request_item.variant_id is null then null else variant_record.brand end,
      case when request_item.variant_id is null then null else variant_record.model end,
      product_record.name,
      product_record.slug,
      product_record.price,
      request_item.quantity,
      line_total_value,
      request_item.selected_color,
      request_item.selected_compatibility,
      primary_image_url,
      product_record.availability_type,
      product_record.condition
    );

    created_items := created_items || jsonb_build_object(
      'productId', product_record.id,
      'variantId', request_item.variant_id,
      'variantBrand', case when request_item.variant_id is null then null else variant_record.brand end,
      'variantModel', case when request_item.variant_id is null then null else variant_record.model end,
      'productName', product_record.name,
      'productSlug', product_record.slug,
      'unitPrice', product_record.price,
      'quantity', request_item.quantity,
      'lineTotal', line_total_value,
      'selectedColor', request_item.selected_color,
      'selectedCompatibility', request_item.selected_compatibility,
      'availabilityType', product_record.availability_type,
      'productCondition', product_record.condition
    );
  end loop;

  update public.orders
  set
    subtotal = subtotal_value,
    total = subtotal_value + shipping_cost_value
  where id = order_id_value;

  insert into public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by
  )
  values (
    order_id_value,
    null,
    'pending_payment',
    current_user_id
  );

  return jsonb_build_object(
    'id', order_id_value,
    'orderNumber', order_number_value,
    'confirmationToken', confirmation_token_value,
    'status', 'pending_payment',
    'paymentStatus', 'pending',
    'subtotal', subtotal_value,
    'shippingCost', shipping_cost_value,
    'shippingCostStatus', shipping_cost_status_value,
    'total', subtotal_value + shipping_cost_value,
    'currency', 'ARS',
    'items', created_items
  );
end;
$$;

drop function if exists public.get_admin_order_details(uuid);

create function public.get_admin_order_details(order_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record record;
  history_value jsonb;
  items_value jsonb;
begin
  if not (select public.has_admin_access()) then
    return null;
  end if;

  select
    id,
    order_number,
    status,
    payment_status,
    payment_method,
    delivery_method,
    shipping_cost,
    shipping_cost_status,
    subtotal,
    total,
    currency,
    customer_name,
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    customer_dni,
    customer_notes,
    admin_notes,
    shipping_address,
    created_at
  into order_record
  from public.orders
  where id = order_id_value;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', order_item.id,
    'productId', order_item.product_id,
    'variantId', order_item.variant_id,
    'variantBrand', order_item.variant_brand,
    'variantModel', order_item.variant_model,
    'productName', order_item.product_name,
    'productSlug', order_item.product_slug,
    'unitPrice', order_item.unit_price,
    'quantity', order_item.quantity,
    'lineTotal', order_item.line_total,
    'selectedColor', order_item.selected_color,
    'selectedCompatibility', order_item.selected_compatibility,
    'availabilityType', order_item.availability_type,
    'productCondition', order_item.product_condition,
    'imageUrl', order_item.image_url
  ) order by order_item.created_at), '[]'::jsonb)
  into items_value
  from public.order_items as order_item
  where order_item.order_id = order_record.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', history.id,
    'previousStatus', history.previous_status,
    'newStatus', history.new_status,
    'note', coalesce(history.internal_note, history.note),
    'createdAt', history.created_at
  ) order by history.created_at desc), '[]'::jsonb)
  into history_value
  from public.order_status_history as history
  where history.order_id = order_record.id;

  return jsonb_build_object(
    'id', order_record.id,
    'orderNumber', order_record.order_number,
    'status', order_record.status,
    'paymentStatus', order_record.payment_status,
    'paymentMethod', order_record.payment_method,
    'shippingMethod', order_record.delivery_method,
    'shippingCost', order_record.shipping_cost,
    'shippingCostStatus', order_record.shipping_cost_status,
    'subtotal', order_record.subtotal,
    'total', order_record.total,
    'currency', order_record.currency,
    'customerName', order_record.customer_name,
    'customerFirstName', order_record.customer_first_name,
    'customerLastName', order_record.customer_last_name,
    'customerEmail', order_record.customer_email,
    'customerPhone', order_record.customer_phone,
    'customerDni', order_record.customer_dni,
    'customerNotes', order_record.customer_notes,
    'adminNotes', order_record.admin_notes,
    'shippingAddress', order_record.shipping_address,
    'createdAt', order_record.created_at,
    'items', items_value,
    'history', history_value
  );
end;
$$;

drop function if exists public.update_order_status(uuid, text, text);

create function public.update_order_status(
  order_id_value uuid,
  new_status_value text,
  note_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status_value text;
  restored_stock_value integer := 0;
begin
  if not (select public.has_admin_access()) then
    return jsonb_build_object('success', false, 'code', 'not_allowed');
  end if;

  if new_status_value not in ('pending_payment', 'payment_confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled') then
    return jsonb_build_object('success', false, 'code', 'invalid_status');
  end if;

  select status
  into previous_status_value
  from public.orders
  where id = order_id_value
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'order_not_found');
  end if;

  if previous_status_value = new_status_value then
    return jsonb_build_object(
      'success', true,
      'changed', false,
      'previousStatus', previous_status_value,
      'status', previous_status_value,
      'restoredStock', 0
    );
  end if;

  if not (
    (previous_status_value = 'pending_payment' and new_status_value in ('payment_confirmed', 'cancelled'))
    or (previous_status_value = 'payment_confirmed' and new_status_value in ('preparing', 'cancelled'))
    or (previous_status_value = 'preparing' and new_status_value in ('ready', 'cancelled'))
    or (previous_status_value = 'ready' and new_status_value in ('shipped', 'cancelled'))
    or (previous_status_value = 'shipped' and new_status_value = 'delivered')
  ) then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid_transition',
      'previousStatus', previous_status_value,
      'status', previous_status_value
    );
  end if;

  if new_status_value = 'cancelled' then
    if previous_status_value in ('shipped', 'delivered', 'cancelled') then
      return jsonb_build_object(
        'success', false,
        'code', 'invalid_transition',
        'previousStatus', previous_status_value,
        'status', previous_status_value
      );
    end if;

    if exists (
      select 1
      from public.orders
      where id = order_id_value
        and stock_restored_at is null
      for update
    ) then
      perform 1
      from public.order_items
      where order_id = order_id_value
      for update;

      with variant_lines as (
        select
          order_item.variant_id,
          sum(order_item.quantity)::integer as quantity
        from public.order_items as order_item
        where order_item.order_id = order_id_value
          and order_item.variant_id is not null
        group by order_item.variant_id
      ),
      restored_variants as (
        update public.product_model_variants as variant
        set stock = variant.stock + variant_lines.quantity
        from variant_lines
        where variant_lines.variant_id = variant.id
        returning variant_lines.quantity
      ),
      product_lines as (
        select
          order_item.product_id,
          sum(order_item.quantity)::integer as quantity
        from public.order_items as order_item
        where order_item.order_id = order_id_value
          and order_item.product_id is not null
          and order_item.variant_id is null
          and order_item.availability_type = 'in_stock'
        group by order_item.product_id
      ),
      restored_products as (
        update public.products as product
        set stock = product.stock + product_lines.quantity
        from product_lines
        where product_lines.product_id = product.id
        returning product_lines.quantity
      )
      select coalesce(sum(quantity), 0)::integer
      into restored_stock_value
      from (
        select quantity from restored_variants
        union all
        select quantity from restored_products
      ) as restored;

      update public.orders
      set stock_restored_at = now()
      where id = order_id_value;
    end if;
  end if;

  update public.orders
  set
    status = new_status_value,
    payment_status = case
      when new_status_value = 'payment_confirmed' then 'approved'
      when new_status_value = 'cancelled' then 'cancelled'
      else payment_status
    end,
    paid_at = case
      when new_status_value = 'payment_confirmed' and paid_at is null then now()
      else paid_at
    end,
    shipped_at = case
      when new_status_value = 'shipped' and shipped_at is null then now()
      else shipped_at
    end,
    delivered_at = case
      when new_status_value = 'delivered' and delivered_at is null then now()
      else delivered_at
    end,
    cancelled_at = case
      when new_status_value = 'cancelled' and cancelled_at is null then now()
      else cancelled_at
    end,
    admin_notes = nullif(left(btrim(coalesce(note_value, admin_notes, '')), 500), '')
  where id = order_id_value;

  insert into public.order_status_history (
    order_id,
    previous_status,
    new_status,
    changed_by
  )
  values (
    order_id_value,
    previous_status_value,
    new_status_value,
    (select auth.uid())
  );

  return jsonb_build_object(
    'success', true,
    'changed', true,
    'previousStatus', previous_status_value,
    'status', new_status_value,
    'restoredStock', restored_stock_value
  );
end;
$$;

revoke execute on function public.generate_order_number() from public;
revoke execute on function public.generate_order_number() from anon;
revoke execute on function public.generate_order_number() from authenticated;

revoke execute on function public.get_order_confirmation(text, text) from public;
grant execute on function public.get_order_confirmation(text, text) to anon;
grant execute on function public.get_order_confirmation(text, text) to authenticated;

revoke execute on function public.get_admin_order_details(uuid) from public;
revoke execute on function public.get_admin_order_details(uuid) from anon;
grant execute on function public.get_admin_order_details(uuid) to authenticated;

revoke execute on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon;
grant execute on function public.create_order(jsonb) to authenticated;

revoke execute on function public.update_order_status(uuid, text, text) from public;
revoke execute on function public.update_order_status(uuid, text, text) from anon;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

revoke all on table public.orders from public;
revoke all on table public.orders from anon;
revoke all on table public.orders from authenticated;
grant select (
  id,
  user_id,
  order_number,
  status,
  customer_name,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  customer_dni,
  customer_notes,
  delivery_method,
  payment_method,
  payment_status,
  shipping_address,
  shipping_cost,
  shipping_cost_status,
  subtotal,
  total,
  currency,
  source,
  created_at,
  updated_at,
  paid_at,
  shipped_at,
  delivered_at,
  cancelled_at
) on public.orders to authenticated;

revoke all on table public.order_status_history from public;
revoke all on table public.order_status_history from anon;
revoke all on table public.order_status_history from authenticated;
grant select (
  id,
  order_id,
  previous_status,
  new_status,
  public_note,
  created_at
) on public.order_status_history to authenticated;
