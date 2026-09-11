"use client";

import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { useCart } from "@/context/cart-context";
import { Container } from "@/components/ui/container";

export default function CartPage() {
  const { getLineId, items, totalItems } = useCart();

  return (
    <StorefrontPageShell intensity="low">
      <div className="py-12 text-foreground sm:py-16">
      <Container className="space-y-10">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            <div className="max-w-3xl space-y-3">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
                VITA HOGAR
              </p>
              <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                Tu carrito
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                {totalItems} unidades seleccionadas para revisar antes de
                continuar.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
              <section aria-label="Productos en el carrito" className="space-y-4">
                {items.map((item) => (
                  <CartItem item={item} key={getLineId(item)} />
                ))}
              </section>
              <CartSummary />
            </div>
          </>
        )}
      </Container>
      </div>
    </StorefrontPageShell>
  );
}
