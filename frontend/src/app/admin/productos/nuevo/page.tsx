import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/products/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { createProduct } from "@/lib/admin/catalog/actions";
import { getActiveCategories } from "@/lib/admin/catalog/queries";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function NewProductPage() {
  const [{ role, user }, categories] = await Promise.all([
    requireAdmin(),
    getActiveCategories(),
  ]);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Nuevo producto"
        roleLabel={getRoleLabel(role)}
        subtitle="Carga fotos, datos comerciales y modelos disponibles en un flujo guiado."
        title="Agregar producto"
        userName={userName}
      />

      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-7 lg:p-8">
          <ProductForm
            action={createProduct}
            categories={categories}
            submitLabel="Crear producto"
          />
        </CardContent>
      </Card>
    </div>
  );
}
