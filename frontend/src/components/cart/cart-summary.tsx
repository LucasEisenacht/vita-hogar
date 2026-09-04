"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format-currency";
import { buttonStyles } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CartSummary() {
  const { clearCart, subtotal, totalItems } = useCart();

  return (
    <Card className="storefront-panel-strong lg:sticky lg:top-28">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Resumen del pedido
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            El envio se calcula en el checkout segun la modalidad que elijas.
          </p>
        </div>

        <div className="space-y-3 border-y border-white/50 py-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Productos</span>
            <span className="font-semibold text-foreground">{totalItems}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-display text-xl font-semibold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          <Link
            className={buttonStyles({
              className: "w-full",
              size: "lg",
            })}
            href="/checkout/inicio"
          >
            Continuar compra
          </Link>
          <Link
            className={buttonStyles({
              className: "w-full",
              size: "lg",
              variant: "secondary",
            })}
            href="/tienda"
          >
            Seguir comprando
          </Link>
          <Button className="w-full" onClick={clearCart} variant="ghost">
            Vaciar carrito
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
