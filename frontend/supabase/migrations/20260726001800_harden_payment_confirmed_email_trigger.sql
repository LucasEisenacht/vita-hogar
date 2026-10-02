-- Harden payment confirmation email enqueueing without changing historical migrations.

create or replace function public.enqueue_payment_confirmed_email()
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

drop trigger if exists enqueue_payment_confirmed_email on public.orders;
create trigger enqueue_payment_confirmed_email
after update of status, payment_status, paid_at on public.orders
for each row
execute function public.enqueue_payment_confirmed_email();

revoke execute on function public.enqueue_payment_confirmed_email() from public;
revoke execute on function public.enqueue_payment_confirmed_email() from anon;
revoke execute on function public.enqueue_payment_confirmed_email() from authenticated;
