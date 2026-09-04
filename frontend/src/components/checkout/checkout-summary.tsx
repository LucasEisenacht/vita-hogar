import Link from "next/link";
import type { CartItem } from "@/context/cart-context";
import { getDeliveryMethodConfig } from "@/config/checkout";
import { formatCurrency } from "@/lib/format-currency";
import type { DeliveryMethod } from "@/components/checkout/types";
import { Card, CardContent } from "@/components/ui/card";

type CheckoutSummaryProps = {
  deliveryMethod: DeliveryMethod;
  items: CartItem[];
  subtotal: number;
};

export function CheckoutSummary({
  deliveryMethod,
  items,
  subtotal,
}: CheckoutSummaryProps) {
  const deliveryConfig = getDeliveryMethodConfig(deliveryMethod);
  const shippingCost =
    deliveryConfig?.costStatus === "fixed" ? deliveryConfig.cost : 0;
  const total = subtotal + shippingCost;
  const hasMadeToOrderItems = items.some(
    (item) => item.availabilityType === "made_to_order",
  );
  const shippingDescription =
    deliveryConfig?.costStatus === "to_be_confirmed"
      ? "El costo se confirma por WhatsApp antes de despachar."
      : (deliveryConfig?.description ?? "Coordinamos los detalles por WhatsApp.");

  return (
    <Card className="lg:sticky lg:top-28">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Resumen
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Revisalo antes de confirmar el pedido por WhatsApp.
            </p>
          </div>
          <Link
            className="rounded-full px-3 py-2 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href="/carrito"
          >
            Editar carrito
          </Link>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              className="grid gap-2 border-b border-border pb-4 text-sm"
              key={`${item.productId}-${item.variantId ?? "sin-variante"}-${item.selectedColor ?? "sin-color"}-${item.selectedCompatibility ?? "sin-compatibilidad"}`}
            >
              <div className="flex justify-between gap-4">
                <p className="font-semibold text-foreground">
                  {item.quantity}x {item.name}
                </p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
              <div className="space-y-1 text-muted-foreground">
                {item.availabilityType === "made_to_order" ? (
                  <p className="font-semibold text-primary-hover">
                    Por encargo
                    {item.estimatedDeliveryText
                      ? ` · ${item.estimatedDeliveryText}`
                      : ""}
                  </p>
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
          ))}
        </div>

        {hasMadeToOrderItems ? (
          <div className="rounded-[22px] border border-primary/20 bg-secondary/60 p-4 text-sm leading-6 text-primary-hover">
            Tu pedido incluye productos por encargo. Confirmaremos tiempos de
            preparaci&oacute;n por WhatsApp antes de avanzar.
          </div>
        ) : null}

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Envio</span>
            <span className="font-semibold text-foreground">
              {deliveryConfig?.costStatus === "to_be_confirmed"
                ? "A coordinar"
                : formatCurrency(shippingCost)}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {shippingDescription}
          </p>
          <div className="flex justify-between gap-4 border-t border-border pt-4">
            <span className="font-display text-lg font-semibold text-foreground">
              Total
            </span>
            <span className="font-display text-2xl font-semibold text-foreground">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
