-- Customer account V1.0: editable profiles and saved addresses.
-- Additive migration. Does not recreate or delete existing data.

alter table public.profiles
  add column if not exists birth_date date;

comment on column public.profiles.birth_date is
  'Optional customer birth date, editable only by the profile owner.';

grant insert on table public.profiles to authenticated;

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  street text not null,
  street_number text not null,
  floor_apartment text,
  locality text not null,
  municipality text,
  province text not null,
  postal_code text not null,
  reference text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_addresses_label_not_empty check (length(btrim(label)) > 0),
  constraint user_addresses_label_length check (length(label) <= 40),
  constraint user_addresses_recipient_not_empty check (length(btrim(recipient_name)) > 0),
  constraint user_addresses_recipient_length check (length(recipient_name) <= 120),
  constraint user_addresses_phone_not_empty check (length(btrim(phone)) > 0),
  constraint user_addresses_phone_length check (length(phone) <= 60),
  constraint user_addresses_street_not_empty check (length(btrim(street)) > 0),
  constraint user_addresses_street_length check (length(street) <= 120),
  constraint user_addresses_street_number_not_empty check (length(btrim(street_number)) > 0),
  constraint user_addresses_street_number_length check (length(street_number) <= 40),
  constraint user_addresses_floor_length check (floor_apartment is null or length(floor_apartment) <= 80),
  constraint user_addresses_locality_not_empty check (length(btrim(locality)) > 0),
  constraint user_addresses_locality_length check (length(locality) <= 120),
  constraint user_addresses_municipality_length check (municipality is null or length(municipality) <= 120),
  constraint user_addresses_province_not_empty check (length(btrim(province)) > 0),
  constraint user_addresses_province_length check (length(province) <= 120),
  constraint user_addresses_postal_code_not_empty check (length(btrim(postal_code)) > 0),
  constraint user_addresses_postal_code_length check (length(postal_code) <= 24),
  constraint user_addresses_reference_length check (reference is null or length(reference) <= 240)
);

comment on table public.user_addresses is
  'Saved shipping addresses owned by authenticated customers.';

create index if not exists user_addresses_user_created_at_idx
on public.user_addresses (user_id, created_at desc);

create unique index if not exists user_addresses_one_default_per_user_idx
on public.user_addresses (user_id)
where is_default;

alter table public.user_addresses enable row level security;

revoke all on table public.user_addresses from public;
revoke all on table public.user_addresses from anon;
revoke all on table public.user_addresses from authenticated;
grant select, insert, update, delete on table public.user_addresses to authenticated;

drop policy if exists "Users can read their own addresses" on public.user_addresses;
create policy "Users can read their own addresses"
on public.user_addresses
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own addresses" on public.user_addresses;
create policy "Users can insert their own addresses"
on public.user_addresses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own addresses" on public.user_addresses;
create policy "Users can update their own addresses"
on public.user_addresses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own addresses" on public.user_addresses;
create policy "Users can delete their own addresses"
on public.user_addresses
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.prepare_user_address_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  address_count integer;
begin
  new.updated_at = now();

  if tg_op = 'INSERT' then
    select count(*)
    into address_count
    from public.user_addresses
    where user_id = new.user_id;

    if address_count >= 10 then
      raise exception 'address_limit_reached';
    end if;

    if address_count = 0 then
      new.is_default = true;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sync_user_address_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.is_default then
    update public.user_addresses
    set is_default = false
    where user_id = new.user_id
      and id <> new.id
      and is_default;
  end if;

  if tg_op = 'DELETE' and old.is_default then
    update public.user_addresses
    set is_default = true
    where id = (
      select address.id
      from public.user_addresses as address
      where address.user_id = old.user_id
      order by address.updated_at desc, address.created_at desc
      limit 1
    );
  end if;

  return null;
end;
$$;

drop trigger if exists prepare_user_address_write on public.user_addresses;
create trigger prepare_user_address_write
before insert or update on public.user_addresses
for each row
execute function public.prepare_user_address_write();

drop trigger if exists sync_user_address_default_after_write on public.user_addresses;
create trigger sync_user_address_default_after_write
after insert or update on public.user_addresses
for each row
execute function public.sync_user_address_default();

drop trigger if exists sync_user_address_default_after_delete on public.user_addresses;
create trigger sync_user_address_default_after_delete
after delete on public.user_addresses
for each row
execute function public.sync_user_address_default();

revoke execute on function public.prepare_user_address_write() from public;
revoke execute on function public.prepare_user_address_write() from anon;
revoke execute on function public.prepare_user_address_write() from authenticated;

revoke execute on function public.sync_user_address_default() from public;
revoke execute on function public.sync_user_address_default() from anon;
revoke execute on function public.sync_user_address_default() from authenticated;

notify pgrst, 'reload schema';
