-- Reconcile production order email outbox objects on databases where historical
-- migrations were applied manually or partially.
--
-- Safe to run after 20260726002000_bridge_missing_order_confirmation_columns.sql.
-- This migration is additive/idempotent for data and does not recreate orders,
-- delete orders, or enqueue historical emails.

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists customer_first_name text,
  add column if not exists customer_last_name text,
  add column if not exists customer_dni text,
  add column if not exists payment_method text not null default 'bank_transfer',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists shipping_address jsonb,
  add column if not exists shipping_cost_status text not null default 'fixed',
  add column if not exists admin_notes text,
  add column if not exists paid_at timestamptz;

update public.orders
set
  customer_first_name = coalesce(
    nullif(customer_first_name, ''),
    nullif(split_part(btrim(customer_name), ' ', 1), ''),
    'Cliente'
  ),
  customer_last_name = coalesce(
    nullif(customer_last_name, ''),
    nullif(btrim(regexp_replace(btrim(customer_name), '^\S+\s*', '')), ''),
    'W.todocell'
  ),
  payment_method = coalesce(nullif(payment_method, ''), 'bank_transfer'),
  payment_status = coalesce(nullif(payment_status, ''), 'pending'),
  shipping_cost_status = coalesce(nullif(shipping_cost_status, ''), 'fixed')
where customer_first_name is null
  or customer_last_name is null
  or payment_method is null
  or payment_method = ''
  or payment_status is null
  or payment_status = ''
  or shipping_cost_status is null
  or shipping_cost_status = '';

alter table public.orders
  alter column customer_first_name set not null,
  alter column customer_last_name set not null,
  alter column payment_method set default 'bank_transfer',
  alter column payment_method set not null,
  alter column payment_status set default 'pending',
  alter column payment_status set not null,
  alter column shipping_cost_status set default 'fixed',
  alter column shipping_cost_status set not null;

alter table public.order_items
  add column if not exists variant_id uuid,
  add column if not exists variant_brand text,
  add column if not exists variant_model text,
  add column if not exists availability_type text not null default 'in_stock',
  add column if not exists product_condition text;

update public.order_items
set availability_type = 'in_stock'
where availability_type is null
  or availability_type = '';

alter table public.order_items
  alter column availability_type set default 'in_stock',
  alter column availability_type set not null;

alter table public.order_status_history
  add column if not exists internal_note text,
  add column if not exists public_note text;

update public.order_status_history
set internal_note = coalesce(internal_note, note)
where internal_note is null
  and note is not null;

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
  updated_at timestamptz not null default now()
);

alter table public.order_email_outbox
  add column if not exists id uuid,
  add column if not exists order_id uuid,
  add column if not exists event_type text,
  add column if not exists recipient_email text,
  add column if not exists payload jsonb,
  add column if not exists status text,
  add column if not exists attempts integer,
  add column if not exists last_error text,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists sent_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.order_email_outbox
set id = gen_random_uuid()
where id is null;

update public.order_email_outbox
set
  payload = coalesce(payload, '{}'::jsonb),
  status = coalesce(nullif(status, ''), 'pending'),
  attempts = coalesce(attempts, 0),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.order_email_outbox
  alter column id set default gen_random_uuid(),
  alter column id set not null,
  alter column payload set default '{}'::jsonb,
  alter column payload set not null,
  alter column status set default 'pending',
  alter column status set not null,
  alter column attempts set default 0,
  alter column attempts set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column order_id set not null,
  alter column event_type set not null,
  alter column recipient_email set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.order_email_outbox'::regclass
      and contype = 'p'
  ) then
    alter table public.order_email_outbox
      add constraint order_email_outbox_pkey primary key (id);
  end if;
end;
$$;

alter table public.order_email_outbox
  drop constraint if exists order_email_outbox_event_type_allowed,
  drop constraint if exists order_email_outbox_status_allowed,
  drop constraint if exists order_email_outbox_recipient_not_empty,
  drop constraint if exists order_email_outbox_attempts_valid,
  drop constraint if exists order_email_outbox_provider_message_id_length,
  add constraint order_email_outbox_event_type_allowed check (
    event_type in ('order_received', 'payment_confirmed')
  ),
  add constraint order_email_outbox_status_allowed check (
    status in ('pending', 'processing', 'sent', 'failed')
  ),
  add constraint order_email_outbox_recipient_not_empty check (
    length(btrim(recipient_email)) > 0
  ),
  add constraint order_email_outbox_attempts_valid check (
    attempts >= 0 and attempts <= 5
  ),
  add constraint order_email_outbox_provider_message_id_length check (
    provider_message_id is null or length(provider_message_id) <= 200
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.order_email_outbox'::regclass
      and conname = 'order_email_outbox_order_id_fkey'
  ) then
    alter table public.order_email_outbox
      add constraint order_email_outbox_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete cascade;
  end if;
end;
$$;

create unique index if not exists order_email_outbox_unique_order_event
on public.order_email_outbox (order_id, event_type);

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

drop trigger if exists set_order_email_outbox_updated_at on public.order_email_outbox;
drop trigger if exists enqueue_order_received_email on public.orders;
drop trigger if exists enqueue_payment_confirmed_email on public.orders;

drop function if exists public.set_order_email_outbox_updated_at();
drop function if exists public.build_order_email_payload(uuid, text);
drop function if exists public.enqueue_order_email(uuid, text);
drop function if exists public.enqueue_order_received_email();
drop function if exists public.enqueue_payment_confirmed_email();
drop function if exists public.claim_order_email_outbox();
drop function if exists public.claim_order_email_outbox(integer);
drop function if exists public.mark_order_email_outbox_sent(uuid, text);
drop function if exists public.mark_order_email_outbox_failed(uuid, text, timestamptz, boolean);
drop function if exists public.get_order_confirmation(text, text);
drop function if exists public.get_admin_order_details(uuid);

create function public.set_order_email_outbox_updated_at()
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

create trigger set_order_email_outbox_updated_at
before update on public.order_email_outbox
for each row
execute function public.set_order_email_outbox_updated_at();

create function public.build_order_email_payload(
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

create function public.enqueue_order_email(
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

create function public.enqueue_order_received_email()
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

create trigger enqueue_order_received_email
after insert on public.orders
for each row
execute function public.enqueue_order_received_email();

create function public.enqueue_payment_confirmed_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.payment_status is distinct from 'approved'
    and new.payment_status = 'approved'
    and new.paid_at is not null
    and new.status in ('payment_confirmed', 'preparing', 'ready', 'shipped', 'delivered') then
    perform public.enqueue_order_email(new.id, 'payment_confirmed');
  end if;

  return new;
end;
$$;

create trigger enqueue_payment_confirmed_email
after update of status, payment_status, paid_at on public.orders
for each row
execute function public.enqueue_payment_confirmed_email();

create function public.claim_order_email_outbox(batch_size integer default 10)
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

create function public.mark_order_email_outbox_sent(
  outbox_id_value uuid,
  provider_message_id_value text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.order_email_outbox
  set
    last_error = null,
    next_attempt_at = null,
    provider_message_id = provider_message_id_value,
    sent_at = now(),
    status = 'sent'
  where id = outbox_id_value
    and status = 'processing';
end;
$$;

create function public.mark_order_email_outbox_failed(
  outbox_id_value uuid,
  last_error_value text,
  next_attempt_at_value timestamptz default null,
  retryable_value boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.order_email_outbox
  set
    attempts = case when retryable_value then attempts else 5 end,
    last_error = left(regexp_replace(coalesce(last_error_value, 'email_send_failed'), '[\r\n]+', ' ', 'g'), 240),
    next_attempt_at = case when retryable_value then next_attempt_at_value else null end,
    status = 'failed'
  where id = outbox_id_value
    and status = 'processing';
end;
$$;

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

create function public.get_admin_order_details(order_id_value uuid)
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

revoke execute on function public.mark_order_email_outbox_sent(uuid, text) from public;
revoke execute on function public.mark_order_email_outbox_sent(uuid, text) from anon;
revoke execute on function public.mark_order_email_outbox_sent(uuid, text) from authenticated;
grant execute on function public.mark_order_email_outbox_sent(uuid, text) to service_role;

revoke execute on function public.mark_order_email_outbox_failed(uuid, text, timestamptz, boolean) from public;
revoke execute on function public.mark_order_email_outbox_failed(uuid, text, timestamptz, boolean) from anon;
revoke execute on function public.mark_order_email_outbox_failed(uuid, text, timestamptz, boolean) from authenticated;
grant execute on function public.mark_order_email_outbox_failed(uuid, text, timestamptz, boolean) to service_role;

revoke execute on function public.get_order_confirmation(text, text) from public;
grant execute on function public.get_order_confirmation(text, text) to anon;
grant execute on function public.get_order_confirmation(text, text) to authenticated;

revoke execute on function public.get_admin_order_details(uuid) from public;
revoke execute on function public.get_admin_order_details(uuid) from anon;
grant execute on function public.get_admin_order_details(uuid) to authenticated;

notify pgrst, 'reload schema';
