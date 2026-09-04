import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import { getBalancedProductGridClassName } from "@/components/shop/product-grid-layout";
import { ProductCard } from "@/components/shared/product-card";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type ProductShowcaseSectionProps = {
  ctaHref?: string;
  ctaLabel?: string;
  favoriteProductIds?: Array<string>;
  products: Array<PublicProduct>;
  subtitle: string;
  title: string;
};

export function ProductShowcaseSection({
  ctaHref,
  ctaLabel = "Ver todos",
  favoriteProductIds = [],
  products,
  subtitle,
  title,
}: ProductShowcaseSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const favoriteProductIdSet = new Set(favoriteProductIds);

  return (
    <section className="relative bg-transparent py-10 sm:py-12 lg:py-16">
      <Container className="max-w-[1320px] space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
              Seleccion W.todocell
            </p>
            <h2 className="font-display text-[1.95rem] font-semibold leading-tight text-foreground sm:text-[2.32rem]">
              {title}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {subtitle}
            </p>
          </div>
          {ctaHref ? (
            <Link
              className={buttonStyles({
                className: "w-full sm:w-auto",
                size: "sm",
                variant: "secondary",
              })}
              href={ctaHref}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>

        <div className={getBalancedProductGridClassName(products.length)}>
          {products.map((product) => (
            <ProductCard
              initialIsFavorite={favoriteProductIdSet.has(product.id)}
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
