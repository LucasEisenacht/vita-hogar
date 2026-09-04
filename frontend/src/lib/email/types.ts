import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingCostStatus,
} from "@/types/database";

export type OrderEmailEventType =
  | "order_delivered"
  | "order_received"
  | "order_shipped"
  | "payment_confirmed";
export type AuthEmailEventType = "user_welcome";
export type TransactionalEmailEventType =
  | AuthEmailEventType
  | OrderEmailEventType;
export type OrderEmailStatus = "failed" | "pending" | "processing" | "sent";
export type AuthEmailStatus = OrderEmailStatus;

export type OrderEmailOutboxSummary = {
  attempts: number;
  eventType: OrderEmailEventType;
  lastError?: string;
  providerMessageId?: string;
  sentAt?: string;
  status: OrderEmailStatus;
  updatedAt?: string;
};

export type OrderEmailPayloadItem = {
  lineTotal: number;
  productName: string;
  productSlug?: string;
  quantity: number;
  selectedColor?: string;
  selectedCompatibility?: string;
  unitPrice: number;
  variantBrand?: string;
  variantModel?: string;
};

export type OrderEmailPayload = {
  buyerType: "guest" | "registered";
  confirmationUrl?: string;
  createdAt: string;
  currency: "ARS";
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  deliveryMethod: DeliveryMethod;
  discountAmount: number;
  eventType: OrderEmailEventType;
  items: OrderEmailPayloadItem[];
  orderId: string;
  orderNumber: string;
  paidAt?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveredAt?: string;
  shippingAddress?: {
    city?: string;
    floorApartment?: string;
    number?: string;
    postalCode?: string;
    province?: string;
    references?: string;
    street?: string;
  };
  shippingCost: number;
  shippingCostStatus: ShippingCostStatus;
  shippedAt?: string;
  status?: OrderStatus;
  subtotal: number;
  total: number;
};

export type TransactionalEmail = {
  html: string;
  subject: string;
  text: string;
};

export type AuthWelcomeEmailPayload = {
  confirmedAt: string;
  createdAt: string;
  email: string;
  eventType: AuthEmailEventType;
  firstName?: string;
  fullName?: string;
  userId: string;
};
