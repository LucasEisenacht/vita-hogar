"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/context/cart-context";
import type { PublicProduct } from "@/lib/catalog/types";
import { formatCurrency } from "@/lib/format-currency";

type MiniCartRecommendationsProps = {
  isOpen: boolean;
  items: Array<CartItem>;
  onNavigate: () => void;
};

type RecommendationsResponse = {
  products: Array<PublicProduct>;
  status: "success" | "error";
};

export function MiniCartRecommendations({
  isOpen,
  items,
  onNavigate,
}: MiniCartRecommendationsProps) {
  const [products, setProducts] = useState<Array<PublicProduct>>([]);
  const productIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.productId))).slice(0, 4),
    [items],
  );
  const recommendationKey = productIds.join(",");

  useEffect(() => {
    if (!isOpen || productIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function loadRecommendations() {
      try {
        const response = await fetch(
          `/api/catalog/recommendations?productIds=${encodeURIComponent(
            recommendationKey,
          )}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as RecommendationsResponse;

        if (!controller.signal.aborted && response.ok && payload.status === "success") {
          setProducts(payload.products);
        }
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
        }
      }
    }

    loadRecommendations();

    return () => controller.abort();
  }, [isOpen, productIds.length, recommendationKey]);

  if (!isOpen || productIds.length === 0 || products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="font-display text-base font-semibold text-foreground">
          Tambien puede gustarte
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Seleccion real del catalogo para completar tu compra.
        </p>
      </div>
      <div className="grid gap-2">
        {products.slice(0, 3).map((product) => (
          <Link
            className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-[20px] border border-white/54 bg-white/30 p-2 transition-all duration-[220ms] hover:-translate-y-0.5 hover:bg-white/48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            href={`/producto/${product.slug}`}
            key={product.id}
            onClick={onNavigate}
          >
            <div className="relative aspect-square overflow-hidden rounded-[16px] bg-surface-soft">
              {product.primaryImage?.url ? (
                <Image
                  alt={product.primaryImage.alt}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={product.primaryImage.url}
                />
              ) : null}
            </div>
            <div className="min-w-0 self-center">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                {product.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary-hover">
                {formatCurrency(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
