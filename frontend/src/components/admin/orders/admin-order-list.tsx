import Link from "next/link";
import type { AdminOrderSummary } from "@/lib/orders/types";
import { deliveryMethodLabels } from "@/lib/orders/queries";
import { paymentStatusLabels } from "@/config/checkout";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDate } from "@/lib/orders/format-order-date";
import { formatOrderNumber } from "@/lib/orders/status";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AdminOrderListProps = {
  orders: Array<AdminOrderSummary>;
};

export function AdminOrderList({ orders }: AdminOrderListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            No hay pedidos para mostrar
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Los pedidos nuevos van a aparecer en esta seccion.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.1fr_1fr_1fr_auto] xl:items-center">
            <div className="space-y-2">
              <OrderStatusBadge status={order.status} />
              <h2 className="font-display text-2xl font-semibold text-foreground">
                {formatOrderNumber(order.orderNumber)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatOrderDate(order.createdAt)}
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">
                {order.customerName}
              </p>
              <p className="text-muted-foreground">{order.customerPhone}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">
                {formatCurrency(order.total)}
              </p>
              <p className="text-muted-foreground">
                {deliveryMethodLabels[order.deliveryMethod]}
              </p>
              <p className="text-muted-foreground">
                {paymentStatusLabels[order.paymentStatus]}
              </p>
              <p className="text-muted-foreground">
                {order.itemCount} articulos
              </p>
            </div>
            <Link
              className={buttonStyles({ size: "sm", variant: "secondary" })}
              href={`/admin/pedidos/${order.id}`}
            >
              Ver pedido
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
