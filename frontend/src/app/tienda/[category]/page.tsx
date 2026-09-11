import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogEditorialExperience } from "@/config/catalog-editorial";
import {
  getPlannedNavigationCategoryBySlug,
} from "@/config/catalog-navigation";
import {
  getPublicCategoryBySlug,
  getPublicProductsByCategory,
  normalizeProductAvailabilityFilter,
  normalizeProductConditionFilter,
  normalizeProductSort,
} from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { CategoryEditorialHero } from "@/components/shop/category-editorial-hero";
import { EditorialProductGrid } from "@/components/shop/editorial-product-grid";
import { EmptyCatalog } from "@/components/shop/empty-catalog";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { Container } from "@/components/ui/container";
import { createPublicMetadata } from "@/lib/seo/metadata";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    condicion?: string;
    disponibilidad?: string;
    orden?: string;
  }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const activeCategory = await getPublicCategoryBySlug(category);
  const editorialExperience = getCatalogEditorialExperience(category);

  if (!activeCategory) {
    const plannedCategory = getPlannedNavigationCategoryBySlug(category);

    if (plannedCategory) {
      return createPublicMetadata({
        description:
          editorialExperience.description || plannedCategory.description,
        path: `/tienda/${plannedCategory.slug}`,
        title: `${editorialExperience.breadcrumbLabel} | VITA HOGAR`,
      });
    }

    return {
      title: "Categoria no encontrada | VITA HOGAR",
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  return createPublicMetadata({
    description:
      editorialExperience.description ||
      activeCategory.description ||
      `Productos de ${activeCategory.name} seleccionados por VITA HOGAR.`,
    path: `/tienda/${activeCategory.slug}`,
    title: `${editorialExperience.breadcrumbLabel} | VITA HOGAR`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ category }, { condicion, disponibilidad, orden }] =
    await Promise.all([params, searchParams]);
  const activeCategory =
    (await getPublicCategoryBySlug(category)) ??
    getPlannedNavigationCategoryBySlug(category);

  if (!activeCategory) {
    notFound();
  }

  const editorialExperience = getCatalogEditorialExperience(activeCategory.slug);
  const sort = normalizeProductSort(orden);
  const availability = normalizeProductAvailabilityFilter(disponibilidad);
  const condition = normalizeProductConditionFilter(condicion);
  const [products, favoriteProductIds] = await Promise.all([
    getPublicProductsByCategory(activeCategory.slug, {
      availability,
      condition,
      sort,
    }),
    getCurrentUserFavoriteIds(),
  ]);

  return (
    <StorefrontPageShell>
      <CategoryEditorialHero
        activeChipHref={`/tienda/${activeCategory.slug}`}
        experience={editorialExperience}
      />

      <div id="catalog-products">
        <Container className="relative space-y-3.5 pb-14 sm:space-y-9 sm:pb-20">
          <ShopToolbar
            actionPath={`/tienda/${activeCategory.slug}`}
            availability={availability}
            categorySlug={activeCategory.slug}
            condition={condition}
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
                actionHref={`/tienda/${activeCategory.slug}`}
                actionLabel={
                  availability || condition || sort !== "featured"
                    ? "Limpiar filtros"
                    : "Explorar otras categorias"
                }
                message={`No hay productos publicados en ${activeCategory.name.toLowerCase()} todavia.`}
                title={`Estamos preparando ${activeCategory.name}`}
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
