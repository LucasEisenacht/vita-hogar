import Link from "next/link";
import Image from "next/image";
import type { PublicProduct } from "@/lib/catalog/types";
import { formatCurrency } from "@/lib/format-currency";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ProductCommercialBadges } from "@/components/shop/product-commercial-badges";
import { Card, CardContent } from "@/components/ui/card";

export type ProductCardProps = {
  initialIsFavorite?: boolean;
  product: PublicProduct;
  refreshOnFavoriteChange?: boolean;
};

export function ProductCard({
  initialIsFavorite = false,
  product,
  refreshOnFavoriteChange = false,
}: ProductCardProps) {
  const image = product.primaryImage;
  const secondaryImage = product.images.find(
    (productImage) => productImage.url && productImage.id !== image?.id,
  );
  const productHref = `/producto/${product.slug}`;
  const isOutOfStock =
    product.availabilityType === "in_stock" && product.stock <= 0;
  const activeModelVariants = product.modelVariants.filter(
    (variant) => variant.isActive,
  );
  const variantSummary =
    activeModelVariants.length > 0
      ? `${activeModelVariants.length} modelos disponibles`
      : [product.brand, product.model, product.storageCapacity]
          .filter((value): value is string => Boolean(value))
          .join(" - ");
  const installmentPrice = Math.ceil(product.price / 3);

  return (
    <Card
      className="wt-card-hover-spark group relative flex h-full overflow-hidden rounded-[24px] border-white/56 bg-[linear-gradient(180deg,rgba(255,253,251,0.96)_0%,rgba(253,238,243,0.4)_100%)] p-2 shadow-[0_14px_38px_rgba(74,55,47,0.055)] transition-all duration-[340ms] ease-out hover:-translate-y-1 hover:border-primary/22 hover:shadow-[0_22px_58px_rgba(74,55,47,0.095)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-2.5"
    >
      <Link
        aria-label={`Ver detalles de ${product.name}`}
        className="absolute inset-0 z-10 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href={productHref}
      />
      <CardContent className="flex h-full flex-1 flex-col p-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,var(--surface-soft),var(--surface))]">
          {image?.url ? (
            <>
              <Image
                alt={image.alt}
                className="object-cover transition-transform duration-[360ms] ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 430px) 50vw, 100vw"
                src={image.url}
              />
              {secondaryImage?.url ? (
                <Image
                  alt={secondaryImage.alt}
                  className="object-cover opacity-0 transition-opacity duration-[360ms] ease-out motion-reduce:transition-none md:group-hover:opacity-100"
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 430px) 50vw, 100vw"
                  src={secondaryImage.url}
                />
              ) : null}
            </>
          ) : (
            <div
              aria-label={`Placeholder de ${product.name}`}
              className="absolute inset-0 bg-secondary"
              role="img"
            >
              <div className="absolute inset-4 rounded-[18px] border border-white/70 bg-surface/45" />
              <div className="absolute bottom-4 right-4 h-16 w-16 rounded-[20px] bg-surface/70 shadow-[0_14px_30px_rgba(74,55,47,0.07)]" />
              <div className="absolute left-5 top-5 h-16 w-28 rounded-full bg-primary/30" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_56%,rgba(74,55,47,0.1)_100%)] opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100 motion-reduce:transition-none" />
          <div className="absolute right-2 top-2 z-20 opacity-55 transition-opacity duration-[250ms] group-hover:opacity-100 focus-within:opacity-100 sm:right-2.5 sm:top-2.5">
            <FavoriteButton
              className="h-9 w-9 border border-white/58 bg-white/58 text-foreground shadow-[0_8px_20px_rgba(74,55,47,0.07)] backdrop-blur-md hover:bg-white/86"
              initialIsFavorite={initialIsFavorite}
              productId={product.id}
              productSlug={product.slug}
              refreshOnChange={refreshOnFavoriteChange}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col px-0.5 pb-1 pt-3 sm:px-1 sm:pb-1.5">
          <div className="space-y-2">
            <ProductCommercialBadges compact maxItems={2} product={product} />
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {product.categoryLabel}
            </p>
            <h3 className="line-clamp-2 min-h-[2.72rem] font-display text-[0.98rem] font-semibold leading-snug text-foreground transition-colors duration-[220ms] group-hover:text-primary-hover sm:text-[1.05rem]">
              {product.name}
            </h3>
            {variantSummary ? (
              <p className="line-clamp-1 text-xs font-medium text-muted-foreground/82">
                {variantSummary}
              </p>
            ) : (
              <p className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
          </div>

          <div className="mt-auto space-y-3 pt-3">
            <div className="space-y-1.5">
              <p className="whitespace-nowrap font-display text-[1.08rem] font-semibold leading-none text-foreground min-[390px]:text-lg sm:text-xl">
                {formatCurrency(product.price)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground/78">
                3 cuotas de {formatCurrency(installmentPrice)}
              </p>
              {product.previousPrice ? (
                <p className="text-xs text-muted-foreground line-through sm:text-sm">
                  {formatCurrency(product.previousPrice)}
                </p>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-hover transition-all duration-[250ms] group-hover:gap-2 group-hover:text-foreground">
              {isOutOfStock ? "Ver detalles" : "Descubrir"}
              <span aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
