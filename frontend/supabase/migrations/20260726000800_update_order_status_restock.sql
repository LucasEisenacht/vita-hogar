-- Restores immediate stock once when an order is cancelled.
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
    return jsonb_build_object(
      'success', false,
      'code', 'not_allowed'
    );
  end if;

  if new_status_value not in ('pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled') then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid_status'
    );
  end if;

  select status
  into previous_status_value
  from public.orders
  where id = order_id_value
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'code', 'order_not_found'
    );
  end if;

  if previous_status_value = 'cancelled' and new_status_value <> 'cancelled' then
    return jsonb_build_object(
      'success', false,
      'code', 'cancelled_locked',
      'previousStatus', previous_status_value,
      'status', previous_status_value
    );
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

  if new_status_value = 'cancelled' then
    with restock_lines as (
      select
        order_item.product_id,
        sum(order_item.quantity)::integer as quantity
      from public.order_items as order_item
      where order_item.order_id = order_id_value
        and order_item.product_id is not null
        and order_item.availability_type = 'in_stock'
      group by order_item.product_id
    ),
    restored_items as (
      update public.products as product
      set stock = product.stock + restock_lines.quantity
      from restock_lines
      where restock_lines.product_id = product.id
      returning restock_lines.quantity
    )
    select coalesce(sum(quantity), 0)::integer
    into restored_stock_value
    from restored_items;
  end if;

  update public.orders
  set status = new_status_value
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
    previous_status_value,
    new_status_value,
    (select auth.uid()),
    nullif(left(btrim(coalesce(note_value, '')), 240), '')
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

revoke execute on function public.update_order_status(uuid, text, text) from public;
revoke execute on function public.update_order_status(uuid, text, text) from anon;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
