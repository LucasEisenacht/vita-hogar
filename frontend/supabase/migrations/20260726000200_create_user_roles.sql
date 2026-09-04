-- Secure application roles for W.todocell staff access.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'customer',
      'employee',
      'admin',
      'super_admin'
    );
  end if;
end;
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

revoke all on table public.user_roles from public;
revoke all on table public.user_roles from anon;
revoke all on table public.user_roles from authenticated;
grant select on table public.user_roles to authenticated;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Keep role timestamps fresh without allowing clients to set updated_at.
create or replace function public.set_user_role_updated_at()
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

drop trigger if exists set_user_role_updated_at on public.user_roles;
create trigger set_user_role_updated_at
before update on public.user_roles
for each row
execute function public.set_user_role_updated_at();

-- Create a profile and a default customer role when Supabase Auth creates a user.
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

  insert into public.user_roles (
    user_id,
    role
  )
  values (
    new.id,
    'customer'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Returns true only when the current authenticated user has the requested role.
create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = required_role
    ),
    false
  );
$$;

-- Returns true for staff roles that may access the administrative panel.
create or replace function public.has_admin_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role in ('employee', 'admin', 'super_admin')
    ),
    false
  );
$$;

revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;

revoke execute on function public.set_user_role_updated_at() from public;
revoke execute on function public.set_user_role_updated_at() from anon;
revoke execute on function public.set_user_role_updated_at() from authenticated;

revoke execute on function public.has_role(public.app_role) from public;
revoke execute on function public.has_role(public.app_role) from anon;
grant execute on function public.has_role(public.app_role) to authenticated;

revoke execute on function public.has_admin_access() from public;
revoke execute on function public.has_admin_access() from anon;
grant execute on function public.has_admin_access() to authenticated;
