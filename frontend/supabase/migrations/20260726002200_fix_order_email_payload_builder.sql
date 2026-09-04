-- Fix order email payloads so the SQL builder matches the TypeScript
-- OrderEmailPayload contract consumed by the server-side email processor.
--
-- This migration does not resend historical emails and does not modify existing
-- outbox rows. Use the repair SQL in the handoff notes for individual rows.

create or replace function public.build_order_email_payload(
  order_id_value uuid,
  event_type_value text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  delivery_method_value text;
  first_name_value text;
  items_value jsonb;
  last_name_value text;
  order_record record;
  payment_method_value text;
  payment_status_value text;
  shipping_address_value jsonb;
  shipping_cost_status_value text;
begin
  if event_type_value not in ('order_received', 'payment_confirmed') then
    raise exception 'invalid_email_event';
  end if;

  select
    id,
    user_id,
    order_number,
    customer_name,
    customer_first_name,
    customer_last_name,
    customer_email,
    status,
    payment_status,
    payment_method,
    delivery_method,
    delivery_address,
    delivery_city,
    delivery_province,
    postal_code,
    shipping_address,
    shipping_cost,
    shipping_cost_status,
    subtotal,
    discount_amount,
    total,
    created_at,
    paid_at
  into order_record
  from public.orders
  where id = order_id_value;

  if not found then
    raise exception 'order_not_found';
  end if;

  if order_record.customer_email is null
    or length(btrim(order_record.customer_email)) = 0 then
    raise exception 'missing_recipient_email';
  end if;

  first_name_value := coalesce(
    nullif(btrim(coalesce(order_record.customer_first_name, '')), ''),
    nullif(split_part(btrim(coalesce(order_record.customer_name, '')), ' ', 1), ''),
    'Cliente'
  );
  last_name_value := coalesce(
    nullif(btrim(coalesce(order_record.customer_last_name, '')), ''),
    nullif(btrim(regexp_replace(btrim(coalesce(order_record.customer_name, '')), '^\S+\s*', '')), ''),
    ''
  );
  payment_method_value := case
    when order_record.payment_method = 'bank_transfer' then 'bank_transfer'
    else 'bank_transfer'
  end;
  payment_status_value := case
    when order_record.payment_status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled') then order_record.payment_status
    when order_record.status in ('payment_confirmed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered') then 'approved'
    when order_record.status = 'cancelled' then 'cancelled'
    else 'pending'
  end;
  delivery_method_value := case
    when order_record.delivery_method in ('pickup', 'amba_courier', 'nationwide_shipping') then order_record.delivery_method
    when order_record.delivery_method = 'retiro' then 'pickup'
    when order_record.delivery_method = 'moto_amba' then 'amba_courier'
    when order_record.delivery_method = 'correo_argentino' then 'nationwide_shipping'
    else 'pickup'
  end;
  shipping_cost_status_value := case
    when order_record.shipping_cost_status in ('fixed', 'to_be_confirmed') then order_record.shipping_cost_status
    when delivery_method_value = 'nationwide_shipping' then 'to_be_confirmed'
    else 'fixed'
  end;
  shipping_address_value := coalesce(
    order_record.shipping_address,
    jsonb_strip_nulls(jsonb_build_object(
      'street', order_record.delivery_address,
      'city', order_record.delivery_city,
      'province', order_record.delivery_province,
      'postalCode', order_record.postal_code
    ))
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'productName', order_item.product_name,
    'productSlug', order_item.product_slug,
    'unitPrice', order_item.unit_price,
    'quantity', order_item.quantity,
    'lineTotal', order_item.line_total,
    'selectedColor', order_item.selected_color,
    'selectedCompatibility', order_item.selected_compatibility,
    'variantBrand', order_item.variant_brand,
    'variantModel', order_item.variant_model
  ) order by order_item.created_at, order_item.id), '[]'::jsonb)
  into items_value
  from public.order_items as order_item
  where order_item.order_id = order_record.id;

  if jsonb_array_length(items_value) = 0 then
    raise exception 'invalid_email_payload_empty_items';
  end if;

  return jsonb_build_object(
    'eventType', event_type_value,
    'orderId', order_record.id,
    'orderNumber', case
      when order_record.order_number::text like 'WT-%' then order_record.order_number::text
      else 'WT-' || to_char(order_record.created_at, 'YYYY') || '-' || lpad(order_record.order_number::text, 6, '0')
    end,
    'buyerType', case when order_record.user_id is null then 'guest' else 'registered' end,
    'customerFirstName', first_name_value,
    'customerLastName', last_name_value,
    'customerEmail', lower(btrim(order_record.customer_email)),
    'paymentStatus', payment_status_value,
    'paymentMethod', payment_method_value,
    'deliveryMethod', delivery_method_value,
    'shippingAddress', shipping_address_value,
    'shippingCost', coalesce(order_record.shipping_cost, 0),
    'shippingCostStatus', shipping_cost_status_value,
    'subtotal', coalesce(order_record.subtotal, 0),
    'discountAmount', coalesce(order_record.discount_amount, 0),
    'total', coalesce(order_record.total, 0),
    'currency', 'ARS',
    'createdAt', order_record.created_at,
    'paidAt', order_record.paid_at,
    'items', items_value
  );
end;
$$;

create or replace function public.enqueue_order_email(
  order_id_value uuid,
  event_type_value text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_email_value text;
begin
  if event_type_value not in ('order_received', 'payment_confirmed') then
    raise exception 'invalid_email_event';
  end if;

  select customer_email
  into order_email_value
  from public.orders
  where id = order_id_value;

  if order_email_value is null or length(btrim(order_email_value)) = 0 then
    raise exception 'missing_recipient_email';
  end if;

  insert into public.order_email_outbox (
    order_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    order_id_value,
    event_type_value,
    lower(btrim(order_email_value)),
    public.build_order_email_payload(order_id_value, event_type_value)
  )
  on conflict (order_id, event_type) do nothing;
end;
$$;

create or replace function public.enqueue_order_received_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_order_email(new.id, 'order_received');
  return new;
end;
$$;

drop trigger if exists enqueue_order_received_email on public.orders;
create constraint trigger enqueue_order_received_email
after insert on public.orders
deferrable initially deferred
for each row
execute function public.enqueue_order_received_email();

revoke execute on function public.build_order_email_payload(uuid, text) from public;
revoke execute on function public.build_order_email_payload(uuid, text) from anon;
revoke execute on function public.build_order_email_payload(uuid, text) from authenticated;

revoke execute on function public.enqueue_order_email(uuid, text) from public;
revoke execute on function public.enqueue_order_email(uuid, text) from anon;
revoke execute on function public.enqueue_order_email(uuid, text) from authenticated;

revoke execute on function public.enqueue_order_received_email() from public;
revoke execute on function public.enqueue_order_received_email() from anon;
revoke execute on function public.enqueue_order_received_email() from authenticated;

notify pgrst, 'reload schema';
