import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductAdminFilters } from "@/components/admin/products/product-admin-filters";
import { ProductList } from "@/components/admin/products/product-list";
import { ProductPagination } from "@/components/admin/products/product-pagination";
import { ProductSummaryCards } from "@/components/admin/products/product-summary-cards";
import { buttonStyles } from "@/components/ui/button";
import {
  getActiveCategories,
  getAdminProducts,
  normalizeAdminProductPage,
  normalizeAdminProductStatusFilter,
  normalizeAdminProductStockFilter,
  normalizeAdminProductTextFilter,
} from "@/lib/admin/catalog/queries";
import {
  normalizeProductAvailabilityFilter,
  normalizeProductConditionFilter,
} from "@/lib/catalog/queries";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";

type AdminProductsPageProps = {
  searchParams?: Promise<{
    categoria?: string | string[];
    condicion?: string | string[];
    disponibilidad?: string | string[];
    estado?: string | string[];
    pagina?: string | string[];
    q?: string | string[];
    status?: string | string[];
    stock?: string | string[];
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
    return "Producto creado correctamente.";
  }

  if (status === "updated") {
    return "Producto actualizado correctamente.";
  }

  if (status === "duplicated") {
    return "Producto duplicado correctamente. La copia quedo oculta.";
  }

  if (status === "deleted") {
    return "Producto eliminado correctamente.";
  }

  return null;
}

function getFirstParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function createPaginationParams(params?: Awaited<AdminProductsPageProps["searchParams"]>) {
  const searchParams = new URLSearchParams();
  const entries: Array<[string, string | undefined]> = [
    ["q", getFirstParamValue(params?.q)],
    ["categoria", getFirstParamValue(params?.categoria)],
    ["condicion", getFirstParamValue(params?.condicion)],
    ["disponibilidad", getFirstParamValue(params?.disponibilidad)],
    ["estado", getFirstParamValue(params?.estado)],
    ["stock", getFirstParamValue(params?.stock)],
  ];

  entries.forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const [{ role, user }, categories, params] = await Promise.all([
    requireAdmin(),
    getActiveCategories(),
    searchParams,
  ]);
  const query = normalizeAdminProductTextFilter(params?.q);
  const categorySlug = normalizeAdminProductTextFilter(params?.categoria);
  const condition = normalizeProductConditionFilter(
    getFirstParamValue(params?.condicion),
  );
  const availability = normalizeProductAvailabilityFilter(
    getFirstParamValue(params?.disponibilidad),
  );
  const status = normalizeAdminProductStatusFilter(params?.estado);
  const stock = normalizeAdminProductStockFilter(params?.stock);
  const productResult = await getAdminProducts({
    availability,
    categorySlug,
    condition,
    page: normalizeAdminProductPage(params?.pagina),
    query,
    status,
    stock,
  });
  const products = productResult.products;
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const activeCount = products.filter((product) => product.is_active).length;
  const featuredCount = products.filter((product) => product.is_featured).length;
  const outOfStockCount = products.filter(
    (product) => product.availability_type === "in_stock" && product.stock === 0,
  ).length;
  const statusMessage = getStatusMessage(params?.status);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Catalogo"
        roleLabel={getRoleLabel(role)}
        subtitle="Desde aca vas a poder cargar, editar y organizar el catalogo de W.todocell."
        title="Productos"
        userName={userName}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Listado administrativo
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Administra el catalogo, stock e imagenes.
          </p>
        </div>
        <Link
          className={buttonStyles({
            className: "w-full sm:w-auto",
            size: "lg",
            variant: "primary",
          })}
          href="/admin/productos/nuevo"
        >
          + Nuevo producto
        </Link>
      </div>

      {statusMessage ? (
        <div
          className="rounded-[24px] border border-success/25 bg-[#edf5ef] px-5 py-4 text-sm font-semibold text-[#4f765a]"
          role="status"
        >
          {statusMessage}
        </div>
      ) : null}

      <ProductSummaryCards
        activeCount={activeCount}
        featuredCount={featuredCount}
        outOfStockCount={outOfStockCount}
        totalCount={productResult.totalCount}
      />

      <ProductAdminFilters
        availability={availability}
        categories={categories}
        categorySlug={categorySlug}
        condition={condition}
        query={query}
        status={status}
        stock={stock}
      />

      <ProductList products={products} />

      <ProductPagination
        page={productResult.page}
        params={createPaginationParams(params)}
        totalCount={productResult.totalCount}
        totalPages={productResult.totalPages}
      />
    </div>
  );
}
