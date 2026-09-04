import {
  orderStatusLabels,
  orderStatuses,
  type OrderStatus,
} from "@/config/checkout";

export { orderStatusLabels, orderStatuses };

export const orderStatusTransitions: Record<OrderStatus, Array<OrderStatus>> = {
  cancelled: [],
  delivered: [],
  payment_confirmed: ["preparing", "cancelled"],
  pending_payment: ["payment_confirmed", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

export function getOrderStatusLabel(status: OrderStatus) {
  return orderStatusLabels[status];
}

export function getNextOrderStatuses(status: OrderStatus) {
  return orderStatusTransitions[status];
}

export function formatOrderNumber(orderNumber: number | string) {
  if (typeof orderNumber === "string" && orderNumber.startsWith("WT-")) {
    return orderNumber;
  }

  return `WT-${String(orderNumber).padStart(6, "0")}`;
}
