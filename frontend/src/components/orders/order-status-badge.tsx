import type { OrderStatus } from "@/types/database";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { Badge } from "@/components/ui/badge";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const statusVariants: Record<
  OrderStatus,
  "default" | "neutral" | "new" | "sale" | "stock"
> = {
  cancelled: "neutral",
  delivered: "stock",
  payment_confirmed: "stock",
  pending_payment: "new",
  preparing: "default",
  ready: "sale",
  shipped: "default",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <Badge variant={statusVariants[status]}>{getOrderStatusLabel(status)}</Badge>;
}
