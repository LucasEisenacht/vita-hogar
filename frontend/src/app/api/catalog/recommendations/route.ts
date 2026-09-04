import { NextResponse } from "next/server";
import {
  getPublicProductsByIds,
  getRelatedProducts,
} from "@/lib/catalog/queries";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRequestIdentifier,
} from "@/lib/security/rate-limit";
import type { PublicProduct } from "@/lib/catalog/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RecommendationsResponse = {
  products: Array<PublicProduct>;
  status: "success";
} | {
  message: string;
  products: Array<PublicProduct>;
  status: "error";
};

function getValidProductIds(value: string | null) {
  const seenProductIds = new Set<string>();

  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => uuidPattern.test(item))
    .filter((item) => {
      const normalizedItem = item.toLowerCase();

      if (seenProductIds.has(normalizedItem)) {
        return false;
      }

      seenProductIds.add(normalizedItem);
      return true;
    })
    .slice(0, 4);
}

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit(
    {
      keyPrefix: "catalog-recommendations",
      limit: 80,
      windowSeconds: 60,
    },
    getRequestIdentifier(request),
  );

  if (rateLimit.status === "limited") {
    return NextResponse.json<RecommendationsResponse>(
      {
        message: "Demasiadas solicitudes. Intenta nuevamente en unos segundos.",
        products: [],
        status: "error",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 429,
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const productIds = getValidProductIds(searchParams.get("productIds"));

  if (productIds.length === 0) {
    return NextResponse.json<RecommendationsResponse>(
      {
        products: [],
        status: "success",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      },
    );
  }

  try {
    const cartProducts = await getPublicProductsByIds(productIds);
    const recommendationsById = new Map<string, PublicProduct>();
    const excludedIds = new Set(productIds);

    for (const product of cartProducts) {
      const relatedProducts = await getRelatedProducts(product, 3);

      relatedProducts.forEach((relatedProduct) => {
        if (!excludedIds.has(relatedProduct.id)) {
          recommendationsById.set(relatedProduct.id, relatedProduct);
        }
      });

      if (recommendationsById.size >= 3) {
        break;
      }
    }

    return NextResponse.json<RecommendationsResponse>(
      {
        products: Array.from(recommendationsById.values()).slice(0, 3),
        status: "success",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
      },
    );
  } catch {
    return NextResponse.json<RecommendationsResponse>(
      {
        message: "No pudimos cargar recomendaciones.",
        products: [],
        status: "error",
      },
      {
        headers: getRateLimitHeaders(rateLimit),
        status: 500,
      },
    );
  }
}
