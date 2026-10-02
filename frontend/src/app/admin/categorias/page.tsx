import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoryList } from "@/components/admin/categories/category-list";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminCategories } from "@/lib/admin/categories/queries";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

type AdminCategoriesPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

export const metadata: Metadata = createNoIndexMetadata({
  description: "Gestion de categorias del catalogo de VITA HOGAR.",
  title: "Categorias | VITA HOGAR Admin",
});

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

function getStatusMessage(status?: string | string[]) {
  if (status === "created") return "Categoria creada correctamente.";
  if (status === "updated") return "Categoria actualizada correctamente.";
  if (status === "activated") return "Categoria activada correctamente.";
  if (status === "deactivated") return "Categoria desactivada correctamente.";
  if (status === "error") return "No pudimos actualizar la categoria.";

  return null;
}

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const [{ role, user }, categories, params] = await Promise.all([
    requireAdmin(),
    getAdminCategories(),
    searchParams,
  ]);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo VITA HOGAR";
  const activeCount = categories.filter((category) => category.is_active).length;
  const productCount = categories.reduce(
    (total, category) => total + category.productCount,
    0,
  );
  const statusMessage = getStatusMessage(params?.status);
  const isError = params?.status === "error";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Catalogo"
        roleLabel={getRoleLabel(role)}
        subtitle="Organiza las categorias que se usan en la tienda y en la carga de productos."
        title="Categorias"
        userName={userName}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Listado administrativo
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Las categorias inactivas se conservan, pero no aparecen en el catalogo publico.
          </p>
        </div>
        <Link
          className={buttonStyles({
            className: "w-full sm:w-auto",
            size: "lg",
            variant: "primary",
          })}
          href="/admin/categorias/nueva"
        >
          + Nueva categoria
        </Link>
      </div>

      {statusMessage ? (
        <div
          className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${
            isError
              ? "border-destructive/25 bg-destructive/10 text-destructive"
              : "border-success/25 bg-[#edf5ef] text-[#4f765a]"
          }`}
          role="status"
        >
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total", categories.length],
          ["Activas", activeCount],
          ["Productos asignados", productCount],
        ].map(([label, value]) => (
          <Card className="bg-surface/95" key={label}>
            <CardContent className="space-y-3 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </p>
              <p className="font-display text-3xl font-semibold text-foreground">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <CategoryList categories={categories} />
    </div>
  );
}
