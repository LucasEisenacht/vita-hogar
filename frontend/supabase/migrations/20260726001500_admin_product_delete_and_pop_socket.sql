-- Incremental catalog admin fixes. Do not run automatically from the app.

grant delete on table public.products to authenticated;

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select public.has_admin_access()));

insert into public.categories (name, slug, description, sort_order)
values (
  'Pop Socket',
  'pop-socket',
  'Soportes y grips para usar el celular con mas comodidad y estilo.',
  60
)
on conflict (slug) do update
set
  description = excluded.description,
  is_active = true,
  name = excluded.name,
  sort_order = excluded.sort_order;
