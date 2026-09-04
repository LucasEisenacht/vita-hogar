-- V1.0 security and administration hardening.
-- Adds audited role management without weakening existing RLS or exposing secrets.

create table if not exists public.admin_role_audit_log (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  previous_role public.app_role,
  new_role public.app_role not null,
  changed_by uuid references auth.users(id) on delete set null,
  action text not null,
  reason text,
  request_ip_hash text,
  created_at timestamptz not null default now(),
  constraint admin_role_audit_action_allowed check (
    action in ('assign', 'promote', 'demote', 'revoke', 'no_change')
  ),
  constraint admin_role_audit_reason_length check (
    reason is null or length(reason) <= 240
  ),
  constraint admin_role_audit_ip_hash_shape check (
    request_ip_hash is null or request_ip_hash ~ '^[0-9a-f]{32}$'
  )
);

create index if not exists admin_role_audit_target_created_at_idx
on public.admin_role_audit_log (target_user_id, created_at desc);

create index if not exists admin_role_audit_changed_by_created_at_idx
on public.admin_role_audit_log (changed_by, created_at desc);

alter table public.admin_role_audit_log enable row level security;

revoke all on table public.admin_role_audit_log from public;
revoke all on table public.admin_role_audit_log from anon;
revoke all on table public.admin_role_audit_log from authenticated;
grant select on table public.admin_role_audit_log to authenticated;

drop policy if exists "Super admins can read role audit log" on public.admin_role_audit_log;
create policy "Super admins can read role audit log"
on public.admin_role_audit_log
for select
to authenticated
using ((select public.has_role('super_admin'::public.app_role)));

create or replace function public.manage_user_role(
  target_user_id_value uuid,
  new_role_value public.app_role,
  reason_value text default null,
  request_ip_hash_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_user_id uuid;
  actor_role public.app_role;
  previous_role_value public.app_role;
  super_admin_count integer;
  action_value text;
  clean_reason text;
  clean_request_ip_hash text;
begin
  actor_user_id := (select auth.uid());

  if actor_user_id is null then
    return jsonb_build_object('success', false, 'code', 'not_authenticated');
  end if;

  select role
  into actor_role
  from public.user_roles
  where user_id = actor_user_id;

  actor_role := coalesce(actor_role, 'customer'::public.app_role);

  if actor_role <> 'super_admin'::public.app_role then
    return jsonb_build_object('success', false, 'code', 'not_allowed');
  end if;

  if target_user_id_value is null then
    return jsonb_build_object('success', false, 'code', 'invalid_user');
  end if;

  if not exists (
    select 1
    from auth.users
    where id = target_user_id_value
  ) then
    return jsonb_build_object('success', false, 'code', 'user_not_found');
  end if;

  select role
  into previous_role_value
  from public.user_roles
  where user_id = target_user_id_value
  for update;

  previous_role_value := coalesce(previous_role_value, 'customer'::public.app_role);

  if previous_role_value = new_role_value then
    clean_reason := nullif(left(btrim(coalesce(reason_value, '')), 240), '');
    clean_request_ip_hash := nullif(left(btrim(coalesce(request_ip_hash_value, '')), 32), '');

    insert into public.admin_role_audit_log (
      target_user_id,
      previous_role,
      new_role,
      changed_by,
      action,
      reason,
      request_ip_hash
    )
    values (
      target_user_id_value,
      previous_role_value,
      new_role_value,
      actor_user_id,
      'no_change',
      clean_reason,
      clean_request_ip_hash
    );

    return jsonb_build_object(
      'success', true,
      'changed', false,
      'code', 'no_change',
      'previousRole', previous_role_value,
      'newRole', new_role_value
    );
  end if;

  if previous_role_value = 'super_admin'::public.app_role
    and new_role_value <> 'super_admin'::public.app_role then
    select count(*)
    into super_admin_count
    from public.user_roles
    where role = 'super_admin'::public.app_role;

    if super_admin_count <= 1 then
      return jsonb_build_object(
        'success', false,
        'code', 'last_super_admin'
      );
    end if;
  end if;

  action_value := case
    when previous_role_value = 'customer'::public.app_role
      and new_role_value <> 'customer'::public.app_role then 'assign'
    when new_role_value = 'customer'::public.app_role then 'revoke'
    when array_position(enum_range(null::public.app_role), new_role_value)
      > array_position(enum_range(null::public.app_role), previous_role_value) then 'promote'
    else 'demote'
  end;
  clean_reason := nullif(left(btrim(coalesce(reason_value, '')), 240), '');
  clean_request_ip_hash := nullif(left(btrim(coalesce(request_ip_hash_value, '')), 32), '');

  insert into public.user_roles (
    user_id,
    role
  )
  values (
    target_user_id_value,
    new_role_value
  )
  on conflict (user_id) do update
  set role = excluded.role;

  insert into public.admin_role_audit_log (
    target_user_id,
    previous_role,
    new_role,
    changed_by,
    action,
    reason,
    request_ip_hash
  )
  values (
    target_user_id_value,
    previous_role_value,
    new_role_value,
    actor_user_id,
    action_value,
    clean_reason,
    clean_request_ip_hash
  );

  return jsonb_build_object(
    'success', true,
    'changed', true,
    'code', 'updated',
    'previousRole', previous_role_value,
    'newRole', new_role_value,
    'action', action_value
  );
end;
$$;

revoke execute on function public.manage_user_role(uuid, public.app_role, text, text) from public;
revoke execute on function public.manage_user_role(uuid, public.app_role, text, text) from anon;
grant execute on function public.manage_user_role(uuid, public.app_role, text, text) to authenticated;

-- Keep direct order reads limited to customer/admin-safe columns.
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

create or replace view public.customer_orders_safe
with (security_invoker = true)
as
select
  id,
  user_id,
  order_number,
  status,
  payment_status,
  payment_method,
  delivery_method,
  shipping_address,
  shipping_cost,
  shipping_cost_status,
  subtotal,
  total,
  currency,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  customer_dni,
  customer_notes,
  created_at,
  updated_at,
  paid_at,
  shipped_at,
  delivered_at,
  cancelled_at
from public.orders;

create or replace view public.customer_order_status_history_safe
with (security_invoker = true)
as
select
  id,
  order_id,
  previous_status,
  new_status,
  public_note,
  created_at
from public.order_status_history;

revoke all on table public.customer_orders_safe from public;
revoke all on table public.customer_orders_safe from anon;
grant select on table public.customer_orders_safe to authenticated;

revoke all on table public.customer_order_status_history_safe from public;
revoke all on table public.customer_order_status_history_safe from anon;
grant select on table public.customer_order_status_history_safe to authenticated;

notify pgrst, 'reload schema';
