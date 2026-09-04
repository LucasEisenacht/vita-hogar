import type { OrderStatus } from "@/types/database";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { Card, CardContent } from "@/components/ui/card";

type OrderSummaryCardsProps = {
  counts: Record<OrderStatus | "all", number>;
};

const cards: Array<{
  key: OrderStatus | "all";
  label: string;
}> = [
  { key: "all", label: "Todos" },
  { key: "pending_payment", label: "Pendientes de pago" },
  { key: "payment_confirmed", label: getOrderStatusLabel("payment_confirmed") },
  { key: "preparing", label: getOrderStatusLabel("preparing") },
  { key: "shipped", label: getOrderStatusLabel("shipped") },
  { key: "delivered", label: getOrderStatusLabel("delivered") },
  { key: "cancelled", label: getOrderStatusLabel("cancelled") },
];

export function OrderSummaryCards({ counts }: OrderSummaryCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <p className="text-sm font-semibold text-muted-foreground">
              {card.label}
            </p>
            <p className="font-display text-3xl font-semibold text-foreground">
              {counts[card.key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
