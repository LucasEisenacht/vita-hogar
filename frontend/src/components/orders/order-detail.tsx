import type { OrderDetails } from "@/lib/orders/types";
import { deliveryMethodLabels } from "@/lib/orders/queries";
import { getPaymentMethodLabel, paymentStatusLabels } from "@/config/checkout";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDateTime } from "@/lib/orders/format-order-date";
import { formatOrderNumber, getOrderStatusLabel } from "@/lib/orders/status";
import { OrderItemsList } from "@/components/orders/order-items-list";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { Card, CardContent } from "@/components/ui/card";

type OrderDetailProps = {
  order: OrderDetails;
  showPrivateContact?: boolean;
};

const emailEventLabels = {
  order_delivered: "Pedido entregado",
  order_received: "Pedido recibido",
  order_shipped: "Pedido despachado",
  payment_confirmed: "Pago confirmado",
} as const;

const emailStatusLabels = {
  failed: "Con error",
  pending: "Pendiente",
  processing: "Procesando",
  sent: "Enviado",
} as const;

export function OrderDetail({
  order,
  showPrivateContact = false,
}: OrderDetailProps) {
  const hasMadeToOrderItems = order.items.some(
    (item) => item.availabilityType === "made_to_order",
  );
  const addressLine = order.shippingAddress?.street
    ? `${order.shippingAddress.street} ${order.shippingAddress.streetNumber ?? ""}${
        order.shippingAddress.apartment
          ? `, ${order.shippingAddress.apartment}`
          : ""
      }`
    : undefined;
  const locationLine = [
    order.shippingAddress?.city,
    order.shippingAddress?.province,
    order.shippingAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <span className="text-sm text-muted-foreground">
                {formatOrderDateTime(order.createdAt)}
              </span>
            </div>
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
                {formatOrderNumber(order.orderNumber)}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Detalle del pedido
              </h1>
            </div>
          </CardContent>
        </Card>

        <OrderTimeline order={order} />

        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Productos
            </h2>
            {showPrivateContact && hasMadeToOrderItems ? (
              <div className="rounded-[22px] border border-primary/20 bg-secondary/60 p-4 text-sm leading-6 text-primary-hover">
                Este pedido incluye productos por encargo. Confirm&aacute; tiempos,
                disponibilidad y preparaci&oacute;n antes de avanzar de estado.
              </div>
            ) : null}
            <OrderItemsList items={order.items} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Historial
            </h2>
            <div className="grid gap-3">
              {order.history.map((entry) => (
                <div
                  className="rounded-[20px] border border-border bg-surface p-4 text-sm"
                  key={entry.id}
                >
                  <p className="font-semibold text-foreground">
                    {entry.previousStatus
                      ? `${getOrderStatusLabel(entry.previousStatus)} -> ${getOrderStatusLabel(entry.newStatus)}`
                      : getOrderStatusLabel(entry.newStatus)}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {formatOrderDateTime(entry.createdAt)}
                  </p>
                  {entry.note ? (
                    <p className="mt-2 text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Resumen
            </h2>
            <div className="space-y-3 text-sm">
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5 text-sm sm:p-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Entrega
            </h2>
            <p className="font-semibold text-foreground">
              {deliveryMethodLabels[order.deliveryMethod]}
            </p>
            {addressLine ? (
              <p className="text-muted-foreground">{addressLine}</p>
            ) : null}
            {locationLine ? (
              <p className="text-muted-foreground">{locationLine}</p>
            ) : null}
            {order.customerNotes ? (
              <p className="text-muted-foreground">Nota: {order.customerNotes}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5 text-sm sm:p-6">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Pago
            </h2>
            <p className="font-semibold text-foreground">
              {getPaymentMethodLabel(order.paymentMethod)}
            </p>
            <p className="text-muted-foreground">
              {paymentStatusLabels[order.paymentStatus]}
            </p>
            {order.paidAt ? (
              <p className="text-muted-foreground">
                Confirmado: {formatOrderDateTime(order.paidAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {showPrivateContact ? (
          <Card>
            <CardContent className="space-y-4 p-5 text-sm sm:p-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Cliente
              </h2>
              <p className="font-semibold text-foreground">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerPhone}</p>
              {order.customerEmail ? (
                <p className="text-muted-foreground">{order.customerEmail}</p>
              ) : null}
              {order.buyerType ? (
                <p className="text-muted-foreground">
                  {order.buyerType === "registered"
                    ? "Comprador registrado"
                    : "Comprador invitado"}
                </p>
              ) : null}
              {order.customerDni ? (
                <p className="text-muted-foreground">DNI {order.customerDni}</p>
              ) : null}
              {order.adminNotes ? (
                <div className="rounded-[18px] border border-border bg-surface-soft p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
                    Nota interna
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {order.adminNotes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
        {showPrivateContact && order.emailOutbox ? (
          <Card>
            <CardContent className="space-y-4 p-5 text-sm sm:p-6">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Emails
              </h2>
              {order.emailOutbox.length > 0 ? (
                <div className="grid gap-3">
                  {order.emailOutbox.map((entry) => (
                    <div
                      className="rounded-[18px] border border-border bg-surface-soft p-3"
                      key={entry.eventType}
                    >
                      <p className="font-semibold text-foreground">
                        {emailEventLabels[entry.eventType]}
                      </p>
                      <p className="text-muted-foreground">
                        {emailStatusLabels[entry.status]}
                        {entry.sentAt
                          ? ` - ${formatOrderDateTime(entry.sentAt)}`
                          : ""}
                      </p>
                      {entry.status === "failed" && entry.lastError ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.lastError}
                        </p>
                      ) : null}
                      {entry.providerMessageId ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          ID proveedor: {entry.providerMessageId}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Todavia no hay emails encolados.
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
