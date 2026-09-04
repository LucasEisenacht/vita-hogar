import type { PublicProduct } from "@/lib/catalog/types";
import { getConditionLabel, isMadeToOrder } from "@/lib/catalog/commerce";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";

type ProductCommercialBadgesProps = {
  compact?: boolean;
  maxItems?: number;
  product: PublicProduct;
};

type ProductBadge = {
  label: string;
  variant: BadgeVariant;
};

function getNormalizedBadgeLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getProductBadges(product: PublicProduct) {
  const isOutOfStock =
    product.availabilityType === "in_stock" && product.stock <= 0;
  const hasFewUnits =
    product.availabilityType === "in_stock" &&
    product.stock > 0 &&
    product.stock <= 3;
  const isOnSale =
    typeof product.previousPrice === "number" &&
    product.previousPrice > product.price;
  const badges: Array<ProductBadge> = [];

  if (isOutOfStock) {
    badges.push({ label: "Sin stock", variant: "neutral" });
  }

  if (hasFewUnits) {
    badges.push({ label: "Ultimas unidades", variant: "sale" });
  }

  if (isOnSale) {
    badges.push({ label: "Oferta", variant: "sale" });
  }

  if (product.condition === "new") {
    badges.push({ label: "Nuevo", variant: "new" });
  } else {
    badges.push({
      label: getConditionLabel(product.condition),
      variant: "neutral",
    });
  }

  if (isMadeToOrder(product)) {
    badges.push({ label: "Por encargo", variant: "default" });
  }

  if (product.badge) {
    badges.push({ label: product.badge, variant: "new" });
  }

  const seenLabels = new Set<string>();

  return badges.filter((badge) => {
    const normalizedLabel = getNormalizedBadgeLabel(badge.label);

    if (seenLabels.has(normalizedLabel)) {
      return false;
    }

    seenLabels.add(normalizedLabel);
    return true;
  });
}

export function ProductCommercialBadges({
  compact = false,
  maxItems,
  product,
}: ProductCommercialBadgesProps) {
  const badges = getProductBadges(product).slice(0, maxItems);

  return (
    <div className={compact ? "flex flex-wrap items-center gap-1.5" : "flex flex-wrap items-center gap-2"}>
      {badges.map((badge) => (
        <Badge
          className={
            compact
              ? "h-6 whitespace-nowrap px-2.5 py-0 text-[10px] font-bold leading-none tracking-[0.08em]"
              : undefined
          }
          key={`${badge.variant}-${badge.label}`}
          variant={badge.variant}
        >
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
