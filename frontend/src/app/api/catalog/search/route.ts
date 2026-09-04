import { NextResponse } from "next/server";
import {
  getPublicCategories,
  searchPublicProducts,
} from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import {
  isSearchableCatalogQuery,
  sanitizeCatalogSearchQuery,
} from "@/lib/catalog/search";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRequestIdentifier,
} from "@/lib/security/rate-limit";
import type { CatalogSearchApiResponse } from "@/lib/catalog/types";

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(
    {
      keyPrefix: "catalog-search",
      limit: 60,
      windowSeconds: 60,
    },
    getRequestIdentifier(request),
  );

  if (rateLimit.status === "limited") {
    return NextResponse.json<CatalogSearchApiResponse>(
      {
        categories: [],
        favoriteProductIds: [],
        message: "Demasiadas busquedas. Intenta nuevamente en unos segundos.",
        products: [],
        query: "",
        status: "error",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 429,
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = sanitizeCatalogSearchQuery(searchParams.get("q") ?? "");

  try {
    const categories = await getPublicCategories();
    const products = isSearchableCatalogQuery(query)
      ? await searchPublicProducts(query, 6)
      : [];
    const favoriteProductIds = await getCurrentUserFavoriteIds();

    return NextResponse.json<CatalogSearchApiResponse>(
      {
        categories,
        favoriteProductIds,
        products,
        query,
        status: "success",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      },
    );
  } catch {
    return NextResponse.json<CatalogSearchApiResponse>(
      {
        categories: [],
        favoriteProductIds: [],
        message: "No pudimos realizar la busqueda. Intenta nuevamente.",
        products: [],
        query,
        status: "error",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      },
    );
  }
}
