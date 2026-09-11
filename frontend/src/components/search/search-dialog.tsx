"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  CatalogSearchApiResponse,
  PublicCategory,
  PublicProduct,
} from "@/lib/catalog/types";
import {
  getCatalogSearchUrl,
  isSearchableCatalogQuery,
  sanitizeCatalogSearchQuery,
} from "@/lib/catalog/search";
import { Button } from "@/components/ui/button";
import { ExperienceOverlay } from "@/components/experience/experience-overlay";
import { SearchResults } from "@/components/search/search-results";

type SearchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categories, setCategories] = useState<Array<PublicCategory>>([]);
  const [products, setProducts] = useState<Array<PublicProduct>>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<Array<string>>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const resetSearch = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setProducts([]);
    setFavoriteProductIds([]);
    setIsLoading(false);
    setSearchFailed(false);
    setSelectedIndex(-1);
  }, []);

  const closeSearch = useCallback(() => {
    resetSearch();
    onClose();
  }, [onClose, resetSearch]);

  const goToSearchPage = useCallback(
    (value: string) => {
      const sanitizedQuery = sanitizeCatalogSearchQuery(value);

      router.push(getCatalogSearchUrl(sanitizedQuery));
      closeSearch();
    },
    [closeSearch, router],
  );

  const goToSelectedProduct = useCallback(
    (product: PublicProduct) => {
      router.push(`/producto/${product.slug}`);
      closeSearch();
    },
    [closeSearch, router],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(sanitizeCatalogSearchQuery(query));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const controller = new AbortController();

    async function fetchSearchResults() {
      if (!isSearchableCatalogQuery(debouncedQuery)) {
        setProducts([]);
        setSearchFailed(false);
        setIsLoading(false);

        try {
          const response = await fetch("/api/catalog/search", {
            signal: controller.signal,
          });
          const payload =
            (await response.json()) as CatalogSearchApiResponse;

          if (requestIdRef.current === requestId && payload.status === "success") {
            setCategories(payload.categories);
            setFavoriteProductIds(payload.favoriteProductIds);
          }
        } catch {
          if (!controller.signal.aborted) {
            setCategories([]);
          }
        }

        return;
      }

      setIsLoading(true);
      setSearchFailed(false);

      try {
        const response = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as CatalogSearchApiResponse;

        if (requestIdRef.current !== requestId) {
          return;
        }

        if (!response.ok || payload.status === "error") {
          setProducts([]);
          setSearchFailed(true);
          return;
        }

        setCategories(payload.categories);
        setFavoriteProductIds(payload.favoriteProductIds);
        setProducts(payload.products);
        setSelectedIndex(-1);
      } catch {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setProducts([]);
          setSearchFailed(true);
        }
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }

    fetchSearchResults();

    return () => controller.abort();
  }, [debouncedQuery, isOpen]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedIndex >= 0 && products[selectedIndex]) {
      goToSelectedProduct(products[selectedIndex]);
      return;
    }

    goToSearchPage(query);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && products.length > 0) {
      event.preventDefault();
      setSelectedIndex((currentIndex) =>
        currentIndex >= products.length - 1 ? 0 : currentIndex + 1,
      );
    }

    if (event.key === "ArrowUp" && products.length > 0) {
      event.preventDefault();
      setSelectedIndex((currentIndex) =>
        currentIndex <= 0 ? products.length - 1 : currentIndex - 1,
      );
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <ExperienceOverlay
      className="px-0 py-0 sm:px-6 sm:py-16 lg:py-24"
      labelledBy="catalog-search-title"
      onClose={closeSearch}
      panelClassName="vita-search-panel mx-auto flex min-h-dvh w-full max-w-[920px] flex-col overflow-hidden bg-surface p-5 sm:min-h-0 sm:p-7"
    >
      <section
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p
              className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover"
              id="catalog-search-title"
            >
              Buscar
            </p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-foreground sm:text-3xl">
              &iquest;Qu&eacute; est&aacute;s buscando?
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Textiles, objetos y detalles para cada ambiente.
            </p>
          </div>
          <Button
            aria-label="Cerrar buscador"
            className="h-10 w-10"
            onClick={closeSearch}
            size="icon"
            variant="ghost"
          >
            <CloseIcon />
          </Button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col space-y-5" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="catalog-search-input">
            Buscar productos
          </label>
          <input
            autoComplete="off"
            className="vita-search-input h-16 w-full rounded-none border border-border bg-surface px-6 font-display text-xl font-semibold text-foreground shadow-none outline-none transition-all duration-[250ms] placeholder:text-muted-foreground/58 focus:border-primary/58 focus:bg-white/76 focus:ring-4 focus:ring-ring/25"
            id="catalog-search-input"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar manta, almohadón, vela, canasto..."
            ref={inputRef}
            type="search"
            value={query}
          />

          <SearchResults
            categories={categories}
            isLoading={isLoading}
            onClose={closeSearch}
            products={products}
            favoriteProductIds={favoriteProductIds}
            query={sanitizeCatalogSearchQuery(query)}
            searchFailed={searchFailed}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        </form>
      </section>
    </ExperienceOverlay>
  );
}
