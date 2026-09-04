"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import {
  getConditionLabel,
  isMadeToOrder,
} from "@/lib/catalog/commerce";
import { formatCurrency } from "@/lib/format-currency";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";

type SearchResultItemProps = {
  initialIsFavorite?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  product: PublicProduct;
};

export function SearchResultItem({
  initialIsFavorite = false,
  isSelected = false,
  onClick,
  onMouseEnter,
  product,
}: SearchResultItemProps) {
  const image = product.primaryImage;
  const isOutOfStock =
    product.availabilityType === "in_stock" && product.stock <= 0;
  const primaryBadge = isMadeToOrder(product)
    ? "Por encargo"
    : product.condition !== "new"
      ? getConditionLabel(product.condition)
      : product.badge;

  return (
    <div
      aria-selected={isSelected}
      className={`grid grid-cols-[64px_minmax(0,1fr)_auto] gap-4 rounded-[24px] border p-4 transition-all duration-[250ms] sm:grid-cols-[72px_minmax(0,1fr)_auto] ${
        isSelected
          ? "border-primary bg-secondary shadow-[0_14px_34px_rgba(207,142,168,0.16)]"
          : "border-transparent bg-surface hover:border-border hover:bg-surface-soft"
      }`}
      onMouseEnter={onMouseEnter}
      role="option"
    >
      <Link
        className="contents focus-visible:outline-none"
        href={`/producto/${product.slug}`}
        onClick={onClick}
      >
        <span className="relative aspect-square overflow-hidden rounded-[18px] bg-surface-soft">
          {image?.url ? (
            <Image
              alt={image.alt}
              className="object-cover"
              fill
              sizes="72px"
              src={image.url}
            />
          ) : (
            <span
              aria-label={`Placeholder de ${product.name}`}
              className="absolute inset-0 bg-secondary"
              role="img"
            >
              <span className="absolute inset-3 rounded-[14px] border border-white/70 bg-surface/45" />
              <span className="absolute left-3 top-4 h-8 w-10 rounded-full bg-primary/25" />
              <span className="absolute bottom-3 right-3 h-8 w-8 rounded-[10px] bg-surface/80" />
            </span>
          )}
        </span>

        <span className="min-w-0 space-y-2">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {product.categoryLabel}
            </span>
            {primaryBadge ? (
              <Badge variant={isMadeToOrder(product) ? "default" : "new"}>
                {primaryBadge}
              </Badge>
            ) : null}
            {isOutOfStock ? <Badge variant="neutral">Agotado</Badge> : null}
          </span>
          <span className="block truncate font-display text-base font-semibold text-foreground">
            {product.name}
          </span>
          <span className="flex flex-wrap items-end gap-2">
            <span className="font-display text-base font-semibold text-foreground">
              {formatCurrency(product.price)}
            </span>
            {product.previousPrice ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.previousPrice)}
              </span>
            ) : null}
          </span>
        </span>
      </Link>
      <FavoriteButton
        initialIsFavorite={initialIsFavorite}
        productId={product.id}
        productSlug={product.slug}
      />
    </div>
  );
}
