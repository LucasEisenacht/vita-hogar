-- Incremental catalog admin delete permissions. Do not run automatically from the app.

grant delete on table public.products to authenticated;

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select public.has_admin_access()));

-- No catalog categories or products are seeded by infrastructure migrations.
