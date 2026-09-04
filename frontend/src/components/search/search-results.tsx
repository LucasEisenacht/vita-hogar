"use client";

import Link from "next/link";
import { getNavigationCategories } from "@/config/catalog-navigation";
import type { PublicCategory, PublicProduct } from "@/lib/catalog/types";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";
import { getCatalogSearchUrl } from "@/lib/catalog/search";
import { SearchResultItem } from "@/components/search/search-result-item";

type SearchResultsProps = {
  categories: Array<PublicCategory>;
  favoriteProductIds: Array<string>;
  isLoading: boolean;
  onClose: () => void;
  products: Array<PublicProduct>;
  query: string;
  searchFailed: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
};

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 animate-spin text-primary-hover"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

const searchCollections = [
  { href: "/tienda?orden=newest", label: "Novedades" },
  { href: "/tienda?orden=featured", label: "Destacados" },
  { href: "/tienda?disponibilidad=in_stock", label: "En stock" },
  { href: "/tienda/combos", label: "Combos" },
];

const popularSearches = [
  { href: "/buscar?q=iPhone", label: "iPhone" },
  { href: "/buscar?q=Samsung", label: "Samsung" },
  { href: "/buscar?q=pop socket", label: "Pop Socket" },
  { href: "/buscar?q=gaming", label: "Gaming" },
];

export function SearchResults({
  categories,
  favoriteProductIds,
  isLoading,
  onClose,
  products,
  query,
  searchFailed,
  selectedIndex,
  setSelectedIndex,
}: SearchResultsProps) {
  const navigationCategories = getNavigationCategories(categories);

  if (query.length < 2) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.65fr)]">
        <section className="rounded-[28px] border border-white/58 bg-white/36 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] backdrop-blur-sm sm:p-5">
          <div className="mb-4 space-y-1">
            <p className="font-display text-lg font-semibold text-foreground">
              Categor&iacute;as
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Entr&aacute; directo a las familias principales.
            </p>
          </div>
          {navigationCategories.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {navigationCategories.slice(0, 6).map((category) => (
                <Link
                  className="group flex min-h-12 items-center justify-between rounded-[18px] border border-white/58 bg-white/42 px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-primary/38 hover:bg-white/68 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  href={getCatalogCategoryHref(category.slug)}
                  key={category.slug}
                  onClick={onClose}
                >
                  {category.name}
                  <span className="text-primary-hover opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100">
                    &rarr;
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid gap-4">
          <section className="rounded-[28px] border border-white/58 bg-white/32 p-4 backdrop-blur-sm sm:p-5">
            <p className="mb-3 font-display text-base font-semibold text-foreground">
              M&aacute;s buscado
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <Link
                  className="rounded-full border border-white/58 bg-white/48 px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/72 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  href={item.href}
                  key={item.href}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/58 bg-white/32 p-4 backdrop-blur-sm sm:p-5">
            <p className="mb-3 font-display text-base font-semibold text-foreground">
              Colecciones
            </p>
            <div className="grid gap-2">
              {searchCollections.map((item) => (
                <Link
                  className="rounded-[16px] px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-[250ms] hover:bg-white/48 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={item.href}
                  key={item.href}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        aria-live="polite"
        className="flex items-center gap-3 rounded-[24px] border border-white/58 bg-white/38 p-5 text-sm font-semibold text-muted-foreground backdrop-blur-sm"
      >
        <SpinnerIcon />
        Buscando...
      </div>
    );
  }

  if (searchFailed) {
    return (
      <div
        aria-live="polite"
        className="rounded-[24px] border border-white/58 bg-white/38 p-5 backdrop-blur-sm"
      >
        <p className="font-display text-lg font-semibold text-foreground">
          No pudimos realizar la b&uacute;squeda. Intent&aacute; nuevamente.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        aria-live="polite"
        className="space-y-4 rounded-[24px] border border-white/58 bg-white/38 p-5 backdrop-blur-sm"
      >
        <div className="space-y-2">
          <p className="font-display text-lg font-semibold text-foreground">
            No encontramos productos para &lsquo;{query}&rsquo;.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Prob&aacute; con otro nombre, categor&iacute;a o modelo.
          </p>
        </div>
        <Link
          className="inline-flex rounded-full px-3 py-2 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:bg-white/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="/tienda"
          onClick={onClose}
        >
          Ver todos los productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="listbox">
      <div className="grid max-h-[min(56vh,520px)] gap-2 overflow-y-auto pr-1">
        {products.map((product, index) => (
          <SearchResultItem
            initialIsFavorite={favoriteProductIds.includes(product.id)}
            isSelected={index === selectedIndex}
            key={product.id}
            onClick={onClose}
            onMouseEnter={() => setSelectedIndex(index)}
            product={product}
          />
        ))}
      </div>

      <Link
        className="block rounded-full border border-white/58 bg-white/46 px-5 py-3 text-center text-sm font-semibold text-primary-hover transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-primary/38 hover:bg-white/68 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        href={getCatalogSearchUrl(query)}
        onClick={onClose}
      >
        Ver todos los resultados para &lsquo;{query}&rsquo;
      </Link>
    </div>
  );
}
