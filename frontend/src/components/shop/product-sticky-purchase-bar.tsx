"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicProduct } from "@/lib/catalog/types";
import {
  getAvailabilityLabel,
  getConditionLabel,
} from "@/lib/catalog/commerce";
import { formatCurrency } from "@/lib/format-currency";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { buttonStyles } from "@/components/ui/button";

type ProductStickyPurchaseBarProps = {
  initialIsFavorite?: boolean;
  product: PublicProduct;
};

export function ProductStickyPurchaseBar({
  initialIsFavorite = false,
  product,
}: ProductStickyPurchaseBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("product-purchase-panel");

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        rootMargin: "-96px 0px 0px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/55 bg-[#fff6f8]/82 px-4 py-3 shadow-[0_-18px_48px_rgba(74,55,47,0.10)] backdrop-blur-xl transition-transform duration-[250ms] motion-reduce:transition-none lg:bottom-5 lg:left-1/2 lg:right-auto lg:w-[min(940px,calc(100vw-48px))] lg:-translate-x-1/2 lg:rounded-full lg:border lg:px-5 ${
        isVisible
          ? "translate-y-0"
          : "translate-y-[calc(100%+env(safe-area-inset-bottom)+24px)] lg:translate-y-[calc(100%+32px)]"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-foreground sm:text-base">
            {product.name}
          </p>
          <p className="truncate text-xs font-semibold text-muted-foreground">
            {formatCurrency(product.price)} /{" "}
            {getConditionLabel(product.condition)} /{" "}
            {getAvailabilityLabel(product.availabilityType)}
          </p>
        </div>
        <FavoriteButton
          className="hidden h-10 w-10 shrink-0 sm:inline-flex"
          initialIsFavorite={initialIsFavorite}
          productId={product.id}
          productSlug={product.slug}
          variant="soft"
        />
        <Link
          className={buttonStyles({
            className: "shrink-0 px-5",
            size: "md",
            variant: "primary",
          })}
          href="#product-purchase-panel"
        >
          Comprar
        </Link>
      </div>
    </div>
  );
}
