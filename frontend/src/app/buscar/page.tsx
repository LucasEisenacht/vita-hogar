import type { Metadata } from "next";
import Link from "next/link";
import {
  getPublicCategories,
  searchPublicProducts,
} from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import {
  isSearchableCatalogQuery,
  sanitizeCatalogSearchQuery,
} from "@/lib/catalog/search";
import { EmptyCatalog } from "@/components/shop/empty-catalog";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { createPublicMetadata } from "@/lib/seo/metadata";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = sanitizeCatalogSearchQuery(q ?? "");

  if (!query) {
    return {
      ...createPublicMetadata({
        description:
          "Textiles, objetos y detalles para cada ambiente.",
        path: "/buscar",
        title: "Buscar | VITA HOGAR",
      }),
      robots: {
        follow: true,
        index: false,
      },
    };
  }

  return {
    ...createPublicMetadata({
      description: `Resultados de búsqueda para ${query} en VITA HOGAR.`,
      path: `/buscar?q=${encodeURIComponent(query)}`,
      title: `Resultados para ${query} | VITA HOGAR`,
    }),
    robots: {
      follow: true,
      index: false,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = sanitizeCatalogSearchQuery(q ?? "");
  const canSearch = isSearchableCatalogQuery(query);
  let categories: Awaited<ReturnType<typeof getPublicCategories>> = [];
  let products: Awaited<ReturnType<typeof searchPublicProducts>> = [];
  let favoriteProductIds: Awaited<ReturnType<typeof getCurrentUserFavoriteIds>> =
    [];
  let searchFailed = false;

  try {
    [categories, favoriteProductIds] = await Promise.all([
      getPublicCategories(),
      getCurrentUserFavoriteIds(),
    ]);
    products = canSearch ? await searchPublicProducts(query, 24) : [];
  } catch {
    searchFailed = true;
  }
  const navigationCategories = categories;
  const title = query
    ? `Resultados para '${query}'`
    : "¿Qué estás buscando?";

  return (
    <StorefrontPageShell>
      <section className="vita-search-page bg-transparent py-8 sm:py-10">
        <Container className="max-w-[1320px] space-y-6">
          <div className="vita-search-page__intro relative overflow-hidden border border-border bg-surface px-5 py-6 sm:px-6 lg:px-8">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
              Buscar
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-[3.5rem]">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Encontr&aacute; textiles, objetos y detalles para los distintos ambientes de la casa.
            </p>
            {canSearch ? (
              <p className="mt-3 inline-flex border border-border bg-background-alt px-3.5 py-1.5 text-sm font-semibold text-muted-foreground">
                {products.length} productos encontrados
              </p>
            ) : null}
          </div>

          <form
            action="/buscar"
            className="vita-search-page__form grid gap-3 border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <label className="sr-only" htmlFor="search-page-input">
              Buscar productos
            </label>
            <input
              autoComplete="off"
              className="h-11 border border-border bg-surface px-4 font-display text-base font-semibold text-foreground outline-none transition-colors duration-[200ms] placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-ring/25"
              defaultValue={query}
              id="search-page-input"
              maxLength={100}
              name="q"
              placeholder="Buscar manta, almohadón, vela, canasto..."
              type="search"
            />
            <Button className="w-full sm:w-auto" type="submit">
              Buscar
            </Button>
          </form>

          {!query && navigationCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {navigationCategories.map((category) => (
                <Link
                  className="border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors duration-[200ms] hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  href="/tienda"
                  key={category.slug}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}
        </Container>
      </section>

      <Container className="pb-16 sm:pb-20">
        {searchFailed ? (
          <EmptyCatalog
            actionHref="/tienda"
            actionLabel="Ver todos los productos"
            message="No pudimos realizar la busqueda. Intenta nuevamente."
            title="La busqueda no respondio"
          />
        ) : !query ? (
          <Card className="storefront-panel">
            <CardContent className="mx-auto max-w-xl space-y-3 p-8 text-center sm:p-10">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Empez&aacute; con una b&uacute;squeda
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Pod&eacute;s buscar por producto, categoría, material o ambiente.
              </p>
            </CardContent>
          </Card>
        ) : !canSearch ? (
          <EmptyCatalog
            actionHref="/tienda"
            actionLabel="Ver todos los productos"
            message="Escribi al menos 2 caracteres para buscar en el catalogo."
            title="Necesitamos un poquito mas de detalle"
          />
        ) : products.length > 0 ? (
          <ProductGrid
            favoriteProductIds={favoriteProductIds}
            products={products}
          />
        ) : (
          <EmptyCatalog
            actionHref="/tienda"
            actionLabel="Ver todos los productos"
            message="Probá con otro nombre, categoría, material o ambiente."
            title={`No encontramos productos para '${query}'`}
          />
        )}
      </Container>
    </StorefrontPageShell>
  );
}
