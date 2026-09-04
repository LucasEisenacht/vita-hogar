import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductAvailabilityType,
  ProductCondition,
  ShippingCostStatus,
} from "@/types/database";
import type { OrderEmailOutboxSummary } from "@/lib/email/types";

export type ShippingAddressInput = {
  apartment?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  reference?: string;
  street?: string;
  streetNumber?: string;
};

export type CreateOrderCartItemInput = {
  clientUnitPrice: number;
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedCompatibility?: string;
  variantId?: string;
};

export type CreateOrderInput = {
  confirmationToken: string;
  customerDni?: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerNotes?: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  idempotencyKey: string;
  items: Array<CreateOrderCartItemInput>;
  paymentMethod: PaymentMethod;
  savedAddressId?: string;
  saveShippingAddress?: boolean;
  saveShippingAddressAsDefault?: boolean;
  shippingAddress?: ShippingAddressInput;
};

export type CreatedOrderItem = {
  availabilityType: ProductAvailabilityType;
  lineTotal: number;
  productCondition?: ProductCondition;
  productId: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  selectedColor?: string;
  selectedCompatibility?: string;
  unitPrice: number;
  variantBrand?: string;
  variantId?: string;
  variantModel?: string;
};

export type CreateOrderSuccess = {
  confirmationToken: string;
  currency: "ARS";
  id: string;
  items: Array<CreatedOrderItem>;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  shippingCost: number;
  shippingCostStatus: ShippingCostStatus;
  status: OrderStatus;
  subtotal: number;
  success: true;
  total: number;
};

export type CreateOrderResult =
  | CreateOrderSuccess
  | {
      message: string;
      success: false;
    };

export type PublicOrderItem = {
  availabilityType: ProductAvailabilityType;
  id: string;
  imageUrl?: string;
  lineTotal: number;
  productCondition?: ProductCondition;
  productName: string;
  productSlug?: string;
  quantity: number;
  selectedColor?: string;
  selectedCompatibility?: string;
  unitPrice: number;
  variantBrand?: string;
  variantId?: string;
  variantModel?: string;
};

export type PublicOrder = {
  createdAt: string;
  deliveryMethod: DeliveryMethod;
  id: string;
  itemCount: number;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  total: number;
};

export type OrderDetails = PublicOrder & {
  adminNotes?: string;
  buyerType?: "guest" | "registered";
  currency: "ARS";
  customerDni?: string;
  customerEmail: string;
  customerName: string;
  customerNotes?: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  history: Array<{
    createdAt: string;
    id: string;
    newStatus: OrderStatus;
    note?: string;
    previousStatus?: OrderStatus;
  }>;
  items: Array<PublicOrderItem>;
  paymentMethod: PaymentMethod;
  cancelledAt?: string;
  deliveredAt?: string;
  paidAt?: string;
  shippedAt?: string;
  emailOutbox?: Array<OrderEmailOutboxSummary>;
  shippingAddress?: ShippingAddressInput;
  shippingCost: number;
  shippingCostStatus: ShippingCostStatus;
  subtotal: number;
};

export type AdminOrderSummary = PublicOrder & {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
};

export type OrderStatusActionState = {
  message?: string;
  restoredStock?: number;
  status: "error" | "idle" | "success";
};

export type OrderEmailRetryActionState = {
  message?: string;
  processed?: number;
  status: "error" | "idle" | "success";
};
