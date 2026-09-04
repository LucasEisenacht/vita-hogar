-- Catalog tables for the first administrative product workflow.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_empty check (length(btrim(name)) > 0),
  constraint categories_slug_not_empty check (length(btrim(slug)) > 0),
  constraint categories_sort_order_non_negative check (sort_order >= 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price integer not null,
  previous_price integer,
  stock integer not null default 0,
  badge text,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  compatibility text[] not null default '{}',
  colors text[] not null default '{}',
  specifications jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_empty check (length(btrim(name)) > 0),
  constraint products_slug_not_empty check (length(btrim(slug)) > 0),
  constraint products_price_non_negative check (price >= 0),
  constraint products_previous_price_non_negative check (
    previous_price is null or previous_price >= 0
  ),
  constraint products_stock_non_negative check (stock >= 0),
  constraint products_previous_price_greater_than_price check (
    previous_price is null or previous_price > price
  )
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_is_featured_idx on public.products (is_featured);
create index if not exists categories_is_active_idx on public.categories (is_active);

alter table public.categories enable row level security;
alter table public.products enable row level security;

revoke all on table public.categories from public;
revoke all on table public.categories from anon;
revoke all on table public.categories from authenticated;
grant select on table public.categories to anon;
grant select, insert, update on table public.categories to authenticated;

revoke all on table public.products from public;
revoke all on table public.products from anon;
revoke all on table public.products from authenticated;
grant select on table public.products to anon;
grant select, insert, update on table public.products to authenticated;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can read all categories" on public.categories;
create policy "Admins can read all categories"
on public.categories
for select
to authenticated
using ((select public.has_admin_access()));

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check ((select public.has_admin_access()));

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
on public.categories
for update
to authenticated
using ((select public.has_admin_access()))
with check ((select public.has_admin_access()));

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products"
on public.products
for select
to authenticated
using ((select public.has_admin_access()));

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check ((select public.has_admin_access()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using ((select public.has_admin_access()))
with check ((select public.has_admin_access()));

-- Shared timestamp trigger for catalog rows.
create or replace function public.set_catalog_updated_at()
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

drop trigger if exists set_category_updated_at on public.categories;
create trigger set_category_updated_at
before update on public.categories
for each row
execute function public.set_catalog_updated_at();

drop trigger if exists set_product_updated_at on public.products;
create trigger set_product_updated_at
before update on public.products
for each row
execute function public.set_catalog_updated_at();

-- Product audit fields always come from the authenticated user, never from forms.
create or replace function public.set_product_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
  else
    new.created_by = old.created_by;
  end if;

  new.updated_by = (select auth.uid());
  return new;
end;
$$;

drop trigger if exists set_product_audit_fields on public.products;
create trigger set_product_audit_fields
before insert or update on public.products
for each row
execute function public.set_product_audit_fields();

insert into public.categories (name, slug, description, sort_order)
values
  ('Fundas', 'fundas', 'Fundas suaves y modernas para proteger el celular con estilo.', 10),
  ('Audio', 'audio', 'Auriculares y parlantes pensados para acompanar todos los dias.', 20),
  ('Carga', 'carga', 'Cargadores, cables y bases para una rutina mas simple.', 30),
  ('Gaming', 'gaming', 'Accesorios comodos para jugar con una estetica cuidada.', 40),
  ('Smart', 'smart', 'Detalles inteligentes para sumar funcionalidad diaria.', 50)
on conflict (slug) do nothing;

revoke execute on function public.set_catalog_updated_at() from public;
revoke execute on function public.set_catalog_updated_at() from anon;
revoke execute on function public.set_catalog_updated_at() from authenticated;

revoke execute on function public.set_product_audit_fields() from public;
revoke execute on function public.set_product_audit_fields() from anon;
revoke execute on function public.set_product_audit_fields() from authenticated;
