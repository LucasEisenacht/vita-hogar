-- Customer favorites linked to authenticated users and public products.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists favorites_user_id_idx
on public.favorites (user_id);

create index if not exists favorites_product_id_idx
on public.favorites (product_id);

create index if not exists favorites_user_created_at_idx
on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

revoke all on table public.favorites from public;
revoke all on table public.favorites from anon;
revoke all on table public.favorites from authenticated;
grant select, insert, delete on table public.favorites to authenticated;

drop policy if exists "Users can read their own favorites" on public.favorites;
create policy "Users can read their own favorites"
on public.favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own favorites" on public.favorites;
create policy "Users can insert their own favorites"
on public.favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
on public.favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);
