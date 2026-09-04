import Link from "next/link";
import type { PublicOrder } from "@/lib/orders/types";
import { paymentStatusLabels } from "@/config/checkout";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDate } from "@/lib/orders/format-order-date";
import { deliveryMethodLabels } from "@/lib/orders/queries";
import { formatOrderNumber } from "@/lib/orders/status";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OrderSummaryProps = {
  href: string;
  order: PublicOrder;
};

export function OrderSummary({ href, order }: OrderSummaryProps) {
  return (
    <Card>
      <CardContent className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <span className="text-sm text-muted-foreground">
              {formatOrderDate(order.createdAt)}
            </span>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {formatOrderNumber(order.orderNumber)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {order.itemCount} articulos
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="rounded-full border border-border bg-surface-soft px-3 py-1">
                {paymentStatusLabels[order.paymentStatus]}
              </span>
              <span className="rounded-full border border-border bg-surface-soft px-3 py-1">
                {deliveryMethodLabels[order.deliveryMethod]}
              </span>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:justify-items-end">
          <p className="font-display text-2xl font-semibold text-foreground">
            {formatCurrency(order.total)}
          </p>
          <Link
            className={buttonStyles({ size: "sm", variant: "secondary" })}
            href={href}
          >
            Ver detalle
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
