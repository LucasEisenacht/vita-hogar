import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { Card, CardContent } from "@/components/ui/card";
import { createCategory } from "@/lib/admin/categories/actions";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  description: "Alta de categoria del catalogo de VITA HOGAR.",
  title: "Nueva categoria | VITA HOGAR Admin",
});

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function NewCategoryPage() {
  const { role, user } = await requireAdmin();
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo VITA HOGAR";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Nueva categoria"
        roleLabel={getRoleLabel(role)}
        subtitle="Crea una categoria real para organizar el catalogo y habilitar la carga de productos."
        title="Agregar categoria"
        userName={userName}
      />
      <Card>
        <CardContent className="p-5 sm:p-7 lg:p-8">
          <CategoryForm
            action={createCategory}
            submitLabel="Crear categoria"
          />
        </CardContent>
      </Card>
    </div>
  );
}
