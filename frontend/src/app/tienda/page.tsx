import type { Metadata } from "next";
import {
  getCatalogEditorialExperience,
} from "@/config/catalog-editorial";
import {
  getNavigationCategories,
  getPlannedNavigationCategoryBySlug,
} from "@/config/catalog-navigation";
import {
  getPublicCategories,
  getPublicProducts,
  normalizeProductAvailabilityFilter,
  normalizeProductConditionFilter,
  normalizeProductSort,
} from "@/lib/catalog/queries";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { CategoryEditorialHero } from "@/components/shop/category-editorial-hero";
import { EmptyCatalog } from "@/components/shop/empty-catalog";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { Container } from "@/components/ui/container";
import { EditorialProductGrid } from "@/components/shop/editorial-product-grid";

export const metadata: Metadata = {
  ...createPublicMetadata({
    description:
      "Objetos y textiles seleccionados para habitar mejor.",
    path: "/tienda",
    title: "Tienda | VITA HOGAR",
  }),
};

type ShopPageProps = {
  searchParams: Promise<{
    categoria?: string;
    condicion?: string;
    disponibilidad?: string;
    orden?: string;
  }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { categoria, condicion, disponibilidad, orden } = await searchParams;
  const sort = normalizeProductSort(orden);
  const availability = normalizeProductAvailabilityFilter(disponibilidad);
  const condition = normalizeProductConditionFilter(condicion);
  const [categories, favoriteProductIds] = await Promise.all([
    getPublicCategories(),
    getCurrentUserFavoriteIds(),
  ]);
  const navigationCategories = getNavigationCategories(categories);
  const selectedCategory =
    navigationCategories.find((category) => category.slug === categoria) ??
    (categoria ? getPlannedNavigationCategoryBySlug(categoria) : null);
  const editorialExperience = getCatalogEditorialExperience(
    selectedCategory?.slug,
  );
  const products = await getPublicProducts({
    availability,
    categorySlug: selectedCategory?.slug,
    condition,
    sort,
  });

  return (
    <StorefrontPageShell>
      <CategoryEditorialHero
        activeChipHref={
          selectedCategory ? `/tienda/${selectedCategory.slug}` : "/tienda"
        }
        experience={editorialExperience}
      />

      <div id="catalog-products">
        <Container className="relative space-y-3.5 pb-14 sm:space-y-9 sm:pb-20">
          <ShopToolbar
            actionPath="/tienda"
            availability={availability}
            categorySlug={selectedCategory?.slug}
            condition={condition}
            preserveCategoryQuery
            resultCount={products.length}
            sort={sort}
          />
          <div className="pt-0 sm:pt-2">
            {products.length > 0 ? (
              <EditorialProductGrid
                editorialBlock={editorialExperience.editorialBlock}
                favoriteProductIds={favoriteProductIds}
                products={products}
              />
            ) : (
              <EmptyCatalog
                actionHref="/tienda"
                actionLabel={
                  availability || condition || sort !== "featured"
                    ? "Limpiar filtros"
                    : "Explorar otras categorias"
                }
                message={
                  selectedCategory
                    ? `No hay productos publicados en ${selectedCategory.name.toLowerCase()} todavia.`
                    : "Todavia no hay productos activos para mostrar en esta seleccion."
                }
                title={
                  selectedCategory
                    ? `Estamos preparando ${selectedCategory.name}`
                    : "Estamos preparando la coleccion"
                }
              >
                {availability || condition || sort !== "featured" ? (
                  <p className="rounded-full bg-secondary/70 px-4 py-2 text-xs font-semibold text-primary-hover">
                    Hay filtros activos en esta seleccion.
                  </p>
                ) : null}
              </EmptyCatalog>
            )}
          </div>
        </Container>
      </div>
    </StorefrontPageShell>
  );
}
