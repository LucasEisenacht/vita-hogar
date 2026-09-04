import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { DeleteProductButton } from "@/components/admin/products/delete-product-button";
import { ProductImageManager } from "@/components/admin/products/images/product-image-manager";
import { ProductForm } from "@/components/admin/products/product-form";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteProduct,
  duplicateProduct,
  updateProduct,
} from "@/lib/admin/catalog/actions";
import { getProductImages } from "@/lib/admin/catalog/images/queries";
import {
  getActiveCategories,
  getAdminProductById,
} from "@/lib/admin/catalog/queries";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import Link from "next/link";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

function getStatusMessage(status?: string | string[]) {
  if (status === "created") {
    return "Producto creado correctamente con sus imagenes.";
  }

  if (status === "created-image-error") {
    return "El producto fue creado, pero algunas imagenes no pudieron subirse. Reintentalo desde el gestor de imagenes.";
  }

  if (status === "duplicated") {
    return "Producto duplicado correctamente. La copia quedo oculta.";
  }

  return null;
}

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const { id } = await params;
  const [{ role, user }, categories, product, queryParams] = await Promise.all([
    requireAdmin(),
    getActiveCategories(),
    getAdminProductById(id),
    searchParams,
  ]);

  if (!product) {
    notFound();
  }

  const images = await getProductImages(product.id);

  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const productAction = updateProduct.bind(null, product.id);
  const deleteAction = deleteProduct.bind(null, product.id);
  const statusMessage = getStatusMessage(queryParams?.status);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Editar producto"
        roleLabel={getRoleLabel(role)}
        subtitle="Modifica la informacion del producto sin alterar su auditoria de creacion."
        title={product.name}
        userName={userName}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          className={buttonStyles({
            className: "w-full sm:w-auto",
            size: "sm",
            variant: "secondary",
          })}
          href={`/admin/productos/${product.id}/preview`}
        >
          Vista previa
        </Link>
        <form action={duplicateProduct.bind(null, product.id)}>
          <button
            className={buttonStyles({
              className: "w-full sm:w-auto",
              size: "sm",
              variant: "secondary",
            })}
            type="submit"
          >
            Duplicar producto
          </button>
        </form>
        <DeleteProductButton
          action={deleteAction}
          productName={product.name}
        />
      </div>

      {statusMessage ? (
        <div
          className="rounded-[24px] border border-success/25 bg-[#edf5ef] px-5 py-4 text-sm font-semibold text-[#4f765a]"
          role="status"
        >
          {statusMessage}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-7 lg:p-8">
          <ProductForm
            action={productAction}
            categories={categories}
            existingImages={images}
            product={product}
            submitLabel="Guardar cambios"
          />
        </CardContent>
      </Card>

      <ProductImageManager
        images={images}
        productColors={product.colors}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
