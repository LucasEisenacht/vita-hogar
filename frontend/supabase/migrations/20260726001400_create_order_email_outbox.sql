-- Transactional email outbox for order lifecycle events.

create table if not exists public.order_email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  recipient_email text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  next_attempt_at timestamptz,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_email_outbox_event_type_allowed check (
    event_type in ('order_received', 'payment_confirmed')
  ),
  constraint order_email_outbox_status_allowed check (
    status in ('pending', 'processing', 'sent', 'failed')
  ),
  constraint order_email_outbox_recipient_not_empty check (
    length(btrim(recipient_email)) > 0
  ),
  constraint order_email_outbox_attempts_valid check (attempts >= 0 and attempts <= 5),
  constraint order_email_outbox_provider_message_id_length check (
    provider_message_id is null or length(provider_message_id) <= 200
  ),
  constraint order_email_outbox_unique_order_event unique (order_id, event_type)
);

create index if not exists order_email_outbox_status_created_at_idx
on public.order_email_outbox (status, created_at);

create index if not exists order_email_outbox_status_next_attempt_at_idx
on public.order_email_outbox (status, next_attempt_at, created_at);

create index if not exists order_email_outbox_order_id_idx
on public.order_email_outbox (order_id);

alter table public.order_email_outbox enable row level security;

revoke all on table public.order_email_outbox from public;
revoke all on table public.order_email_outbox from anon;
revoke all on table public.order_email_outbox from authenticated;
grant select, update on table public.order_email_outbox to service_role;
grant select (id, idempotency_key, confirmation_token_secret_version) on public.orders to service_role;

create or replace function public.set_order_email_outbox_updated_at()
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

drop trigger if exists set_order_email_outbox_updated_at on public.order_email_outbox;
create trigger set_order_email_outbox_updated_at
before update on public.order_email_outbox
for each row
execute function public.set_order_email_outbox_updated_at();

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
  order_record record;
  items_value jsonb;
begin
  select
    id,
    user_id,
    order_number,
    customer_first_name,
    customer_last_name,
    customer_email,
    status,
    payment_status,
    payment_method,
    delivery_method,
    shipping_address,
    shipping_cost,
    shipping_cost_status,
    subtotal,
    discount_amount,
    total,
    currency,
    created_at,
    paid_at
  into order_record
  from public.orders
  where id = order_id_value;

  if not found then
    raise exception 'order_not_found';
  end if;

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
  ) order by order_item.created_at), '[]'::jsonb)
  into items_value
  from public.order_items as order_item
  where order_item.order_id = order_record.id;

  return jsonb_build_object(
    'eventType', event_type_value,
    'orderId', order_record.id,
    'orderNumber', order_record.order_number,
    'buyerType', case when order_record.user_id is null then 'guest' else 'registered' end,
    'customerFirstName', order_record.customer_first_name,
    'customerLastName', order_record.customer_last_name,
    'customerEmail', order_record.customer_email,
    'status', order_record.status,
    'paymentStatus', order_record.payment_status,
    'paymentMethod', order_record.payment_method,
    'deliveryMethod', order_record.delivery_method,
    'shippingAddress', order_record.shipping_address,
    'shippingCost', order_record.shipping_cost,
    'shippingCostStatus', order_record.shipping_cost_status,
    'subtotal', order_record.subtotal,
    'discountAmount', order_record.discount_amount,
    'total', order_record.total,
    'currency', order_record.currency,
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
create trigger enqueue_order_received_email
after insert on public.orders
for each row
execute function public.enqueue_order_received_email();

create or replace function public.enqueue_payment_confirmed_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending_payment'
    and new.status = 'payment_confirmed'
    and old.payment_status is distinct from 'approved'
    and new.payment_status = 'approved'
    and new.paid_at is not null then
    perform public.enqueue_order_email(new.id, 'payment_confirmed');
  end if;

  return new;
end;
$$;

drop trigger if exists enqueue_payment_confirmed_email on public.orders;
create trigger enqueue_payment_confirmed_email
after update of status, payment_status on public.orders
for each row
execute function public.enqueue_payment_confirmed_email();

create or replace function public.claim_order_email_outbox(batch_size integer default 10)
returns setof public.order_email_outbox
language sql
security definer
set search_path = public
as $$
  with claimed as (
    select id
    from public.order_email_outbox
    where (
        (
          status in ('pending', 'failed')
          and (
            next_attempt_at is null
            or next_attempt_at <= now()
          )
        )
        or (status = 'processing' and updated_at < now() - interval '10 minutes')
      )
      and attempts < 5
    order by created_at, id
    for update skip locked
    limit least(greatest(batch_size, 1), 25)
  )
  update public.order_email_outbox as outbox
  set
    status = 'processing',
    attempts = outbox.attempts + 1,
    last_error = null,
    next_attempt_at = null
  from claimed
  where claimed.id = outbox.id
  returning outbox.*;
$$;

create or replace function public.get_order_confirmation(
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
    'customerFirstName', order_record.customer_first_name,
    'customerEmail', order_record.customer_email,
    'buyerType', case when order_record.user_id is null then 'guest' else 'registered' end,
    'createdAt', order_record.created_at,
    'items', items_value,
    'history', '[]'::jsonb
  );
end;
$$;

create or replace function public.get_admin_order_details(order_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  email_outbox_value jsonb;
  history_value jsonb;
  items_value jsonb;
  order_record record;
begin
  if not (select public.has_admin_access()) then
    return null;
  end if;

  select
    id,
    user_id,
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
    paid_at,
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

  select coalesce(jsonb_agg(jsonb_build_object(
    'eventType', outbox.event_type,
    'status', outbox.status,
    'attempts', outbox.attempts,
    'lastError', case
      when outbox.last_error is null then null
      else left(outbox.last_error, 240)
    end,
    'providerMessageId', outbox.provider_message_id,
    'sentAt', outbox.sent_at,
    'updatedAt', outbox.updated_at
  ) order by outbox.created_at), '[]'::jsonb)
  into email_outbox_value
  from public.order_email_outbox as outbox
  where outbox.order_id = order_record.id;

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
    'buyerType', case when order_record.user_id is null then 'guest' else 'registered' end,
    'paidAt', order_record.paid_at,
    'shippingAddress', order_record.shipping_address,
    'createdAt', order_record.created_at,
    'emailOutbox', email_outbox_value,
    'items', items_value,
    'history', history_value
  );
end;
$$;

revoke execute on function public.set_order_email_outbox_updated_at() from public;
revoke execute on function public.set_order_email_outbox_updated_at() from anon;
revoke execute on function public.set_order_email_outbox_updated_at() from authenticated;

revoke execute on function public.build_order_email_payload(uuid, text) from public;
revoke execute on function public.build_order_email_payload(uuid, text) from anon;
revoke execute on function public.build_order_email_payload(uuid, text) from authenticated;

revoke execute on function public.enqueue_order_email(uuid, text) from public;
revoke execute on function public.enqueue_order_email(uuid, text) from anon;
revoke execute on function public.enqueue_order_email(uuid, text) from authenticated;

revoke execute on function public.enqueue_order_received_email() from public;
revoke execute on function public.enqueue_order_received_email() from anon;
revoke execute on function public.enqueue_order_received_email() from authenticated;

revoke execute on function public.enqueue_payment_confirmed_email() from public;
revoke execute on function public.enqueue_payment_confirmed_email() from anon;
revoke execute on function public.enqueue_payment_confirmed_email() from authenticated;

revoke execute on function public.claim_order_email_outbox(integer) from public;
revoke execute on function public.claim_order_email_outbox(integer) from anon;
revoke execute on function public.claim_order_email_outbox(integer) from authenticated;
grant execute on function public.claim_order_email_outbox(integer) to service_role;

revoke execute on function public.get_order_confirmation(text, text) from public;
grant execute on function public.get_order_confirmation(text, text) to anon;
grant execute on function public.get_order_confirmation(text, text) to authenticated;

revoke execute on function public.get_admin_order_details(uuid) from public;
revoke execute on function public.get_admin_order_details(uuid) from anon;
grant execute on function public.get_admin_order_details(uuid) to authenticated;
