-- Auth email outbox for account welcome emails.
-- This does not send emails directly from SQL and does not enqueue historical
-- users. It only creates rows for future confirmations.

create extension if not exists pgcrypto;

create table if not exists public.auth_email_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

alter table public.auth_email_outbox
  drop constraint if exists auth_email_outbox_event_type_allowed,
  drop constraint if exists auth_email_outbox_status_allowed,
  drop constraint if exists auth_email_outbox_recipient_not_empty,
  drop constraint if exists auth_email_outbox_attempts_valid,
  drop constraint if exists auth_email_outbox_provider_message_id_length,
  add constraint auth_email_outbox_event_type_allowed check (
    event_type in ('user_welcome')
  ),
  add constraint auth_email_outbox_status_allowed check (
    status in ('pending', 'processing', 'sent', 'failed')
  ),
  add constraint auth_email_outbox_recipient_not_empty check (
    length(btrim(recipient_email)) > 0
  ),
  add constraint auth_email_outbox_attempts_valid check (
    attempts >= 0 and attempts <= 5
  ),
  add constraint auth_email_outbox_provider_message_id_length check (
    provider_message_id is null or length(provider_message_id) <= 200
  );

create unique index if not exists auth_email_outbox_unique_user_event
on public.auth_email_outbox (user_id, event_type);

create index if not exists auth_email_outbox_status_created_at_idx
on public.auth_email_outbox (status, created_at);

create index if not exists auth_email_outbox_status_next_attempt_at_idx
on public.auth_email_outbox (status, next_attempt_at, created_at);

create index if not exists auth_email_outbox_user_id_idx
on public.auth_email_outbox (user_id);

alter table public.auth_email_outbox enable row level security;

revoke all on table public.auth_email_outbox from public;
revoke all on table public.auth_email_outbox from anon;
revoke all on table public.auth_email_outbox from authenticated;
grant select, insert, update on table public.auth_email_outbox to service_role;

create or replace function public.set_auth_email_outbox_updated_at()
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

drop trigger if exists set_auth_email_outbox_updated_at on public.auth_email_outbox;
create trigger set_auth_email_outbox_updated_at
before update on public.auth_email_outbox
for each row
execute function public.set_auth_email_outbox_updated_at();

create or replace function public.enqueue_auth_welcome_email_from_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  first_name_value text;
  full_name_value text;
begin
  if tg_op = 'INSERT' and new.email_confirmed_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (
      old.email_confirmed_at is not null
      or new.email_confirmed_at is null
    ) then
      return new;
    end if;
  end if;

  if new.email is null or length(btrim(new.email)) = 0 then
    return new;
  end if;

  first_name_value := nullif(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  full_name_value := coalesce(
    nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    nullif(btrim(concat_ws(
      ' ',
      nullif(btrim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''),
      nullif(btrim(coalesce(new.raw_user_meta_data->>'last_name', '')), '')
    )), '')
  );

  insert into public.auth_email_outbox (
    user_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    new.id,
    'user_welcome',
    lower(btrim(new.email)),
    jsonb_strip_nulls(jsonb_build_object(
      'eventType', 'user_welcome',
      'userId', new.id,
      'email', lower(btrim(new.email)),
      'firstName', first_name_value,
      'fullName', full_name_value,
      'createdAt', new.created_at,
      'confirmedAt', new.email_confirmed_at
    ))
  )
  on conflict (user_id, event_type) do nothing;

  return new;
end;
$$;

drop trigger if exists enqueue_auth_welcome_email_on_insert on auth.users;
create trigger enqueue_auth_welcome_email_on_insert
after insert on auth.users
for each row
execute function public.enqueue_auth_welcome_email_from_user();

drop trigger if exists enqueue_auth_welcome_email_on_confirmation on auth.users;
create trigger enqueue_auth_welcome_email_on_confirmation
after update of email_confirmed_at on auth.users
for each row
execute function public.enqueue_auth_welcome_email_from_user();

create or replace function public.claim_auth_email_outbox(batch_size integer default 10)
returns setof public.auth_email_outbox
language sql
security definer
set search_path = public
as $$
  with claimed as (
    select id
    from public.auth_email_outbox
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
  update public.auth_email_outbox as outbox
  set
    status = 'processing',
    attempts = outbox.attempts + 1,
    last_error = null,
    next_attempt_at = null
  from claimed
  where claimed.id = outbox.id
  returning outbox.*;
$$;

revoke execute on function public.set_auth_email_outbox_updated_at() from public;
revoke execute on function public.set_auth_email_outbox_updated_at() from anon;
revoke execute on function public.set_auth_email_outbox_updated_at() from authenticated;

revoke execute on function public.enqueue_auth_welcome_email_from_user() from public;
revoke execute on function public.enqueue_auth_welcome_email_from_user() from anon;
revoke execute on function public.enqueue_auth_welcome_email_from_user() from authenticated;

revoke execute on function public.claim_auth_email_outbox(integer) from public;
revoke execute on function public.claim_auth_email_outbox(integer) from anon;
revoke execute on function public.claim_auth_email_outbox(integer) from authenticated;
grant execute on function public.claim_auth_email_outbox(integer) to service_role;

notify pgrst, 'reload schema';
