import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  bankTransferConfig,
  checkoutHelpText,
  deliveryMethodLabels,
  getPaymentMethodLabel,
  getWhatsAppOrderUrl,
  paymentStatusLabels,
} from "@/config/checkout";
import { createNoIndexMetadata } from "@/lib/seo/metadata";
import { formatCurrency } from "@/lib/format-currency";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getOrderConfirmation } from "@/lib/orders/queries";
import { formatOrderNumber } from "@/lib/orders/status";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { OrderItemsList } from "@/components/orders/order-items-list";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

type ConfirmationPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export const metadata: Metadata = createNoIndexMetadata({
  description: "Confirmacion privada del pedido en W.todocell.",
  title: "Pedido recibido | W.todocell",
});

function buildWhatsAppMessage(orderNumber: string) {
  return [
    `Hola, quiero enviar el comprobante del pedido ${formatOrderNumber(orderNumber)}.`,
    "Quedo atenta a los datos para coordinar el pago y la entrega.",
  ].join("\n");
}

export default async function CheckoutConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const [{ orderNumber }, { token }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!token) {
    notFound();
  }

  const [order, user] = await Promise.all([
    getOrderConfirmation(orderNumber, token),
    getCurrentUser(),
  ]);

  if (!order) {
    notFound();
  }

  const whatsappUrl = getWhatsAppOrderUrl(buildWhatsAppMessage(order.orderNumber));

  return (
    <StorefrontPageShell intensity="low">
      <Container className="space-y-8 py-12 sm:py-16">
        <Card className="storefront-panel-strong">
          <CardContent className="mx-auto max-w-3xl space-y-6 p-8 text-center sm:p-10">
            <div className="mx-auto h-14 w-14 rounded-full border border-primary/25 bg-secondary" />
            <div className="space-y-3">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
                {formatOrderNumber(order.orderNumber)}
              </p>
              <h1 className="font-display text-4xl font-semibold text-foreground">
                Pedido recibido
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                {checkoutHelpText.confirmationIntro}
              </p>
              {order.customerEmail ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  En unos minutos recibiras un email en {order.customerEmail} con
                  el resumen de tu compra. Revisa tambien la carpeta de correo
                  no deseado.
                </p>
              ) : null}
              {order.buyerType === "registered" ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Tambien podes consultar el pedido desde Mi cuenta.
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-border bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
                  Pago
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {paymentStatusLabels[order.paymentStatus]}
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
                  Entrega
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {deliveryMethodLabels[order.deliveryMethod]}
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
                  Total
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <Card className="storefront-panel-strong">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Productos
              </h2>
              <OrderItemsList items={order.items} />
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="storefront-panel-strong">
              <CardContent className="space-y-4 p-6 text-sm sm:p-8">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Proximos pasos
                </h2>
                <p className="leading-6 text-muted-foreground">
                  Metodo: {getPaymentMethodLabel(order.paymentMethod)}.
                </p>
                <p className="leading-6 text-muted-foreground">
                  {bankTransferConfig.instructions}
                </p>
                <a
                  className={buttonStyles({
                    className: "w-full",
                    size: "lg",
                    variant: "primary",
                  })}
                  href={whatsappUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {checkoutHelpText.whatsappCta}
                </a>
              </CardContent>
            </Card>

            <Card className="storefront-panel-strong">
              <CardContent className="space-y-3 p-6 text-sm sm:p-8">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Envio</span>
                  <span className="font-semibold text-foreground">
                    {order.shippingCostStatus === "to_be_confirmed"
                      ? "A coordinar"
                      : formatCurrency(order.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-4">
                  <span className="font-display text-lg font-semibold text-foreground">
                    Total
                  </span>
                  <span className="font-display text-2xl font-semibold text-foreground">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className={buttonStyles({ size: "lg", variant: "secondary" })}
            href="/tienda"
          >
            Volver a la tienda
          </Link>
          {user ? (
            <Link
              className={buttonStyles({ size: "lg", variant: "secondary" })}
              href="/mi-cuenta/pedidos"
            >
              Ver mis pedidos
            </Link>
          ) : null}
        </div>
      </Container>
    </StorefrontPageShell>
  );
}
