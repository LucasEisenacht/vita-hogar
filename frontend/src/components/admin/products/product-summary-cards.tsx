import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type ProductSummaryCardsProps = {
  activeCount: number;
  featuredCount: number;
  outOfStockCount: number;
  totalCount: number;
};

type SummaryCard = {
  label: ReactNode;
  value: number;
};

export function ProductSummaryCards({
  activeCount,
  featuredCount,
  outOfStockCount,
  totalCount,
}: ProductSummaryCardsProps) {
  const cards: Array<SummaryCard> = [
    { label: "Total", value: totalCount },
    { label: "Activos", value: activeCount },
    { label: "Sin stock", value: outOfStockCount },
    { label: "Destacados", value: featuredCount },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card className="bg-surface/95" key={String(card.label)}>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {card.label}
            </p>
            <p className="font-display text-3xl font-semibold text-foreground">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
