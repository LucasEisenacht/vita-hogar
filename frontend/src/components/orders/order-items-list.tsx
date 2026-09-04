import Link from "next/link";
import type { PublicOrderItem } from "@/lib/orders/types";
import { getConditionLabel } from "@/lib/catalog/commerce";
import { formatCurrency } from "@/lib/format-currency";
import { Badge } from "@/components/ui/badge";

type OrderItemsListProps = {
  items: Array<PublicOrderItem>;
};

export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          className="grid gap-3 rounded-[24px] border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          key={item.id}
        >
          <div className="min-w-0 space-y-2">
            {item.productSlug ? (
              <Link
                className="font-display text-lg font-semibold text-foreground transition-colors duration-[250ms] hover:text-primary-hover"
                href={`/producto/${item.productSlug}`}
              >
                {item.productName}
              </Link>
            ) : (
              <p className="font-display text-lg font-semibold text-foreground">
                {item.productName}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{item.quantity} unidades</span>
              {item.availabilityType === "made_to_order" ? (
                <Badge variant="default">Por encargo</Badge>
              ) : null}
              {item.productCondition && item.productCondition !== "new" ? (
                <span>{getConditionLabel(item.productCondition)}</span>
              ) : null}
              {item.selectedColor ? <span>Color: {item.selectedColor}</span> : null}
              {item.variantId && item.variantBrand && item.variantModel ? (
                <span>
                  Modelo: {item.variantBrand} {item.variantModel}
                </span>
              ) : item.selectedCompatibility ? (
                <span>Compatibilidad: {item.selectedCompatibility}</span>
              ) : null}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">
              Unitario {formatCurrency(item.unitPrice)}
            </p>
            <p className="font-display text-xl font-semibold text-foreground">
              {formatCurrency(item.lineTotal)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
