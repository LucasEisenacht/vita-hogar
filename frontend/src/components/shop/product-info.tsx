import type { PublicProduct } from "@/lib/catalog/types";
import type { ProductExperienceVariant } from "@/lib/catalog/product-variants";
import {
  getAvailabilityLabel,
  getConditionLabel,
  isMadeToOrder,
} from "@/lib/catalog/commerce";
import { formatCurrency } from "@/lib/format-currency";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { AddToCartPanel } from "@/components/shop/add-to-cart-panel";
import { ProductCommercialBadges } from "@/components/shop/product-commercial-badges";
import { Card, CardContent } from "@/components/ui/card";

type ProductInfoProps = {
  initialIsFavorite?: boolean;
  onSelectedColorChange?: (colorName: string) => void;
  product: PublicProduct;
  selectedColor?: string;
  selectedVariant?: ProductExperienceVariant;
};

export function ProductInfo({
  initialIsFavorite = false,
  onSelectedColorChange,
  product,
  selectedColor,
  selectedVariant,
}: ProductInfoProps) {
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock =
    product.availabilityType === "in_stock" && displayStock <= 0;
  const stockText =
    product.availabilityType === "made_to_order"
      ? product.estimatedDeliveryText ?? "Se coordina disponibilidad por WhatsApp"
      : isOutOfStock
        ? "Sin stock por ahora"
        : displayStock <= 3
          ? "Ultimas unidades disponibles"
          : "Stock disponible";
  const installmentPrice = Math.ceil(displayPrice / 3);

  return (
    <Card className="storefront-panel-strong rounded-[34px] shadow-[0_14px_38px_rgba(74,55,47,0.035)]">
      <CardContent className="space-y-8 p-5 sm:p-7 lg:p-8">
        <div className="space-y-5">
          <div className="space-y-4">
            <ProductCommercialBadges compact maxItems={2} product={product} />
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>{product.categoryLabel}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary/55" />
              <span>{getConditionLabel(product.condition)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-[2.85rem] font-semibold leading-[1.02] text-foreground sm:text-[3.25rem]">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span
                aria-label="Rating preparado"
                className="flex items-center gap-1 text-primary-hover"
              >
                {[0, 1, 2, 3, 4].map((star) => (
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 fill-current"
                    key={star}
                    viewBox="0 0 20 20"
                  >
                    <path d="m10 1.8 2.45 5.04 5.55.79-4.02 3.92.95 5.53L10 14.47l-4.93 2.61.95-5.53L2 7.63l5.55-.79L10 1.8Z" />
                  </svg>
                ))}
              </span>
              <span>Opiniones en preparacion</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-3">
              <p className="font-display text-[2.35rem] font-semibold leading-none text-foreground sm:text-[3rem]">
                {formatCurrency(displayPrice)}
              </p>
              {product.previousPrice ? (
                <p className="pb-1 text-base text-muted-foreground line-through sm:text-lg">
                  {formatCurrency(product.previousPrice)}
                </p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              3 cuotas de {formatCurrency(installmentPrice)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p
              className={`inline-flex rounded-full px-3.5 py-2 text-sm font-semibold ${
                isOutOfStock
                  ? "bg-muted text-destructive"
                  : isMadeToOrder(product)
                    ? "bg-secondary/70 text-primary-hover"
                    : "bg-[#eaf4ec] text-success"
              }`}
            >
              {stockText}
            </p>
            <FavoriteButton
              className="sm:w-auto"
              initialIsFavorite={initialIsFavorite}
              productId={product.id}
              productSlug={product.slug}
              variant="soft"
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-[24px] border border-white/48 bg-white/22 p-4 text-sm backdrop-blur-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Categoria</p>
            <p className="mt-1 font-semibold text-foreground">
              {product.categoryLabel}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Disponibilidad</p>
            <p className="mt-1 font-semibold text-foreground">
              {getAvailabilityLabel(product.availabilityType)}
            </p>
          </div>
          {product.model ? (
            <div>
              <p className="text-muted-foreground">Modelo</p>
              <p className="mt-1 font-semibold text-foreground">
                {product.model}
              </p>
            </div>
          ) : null}
          {product.storageCapacity ? (
            <div>
              <p className="text-muted-foreground">Almacenamiento</p>
              <p className="mt-1 font-semibold text-foreground">
                {product.storageCapacity}
              </p>
            </div>
          ) : null}
        </div>

        {isMadeToOrder(product) ? (
          <div className="rounded-[24px] border border-primary/20 bg-secondary/50 p-4 text-sm leading-6 text-primary-hover backdrop-blur-sm">
            Producto por encargo. Coordinamos disponibilidad y preparacion por
            WhatsApp antes de avanzar.
          </div>
        ) : null}

        <AddToCartPanel
          onSelectedColorChange={onSelectedColorChange}
          product={product}
          selectedColor={selectedColor}
        />
      </CardContent>
    </Card>
  );
}
