import type {
  ProductAvailabilityType,
  ProductCondition,
} from "@/types/database";
import type { PublicProduct } from "@/lib/catalog/types";

export const MADE_TO_ORDER_MAX_QUANTITY = 10;

const availabilityLabels: Record<ProductAvailabilityType, string> = {
  in_stock: "Stock inmediato",
  made_to_order: "Por encargo",
};

const conditionLabels: Record<ProductCondition, string> = {
  new: "Nuevo",
  refurbished: "Reacondicionado",
  used: "Usado",
};

export function getAvailabilityLabel(availabilityType: ProductAvailabilityType) {
  return availabilityLabels[availabilityType];
}

export function getConditionLabel(condition: ProductCondition) {
  return conditionLabels[condition];
}

export function isMadeToOrder(product: Pick<PublicProduct, "availabilityType">) {
  return product.availabilityType === "made_to_order";
}

export function isInStockProductAvailable(
  product: Pick<PublicProduct, "availabilityType" | "stock">,
) {
  return product.availabilityType === "made_to_order" || product.stock > 0;
}

export function getProductPurchaseLimit(
  product: Pick<PublicProduct, "availabilityType" | "stock">,
) {
  return product.availabilityType === "made_to_order"
    ? MADE_TO_ORDER_MAX_QUANTITY
    : Math.max(0, product.stock);
}
