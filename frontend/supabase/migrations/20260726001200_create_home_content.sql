-- CMS content for the public Home page. Stores one typed JSON document per key.
create table if not exists public.home_content (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_content_key_not_empty check (length(btrim(key)) > 0),
  constraint home_content_content_is_object check (jsonb_typeof(content) = 'object')
);

create unique index if not exists home_content_key_key
on public.home_content (key);

create index if not exists home_content_active_key_idx
on public.home_content (key, is_active);

alter table public.home_content enable row level security;

revoke all on table public.home_content from public;
revoke all on table public.home_content from anon;
revoke all on table public.home_content from authenticated;
grant select on table public.home_content to anon;
grant select, insert, update on table public.home_content to authenticated;

drop policy if exists "Public can read active home content" on public.home_content;
create policy "Public can read active home content"
on public.home_content
for select
to anon, authenticated
using (
  key = 'home'
  and is_active = true
);

drop policy if exists "Admins can read all home content" on public.home_content;
create policy "Admins can read all home content"
on public.home_content
for select
to authenticated
using ((select public.has_admin_access()));

drop policy if exists "Admins can insert home content" on public.home_content;
create policy "Admins can insert home content"
on public.home_content
for insert
to authenticated
with check ((select public.has_admin_access()));

drop policy if exists "Admins can update home content" on public.home_content;
create policy "Admins can update home content"
on public.home_content
for update
to authenticated
using ((select public.has_admin_access()))
with check ((select public.has_admin_access()));

create or replace function public.set_home_content_updated_at()
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

drop trigger if exists set_home_content_updated_at on public.home_content;
create trigger set_home_content_updated_at
before update on public.home_content
for each row
execute function public.set_home_content_updated_at();

-- The Home row is intentionally not seeded. Its real content is loaded after
-- VITA HOGAR defines its commercial copy, links and imagery.
grant execute on function public.has_admin_access() to authenticated;

revoke execute on function public.set_home_content_updated_at() from public;
revoke execute on function public.set_home_content_updated_at() from anon;
revoke execute on function public.set_home_content_updated_at() from authenticated;
