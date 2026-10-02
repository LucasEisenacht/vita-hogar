import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { updateCategory } from "@/lib/admin/categories/actions";
import { getAdminCategoryById } from "@/lib/admin/categories/queries";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = createNoIndexMetadata({
  description: "Edicion de categoria del catalogo de VITA HOGAR.",
  title: "Editar categoria | VITA HOGAR Admin",
});

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const [{ role, user }, category] = await Promise.all([
    requireAdmin(),
    getAdminCategoryById(id),
  ]);

  if (!category) {
    notFound();
  }

  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo VITA HOGAR";
  const action = updateCategory.bind(null, category.id);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Editar categoria"
        roleLabel={getRoleLabel(role)}
        subtitle="Actualiza nombre, URL, descripcion, orden y visibilidad sin afectar los productos asignados."
        title={category.name}
        userName={userName}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={category.is_active ? "stock" : "neutral"}>
          {category.is_active ? "Activa" : "Inactiva"}
        </Badge>
        <Badge variant="neutral">
          {category.productCount} {category.productCount === 1 ? "producto" : "productos"}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-7 lg:p-8">
          <CategoryForm
            action={action}
            category={category}
            submitLabel="Guardar cambios"
          />
        </CardContent>
      </Card>
    </div>
  );
}
