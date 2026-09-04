"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CartItem as CartItemType } from "@/context/cart-context";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format-currency";

type MiniCartItemProps = {
  isHighlighted?: boolean;
  item: CartItemType;
  onNavigate: () => void;
};

function RemoveIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

export function MiniCartItem({
  isHighlighted = false,
  item,
  onNavigate,
}: MiniCartItemProps) {
  const { getLineId, removeProduct, updateQuantity } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const lineId = getLineId(item);
  const quantityLimit =
    item.availabilityType === "made_to_order" ? 10 : Math.max(1, item.stock);
  const isAtMaxStock = item.quantity >= quantityLimit;
  const lineTotal = item.price * item.quantity;
  const imageAlt = item.image?.alt ?? `Imagen de ${item.name}`;
  const details = [
    item.selectedColor ? `Color: ${item.selectedColor}` : "",
    item.variantId && item.selectedModelBrand && item.selectedModel
      ? `Modelo: ${item.selectedModelBrand} ${item.selectedModel}`
      : item.selectedCompatibility
        ? `Compatibilidad: ${item.selectedCompatibility}`
        : "",
  ].filter(Boolean);

  function handleRemove() {
    setIsRemoving(true);
    window.setTimeout(() => removeProduct(lineId), 170);
  }

  return (
    <article
      className={`grid grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-[26px] border p-3 transition-all duration-[240ms] motion-reduce:transition-none ${
        isHighlighted
          ? "border-primary/38 bg-secondary/42 shadow-[0_14px_32px_rgba(207,142,168,0.12)]"
          : "border-white/58 bg-white/38 shadow-[0_10px_28px_rgba(74,55,47,0.045)]"
      } ${isRemoving ? "scale-[0.98] opacity-0" : "scale-100 opacity-100"}`}
    >
      <Link
        className="relative aspect-square overflow-hidden rounded-[20px] bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={`/producto/${item.slug}`}
        onClick={onNavigate}
      >
        {item.image?.url ? (
          <Image
            alt={imageAlt}
            className="object-cover"
            fill
            sizes="88px"
            src={item.image.url}
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,var(--surface-soft),var(--surface))]" />
        )}
      </Link>

      <div className="min-w-0 space-y-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              className="line-clamp-2 font-display text-sm font-semibold leading-snug text-foreground transition-colors duration-[220ms] hover:text-primary-hover"
              href={`/producto/${item.slug}`}
              onClick={onNavigate}
            >
              {item.name}
            </Link>
            {details.length > 0 ? (
              <div className="mt-1 space-y-0.5 text-xs leading-5 text-muted-foreground">
                {details.map((detail) => (
                  <p key={detail}>{detail}</p>
                ))}
              </div>
            ) : null}
          </div>
          <button
            aria-label={`Eliminar ${item.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-[220ms] hover:bg-white/62 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleRemove}
            type="button"
          >
            <RemoveIcon />
          </button>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-white/58 bg-white/42 p-1">
            <button
              aria-label={`Reducir cantidad de ${item.name}`}
              className="h-7 w-7 rounded-full text-muted-foreground transition-colors duration-[220ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
              disabled={item.quantity <= 1}
              onClick={() => updateQuantity(lineId, item.quantity - 1)}
              type="button"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-bold text-foreground">
              {item.quantity}
            </span>
            <button
              aria-label={`Aumentar cantidad de ${item.name}`}
              className="h-7 w-7 rounded-full text-muted-foreground transition-colors duration-[220ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isAtMaxStock}
              onClick={() => updateQuantity(lineId, item.quantity + 1)}
              type="button"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">
              {formatCurrency(item.price)} c/u
            </p>
            <p className="font-display text-base font-semibold text-foreground">
              {formatCurrency(lineTotal)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
