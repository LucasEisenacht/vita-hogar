import type { OrderDetails } from "@/lib/orders/types";
import { formatOrderDateTime } from "@/lib/orders/format-order-date";
import { getOrderStatusLabel } from "@/lib/orders/status";
import type { OrderStatus } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";

type TimelineStep = {
  date?: string;
  description: string;
  key: OrderStatus;
  label: string;
};

const shippingSteps: Array<Omit<TimelineStep, "date">> = [
  {
    description: "Recibimos tu pedido y reservamos los productos.",
    key: "pending_payment",
    label: "Pedido recibido",
  },
  {
    description: "El pago fue acreditado.",
    key: "payment_confirmed",
    label: "Pago confirmado",
  },
  {
    description: "Estamos preparando tu compra.",
    key: "preparing",
    label: "En preparacion",
  },
  {
    description: "El pedido ya esta listo para salir.",
    key: "ready",
    label: "Listo para despachar",
  },
  {
    description: "Tu pedido fue despachado.",
    key: "shipped",
    label: "Despachado",
  },
  {
    description: "El pedido fue entregado.",
    key: "delivered",
    label: "Entregado",
  },
];

const pickupSteps: Array<Omit<TimelineStep, "date">> = [
  shippingSteps[0],
  shippingSteps[1],
  shippingSteps[2],
  {
    description: "Coordinamos el retiro por WhatsApp.",
    key: "ready",
    label: "Listo para retirar",
  },
  shippingSteps[5],
];

function getHistoryDate(order: OrderDetails, status: OrderStatus) {
  return order.history.find((entry) => entry.newStatus === status)?.createdAt;
}

function getStepDate(order: OrderDetails, status: OrderStatus) {
  if (status === "pending_payment") {
    return order.createdAt;
  }

  if (status === "payment_confirmed") {
    return order.paidAt ?? getHistoryDate(order, status);
  }

  if (status === "shipped") {
    return order.shippedAt ?? getHistoryDate(order, status);
  }

  if (status === "delivered") {
    return order.deliveredAt ?? getHistoryDate(order, status);
  }

  return getHistoryDate(order, status);
}

function getStatusIndex(steps: Array<TimelineStep>, status: OrderStatus) {
  return steps.findIndex((step) => step.key === status);
}

export function OrderTimeline({ order }: { order: OrderDetails }) {
  const baseSteps = order.deliveryMethod === "pickup" ? pickupSteps : shippingSteps;
  const steps = baseSteps.map((step) => ({
    ...step,
    date: getStepDate(order, step.key),
  }));
  const currentIndex = getStatusIndex(steps, order.status);
  const cancelledDate =
    order.cancelledAt ?? getHistoryDate(order, "cancelled") ?? order.createdAt;

  return (
    <Card>
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Seguimiento
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Estado actual: {getOrderStatusLabel(order.status)}
          </p>
        </div>

        {order.status === "cancelled" ? (
          <div className="rounded-[22px] border border-destructive/20 bg-destructive/10 p-4">
            <p className="font-semibold text-destructive">Pedido cancelado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatOrderDateTime(cancelledDate)}
            </p>
          </div>
        ) : null}

        <ol className="grid gap-4">
          {steps.map((step, index) => {
            const isCompleted =
              order.status !== "cancelled" &&
              currentIndex >= 0 &&
              index < currentIndex;
            const isCurrent =
              order.status !== "cancelled" &&
              (index === currentIndex ||
                (currentIndex < 0 && step.key === "pending_payment"));
            const statusLabel = isCompleted
              ? "Completado"
              : isCurrent
                ? "Actual"
                : "Pendiente";

            return (
              <li
                className="grid gap-3 rounded-[22px] border border-border bg-surface p-4 sm:grid-cols-[16px_minmax(0,1fr)_auto] sm:items-start"
                key={step.key}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1 h-3.5 w-3.5 rounded-full ${
                    isCompleted || isCurrent
                      ? "bg-primary shadow-[0_0_16px_rgba(223,165,185,0.45)]"
                      : "bg-muted"
                  }`}
                />
                <div>
                  <p className="font-semibold text-foreground">{step.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                  {step.date ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-hover">
                      {formatOrderDateTime(step.date)}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {statusLabel}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
