"use client";

import { FREE_SHIPPING_THRESHOLD } from "@/config/mini-cart";
import { formatCurrency } from "@/lib/format-currency";

type FreeShippingProgressProps = {
  subtotal: number;
};

export function FreeShippingProgress({ subtotal }: FreeShippingProgressProps) {
  if (FREE_SHIPPING_THRESHOLD === null) {
    return null;
  }

  const remainingAmount = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressValue = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const reachedThreshold = remainingAmount === 0;

  return (
    <section className="rounded-[24px] border border-white/58 bg-white/36 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]">
      <p className="text-sm font-semibold text-foreground">
        {reachedThreshold
          ? "Ya alcanzaste el envio gratis."
          : `Te faltan ${formatCurrency(remainingAmount)} para acceder al envio gratis.`}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary/60">
        <div
          className="h-full rounded-full bg-primary transition-all duration-[320ms] ease-out"
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </section>
  );
}
