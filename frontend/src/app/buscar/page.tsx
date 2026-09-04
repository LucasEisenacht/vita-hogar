import type { Metadata } from "next";
import Link from "next/link";
import { getNavigationCategories } from "@/config/catalog-navigation";
import {
  getPublicCategories,
  searchPublicProducts,
} from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";
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
          "Busca productos, modelos y categorias disponibles en W.todocell.",
        path: "/buscar",
        title: "Buscar | W.todocell",
      }),
      robots: {
        follow: true,
        index: false,
      },
    };
  }

  return {
    ...createPublicMetadata({
      description: `Resultados de busqueda para ${query} en W.todocell.`,
      path: `/buscar?q=${encodeURIComponent(query)}`,
      title: `Resultados para ${query} | W.todocell`,
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
  const navigationCategories = getNavigationCategories(categories);
  const title = query
    ? `Resultados para '${query}'`
    : "Busca productos, modelos o categorias";

  return (
    <StorefrontPageShell>
      <section className="bg-transparent py-8 sm:py-10">
        <Container className="max-w-[1320px] space-y-6">
          <div className="storefront-panel relative overflow-hidden rounded-[28px] px-5 py-6 sm:px-6 lg:px-8">
            <span
              aria-hidden="true"
              className="wt-glow-dot right-10 top-10 h-3 w-3 [animation-delay:2s]"
            />
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
              Buscar
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-[3.5rem]">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Encontr&aacute; accesorios, modelos compatibles y categor&iacute;as
              activas del cat&aacute;logo.
            </p>
            {canSearch ? (
              <p className="mt-3 inline-flex rounded-full border border-white/52 bg-white/34 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm">
                {products.length} productos encontrados
              </p>
            ) : null}
          </div>

          <form
            action="/buscar"
            className="storefront-panel-strong grid gap-3 rounded-[24px] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <label className="sr-only" htmlFor="search-page-input">
              Buscar productos
            </label>
            <input
              autoComplete="off"
              className="h-11 rounded-full border border-white/52 bg-white/48 px-4 font-display text-base font-semibold text-foreground outline-none backdrop-blur-sm transition-all duration-[250ms] placeholder:text-muted-foreground/65 focus:border-primary focus:ring-4 focus:ring-ring/25"
              defaultValue={query}
              id="search-page-input"
              maxLength={100}
              name="q"
              placeholder="Buscar fundas, iPhone, audio..."
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
                  className="rounded-full border border-white/50 bg-white/30 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-primary/45 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  href={getCatalogCategoryHref(category.slug)}
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
                Pod&eacute;s buscar por producto, categor&iacute;a, color o modelo
                compatible.
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
            message="Proba con otro nombre, categoria o modelo."
            title={`No encontramos productos para '${query}'`}
          />
        )}
      </Container>
    </StorefrontPageShell>
  );
}
