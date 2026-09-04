"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartItem as CartItemType } from "@/context/cart-context";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format-currency";
import { getConditionLabel } from "@/lib/catalog/commerce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CartItemProps = {
  item: CartItemType;
};

export function CartItem({ item }: CartItemProps) {
  const { getLineId, removeProduct, updateQuantity } = useCart();
  const lineId = getLineId(item);
  const lineTotal = item.price * item.quantity;
  const quantityLimit =
    item.availabilityType === "made_to_order" ? 10 : item.stock;
  const isAtMaxStock = item.quantity >= quantityLimit;
  const placeholderTone = item.image?.tone ?? "bg-secondary";
  const placeholderAccent = item.image?.accent ?? "bg-primary/25";
  const imageAlt = item.image?.alt ?? `Placeholder de ${item.name}`;

  return (
    <Card className="storefront-panel-strong">
      <CardContent className="grid gap-5 p-5 sm:grid-cols-[132px_minmax(0,1fr)] sm:p-6">
        {item.image?.url ? (
          <div className="relative aspect-square overflow-hidden rounded-[26px] bg-surface/46">
            <Image
              alt={imageAlt}
              className="object-cover"
              fill
              sizes="132px"
              src={item.image.url}
            />
          </div>
        ) : (
          <div
            aria-label={imageAlt}
            className={`relative aspect-square overflow-hidden rounded-[26px] ${placeholderTone} p-4`}
            role="img"
          >
            <div className="absolute inset-4 rounded-[22px] border border-white/70 bg-surface/45" />
            <div
              className={`absolute left-5 top-5 h-12 w-16 rounded-full ${placeholderAccent}`}
            />
            <div className="absolute bottom-5 right-5 h-14 w-14 rounded-[18px] bg-surface/70" />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-3">
            <div>
              <Link
                className="font-display text-xl font-semibold text-foreground transition-colors duration-[250ms] hover:text-primary-hover"
                href={`/producto/${item.slug}`}
              >
                {item.name}
              </Link>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {item.availabilityType === "made_to_order" ? (
                  <Badge variant="default">Por encargo</Badge>
                ) : null}
                {item.condition && item.condition !== "new" ? (
                  <p>Condicion: {getConditionLabel(item.condition)}</p>
                ) : null}
                {item.selectedColor ? <p>Color: {item.selectedColor}</p> : null}
                {item.variantId && item.selectedModelBrand && item.selectedModel ? (
                  <p>
                    Modelo: {item.selectedModelBrand} {item.selectedModel}
                  </p>
                ) : item.selectedCompatibility ? (
                  <p>Compatibilidad: {item.selectedCompatibility}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <p className="text-muted-foreground">
                Unitario{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(item.price)}
                </span>
              </p>
              {item.stock === 1 && item.availabilityType === "in_stock" ? (
                <p className="font-semibold text-warning">Ultima unidad</p>
              ) : null}
              {item.availabilityType === "made_to_order" ? (
                <p className="font-semibold text-primary-hover">
                  {item.estimatedDeliveryText ?? "A coordinar por WhatsApp"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <div className="inline-flex w-fit items-center rounded-full border border-white/55 bg-white/34 p-1 backdrop-blur-sm">
              <button
                aria-label={`Reducir cantidad de ${item.name}`}
                className="h-9 w-9 rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
                disabled={item.quantity <= 1}
                onClick={() => updateQuantity(lineId, item.quantity - 1)}
                type="button"
              >
                -
              </button>
              <span className="w-10 text-center text-sm font-semibold">
                {item.quantity}
              </span>
              <button
                aria-label={`Aumentar cantidad de ${item.name}`}
                className="h-9 w-9 rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
                disabled={isAtMaxStock}
                onClick={() => updateQuantity(lineId, item.quantity + 1)}
                type="button"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-4 sm:ml-auto lg:ml-0">
              <p className="font-display text-xl font-semibold text-foreground">
                {formatCurrency(lineTotal)}
              </p>
              <Button
                aria-label={`Eliminar ${item.name}`}
                onClick={() => removeProduct(lineId)}
                size="sm"
                variant="ghost"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
