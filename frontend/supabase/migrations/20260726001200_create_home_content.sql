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

insert into public.home_content (key, content, is_active)
values (
  'home',
  '{
    "hero": {
      "badge": "Nuevo en W.todocell",
      "desktopImageUrl": "",
      "isActive": true,
      "mobileImageUrl": "",
      "primaryCtaHref": "/tienda",
      "primaryCtaLabel": "Comprar ahora",
      "secondaryCtaHref": "/tienda",
      "secondaryCtaLabel": "Ver coleccion",
      "subtitle": "Tecnologia elegida con una mirada suave, moderna y personal.",
      "title": "Accesorios que combinan con tu estilo."
    },
    "featuredCategories": {
      "items": [
        {
          "description": "Fundas seleccionadas para proteger y acompanar tu estilo.",
          "isActive": true,
          "name": "Fundas",
          "order": 1,
          "slug": "fundas"
        },
        {
          "description": "Accesorios de tecnologia para uso cotidiano.",
          "isActive": true,
          "name": "Accesorios",
          "order": 2,
          "slug": "accesorios"
        },
        {
          "description": "Combos preparados como productos comunes del catalogo.",
          "isActive": true,
          "name": "Combos",
          "order": 3,
          "slug": "combos"
        },
        {
          "description": "Celulares nuevos, usados y reacondicionados seleccionados.",
          "isActive": true,
          "name": "Celulares",
          "order": 4,
          "slug": "celulares"
        },
        {
          "description": "Consolas y tecnologia para entretenimiento.",
          "isActive": true,
          "name": "Consolas",
          "order": 5,
          "slug": "consolas"
        }
      ],
      "subtitle": "Accesorios pensados para acompanarte todos los dias.",
      "title": "Encontra tu estilo"
    },
    "featuredProducts": {
      "ctaHref": "/tienda",
      "ctaLabel": "Ver todos",
      "isActive": true,
      "limit": 6,
      "sort": "featured",
      "subtitle": "Productos marcados como destacados desde el panel.",
      "title": "Productos destacados"
    },
    "benefits": {
      "items": [
        {
          "description": "Seleccionamos cada producto pensando en diseno, calidad y uso cotidiano.",
          "icon": "sparkle",
          "isActive": true,
          "order": 1,
          "title": "Elegidos con criterio"
        },
        {
          "description": "Cada pedido se arma con atencion en cada detalle.",
          "icon": "care",
          "isActive": true,
          "order": 2,
          "title": "Preparados con cuidado"
        },
        {
          "description": "Recibi tus productos estes donde estes.",
          "icon": "send",
          "isActive": true,
          "order": 3,
          "title": "Envios a todo el pais"
        }
      ],
      "title": "Comprar en W.todocell"
    },
    "instagram": {
      "buttonHref": "https://www.instagram.com/w.todocell/",
      "buttonLabel": "Ir a @w.todocell",
      "isActive": true,
      "text": "Descubri nuevos ingresos, ideas y accesorios en @w.todocell.",
      "title": "Seguinos en Instagram",
      "username": "@w.todocell"
    }
  }'::jsonb,
  true
)
on conflict (key) do nothing;

grant execute on function public.has_admin_access() to authenticated;

revoke execute on function public.set_home_content_updated_at() from public;
revoke execute on function public.set_home_content_updated_at() from anon;
revoke execute on function public.set_home_content_updated_at() from authenticated;
