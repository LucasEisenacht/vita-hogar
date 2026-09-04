-- Public customer profiles linked to Supabase Auth users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  newsletter_subscribed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, update on table public.profiles to authenticated;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Profiles are editable by owner" on public.profiles;
create policy "Profiles are editable by owner"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Keep updated_at fresh without trusting client-provided timestamps.
create or replace function public.set_profile_updated_at()
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

drop trigger if exists set_profile_updated_at on public.profiles;
create trigger set_profile_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

-- Create a profile automatically when Supabase Auth creates a user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  newsletter_value text;
begin
  newsletter_value := lower(coalesce(new.raw_user_meta_data ->> 'newsletter_subscribed', 'false'));

  insert into public.profiles (
    id,
    first_name,
    last_name,
    phone,
    newsletter_subscribed
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    newsletter_value in ('true', '1', 'yes')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;

revoke execute on function public.set_profile_updated_at() from public;
revoke execute on function public.set_profile_updated_at() from anon;
revoke execute on function public.set_profile_updated_at() from authenticated;
