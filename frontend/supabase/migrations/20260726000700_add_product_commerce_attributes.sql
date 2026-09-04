-- Commerce attributes for phones, consoles and made-to-order accessories.
alter table public.products
add column if not exists condition text not null default 'new',
add column if not exists availability_type text not null default 'in_stock',
add column if not exists brand text,
add column if not exists model text,
add column if not exists storage_capacity text,
add column if not exists battery_health smallint,
add column if not exists cosmetic_condition text,
add column if not exists included_accessories text[] not null default '{}'::text[],
add column if not exists technical_details jsonb not null default '{}'::jsonb,
add column if not exists estimated_delivery_text text;

alter table public.products
drop constraint if exists products_condition_allowed,
add constraint products_condition_allowed
check (condition in ('new', 'used', 'refurbished'));

alter table public.products
drop constraint if exists products_availability_type_allowed,
add constraint products_availability_type_allowed
check (availability_type in ('in_stock', 'made_to_order'));

alter table public.products
drop constraint if exists products_battery_health_range,
add constraint products_battery_health_range
check (battery_health is null or battery_health between 1 and 100);

alter table public.products
drop constraint if exists products_commerce_text_lengths,
add constraint products_commerce_text_lengths
check (
  (brand is null or length(brand) <= 80)
  and (model is null or length(model) <= 120)
  and (storage_capacity is null or length(storage_capacity) <= 40)
  and (cosmetic_condition is null or length(cosmetic_condition) <= 160)
  and (estimated_delivery_text is null or length(estimated_delivery_text) <= 180)
);

create or replace function public.text_array_items_are_short(
  items text[],
  max_length integer
)
returns boolean
language sql
immutable
strict
set search_path = public
as $$
  select not exists (
    select 1
    from unnest(items) as item
    where item is null
      or length(btrim(item)) = 0
      or length(item) > max_length
  );
$$;

alter table public.products
drop constraint if exists products_included_accessories_lengths,
add constraint products_included_accessories_lengths
check (public.text_array_items_are_short(included_accessories, 120));

alter table public.products
drop constraint if exists products_technical_details_object,
add constraint products_technical_details_object
check (jsonb_typeof(technical_details) = 'object');

alter table public.order_items
add column if not exists availability_type text not null default 'in_stock',
add column if not exists product_condition text;

alter table public.order_items
drop constraint if exists order_items_availability_type_allowed,
add constraint order_items_availability_type_allowed
check (availability_type in ('in_stock', 'made_to_order'));

alter table public.order_items
drop constraint if exists order_items_product_condition_allowed,
add constraint order_items_product_condition_allowed
check (
  product_condition is null
  or product_condition in ('new', 'used', 'refurbished')
);

create or replace function public.create_order(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  customer_name_value text;
  customer_email_value text;
  customer_phone_value text;
  delivery_method_value text;
  delivery_address_value text;
  delivery_city_value text;
  delivery_province_value text;
  postal_code_value text;
  customer_notes_value text;
  items_value jsonb;
  item_value jsonb;
  product_record public.products%rowtype;
  order_id_value uuid;
  order_number_value bigint;
  product_id_value uuid;
  quantity_value integer;
  selected_color_value text;
  selected_compatibility_value text;
  subtotal_value integer := 0;
  shipping_cost_value integer := 0;
  line_total_value integer;
  created_items jsonb := '[]'::jsonb;
begin
  current_user_id := (select auth.uid());
  customer_name_value := left(btrim(coalesce(order_payload ->> 'customerName', '')), 160);
  customer_email_value := nullif(left(btrim(coalesce(order_payload ->> 'customerEmail', '')), 180), '');
  customer_phone_value := left(btrim(coalesce(order_payload ->> 'customerPhone', '')), 60);
  delivery_method_value := left(btrim(coalesce(order_payload ->> 'deliveryMethod', '')), 40);
  delivery_address_value := nullif(left(btrim(coalesce(order_payload ->> 'deliveryAddress', '')), 220), '');
  delivery_city_value := nullif(left(btrim(coalesce(order_payload ->> 'deliveryCity', '')), 120), '');
  delivery_province_value := nullif(left(btrim(coalesce(order_payload ->> 'deliveryProvince', '')), 120), '');
  postal_code_value := nullif(left(btrim(coalesce(order_payload ->> 'postalCode', '')), 24), '');
  customer_notes_value := nullif(left(btrim(coalesce(order_payload ->> 'customerNotes', '')), 500), '');
  items_value := coalesce(order_payload -> 'items', '[]'::jsonb);

  if length(customer_name_value) = 0 then
    raise exception 'invalid_customer_name';
  end if;

  if length(customer_phone_value) = 0 then
    raise exception 'invalid_customer_phone';
  end if;

  if delivery_method_value not in ('moto_amba', 'correo_argentino', 'retiro') then
    raise exception 'invalid_delivery_method';
  end if;

  if jsonb_typeof(items_value) <> 'array' or jsonb_array_length(items_value) = 0 then
    raise exception 'empty_cart';
  end if;

  if jsonb_array_length(items_value) > 50 then
    raise exception 'too_many_items';
  end if;

  shipping_cost_value := case when delivery_method_value = 'moto_amba' then 5000 else 0 end;

  insert into public.orders (
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_method,
    delivery_address,
    delivery_city,
    delivery_province,
    postal_code,
    customer_notes,
    subtotal,
    shipping_cost,
    discount_amount,
    total,
    currency,
    source
  )
  values (
    current_user_id,
    customer_name_value,
    customer_email_value,
    customer_phone_value,
    delivery_method_value,
    delivery_address_value,
    delivery_city_value,
    delivery_province_value,
    postal_code_value,
    customer_notes_value,
    0,
    shipping_cost_value,
    0,
    shipping_cost_value,
    'ARS',
    'web'
  )
  returning id, order_number into order_id_value, order_number_value;

  for item_value in select * from jsonb_array_elements(items_value)
  loop
    begin
      product_id_value := (item_value ->> 'productId')::uuid;
    exception when others then
      raise exception 'invalid_product';
    end;

    quantity_value := floor(coalesce((item_value ->> 'quantity')::numeric, 0))::integer;
    selected_color_value := nullif(left(btrim(coalesce(item_value ->> 'selectedColor', '')), 80), '');
    selected_compatibility_value := nullif(left(btrim(coalesce(item_value ->> 'selectedCompatibility', '')), 120), '');

    if quantity_value < 1 or quantity_value > 99 then
      raise exception 'invalid_quantity';
    end if;

    select *
    into product_record
    from public.products
    where id = product_id_value
      and is_active = true
    for update;

    if not found then
      raise exception 'product_unavailable';
    end if;

    if product_record.availability_type = 'made_to_order' and quantity_value > 10 then
      raise exception 'invalid_quantity';
    end if;

    if product_record.availability_type = 'in_stock' then
      if product_record.stock < quantity_value then
        raise exception 'insufficient_stock';
      end if;

      update public.products
      set stock = stock - quantity_value
      where id = product_record.id;
    end if;

    line_total_value := product_record.price * quantity_value;
    subtotal_value := subtotal_value + line_total_value;

    insert into public.order_items (
      order_id,
      product_id,
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
      product_record.name,
      product_record.slug,
      product_record.price,
      quantity_value,
      line_total_value,
      selected_color_value,
      selected_compatibility_value,
      null,
      product_record.availability_type,
      product_record.condition
    );

    created_items := created_items || jsonb_build_object(
      'productId', product_record.id,
      'productName', product_record.name,
      'productSlug', product_record.slug,
      'unitPrice', product_record.price,
      'quantity', quantity_value,
      'lineTotal', line_total_value,
      'selectedColor', selected_color_value,
      'selectedCompatibility', selected_compatibility_value,
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
    changed_by,
    note
  )
  values (
    order_id_value,
    null,
    'pending',
    current_user_id,
    'Pedido creado desde checkout web'
  );

  return jsonb_build_object(
    'id', order_id_value,
    'orderNumber', order_number_value,
    'status', 'pending',
    'subtotal', subtotal_value,
    'shippingCost', shipping_cost_value,
    'discountAmount', 0,
    'total', subtotal_value + shipping_cost_value,
    'currency', 'ARS',
    'items', created_items
  );
end;
$$;

revoke execute on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon;
grant execute on function public.create_order(jsonb) to authenticated;

revoke execute on function public.text_array_items_are_short(text[], integer) from public;
revoke execute on function public.text_array_items_are_short(text[], integer) from anon;
revoke execute on function public.text_array_items_are_short(text[], integer) from authenticated;
