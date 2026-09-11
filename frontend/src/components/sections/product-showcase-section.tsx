import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import { getBalancedProductGridClassName } from "@/components/shop/product-grid-layout";
import { ProductCard } from "@/components/shared/product-card";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type ProductShowcaseSectionProps = { ctaHref?: string; ctaLabel?: string; favoriteProductIds?: Array<string>; products: Array<PublicProduct>; subtitle: string; title: string };

export function ProductShowcaseSection({ ctaHref, ctaLabel = "Ver todos", favoriteProductIds = [], products }: ProductShowcaseSectionProps) {
  if (!products.length) return null;
  const favorites = new Set(favoriteProductIds);
  return <section className="home-products bg-background py-12 sm:py-16 lg:py-24"><Container className="space-y-8"><div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-xl"><p className="vita-label">Para conocer</p><h2 className="mt-4 font-display text-4xl leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl">Novedades y seleccionados.</h2><p className="mt-4 text-base leading-7 text-secondary">Texturas y objetos elegidos para acompañar distintos momentos de la casa.</p></div>{ctaHref ? <Link className={buttonStyles({ size: "md", variant: "secondary" })} href={ctaHref}>{ctaLabel}</Link> : null}</div><div className={getBalancedProductGridClassName(products.length)}>{products.map((product) => <ProductCard initialIsFavorite={favorites.has(product.id)} key={product.id} product={product} />)}</div></Container></section>;
}