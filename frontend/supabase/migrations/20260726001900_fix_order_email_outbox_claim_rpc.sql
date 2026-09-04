-- Restore the exact RPC signature used by the Next.js email outbox processor.

do $$
begin
  if to_regclass('public.order_email_outbox') is null then
    raise exception 'missing_table_public_order_email_outbox';
  end if;
end;
$$;

drop function if exists public.claim_order_email_outbox(integer);

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

revoke execute on function public.claim_order_email_outbox(integer) from public;
revoke execute on function public.claim_order_email_outbox(integer) from anon;
revoke execute on function public.claim_order_email_outbox(integer) from authenticated;
grant execute on function public.claim_order_email_outbox(integer) to service_role;

notify pgrst, 'reload schema';
