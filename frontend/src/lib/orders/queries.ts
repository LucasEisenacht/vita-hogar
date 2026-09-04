import { notFound } from "next/navigation";
import { deliveryMethodLabels } from "@/config/checkout";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminOrderSummary,
  OrderDetails,
  PublicOrder,
  PublicOrderItem,
  ShippingAddressInput,
} from "@/lib/orders/types";
import type {
  OrderEmailEventType,
  OrderEmailOutboxSummary,
  OrderEmailStatus,
} from "@/lib/email/types";
import { isOrderStatus } from "@/lib/orders/status";
import type {
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  PaymentMethod,
  PaymentStatus,
  ProductAvailabilityType,
  ProductCondition,
  ShippingCostStatus,
} from "@/types/database";

export { deliveryMethodLabels };

const orderSummarySelect =
  "id, order_number, status, payment_status, delivery_method, total, created_at" as const;
const orderListSelect =
  "id, order_number, status, payment_status, total, created_at, customer_first_name, customer_last_name, customer_email, customer_phone, delivery_method" as const;
const orderDetailSelect =
  "id, order_number, status, payment_status, payment_method, delivery_method, shipping_address, shipping_cost, shipping_cost_status, subtotal, total, currency, customer_first_name, customer_last_name, customer_email, customer_phone, customer_dni, customer_notes, created_at, paid_at, shipped_at, delivered_at, cancelled_at" as const;
const orderHistoryPublicSelect =
  "id, order_id, previous_status, new_status, public_note, created_at" as const;

type OrderCustomerNameSource = Pick<
  Order,
  "customer_first_name" | "customer_last_name"
>;
type OrderDetailRow = Pick<
  Order,
  | "created_at"
  | "currency"
  | "customer_dni"
  | "customer_email"
  | "customer_first_name"
  | "customer_last_name"
  | "customer_notes"
  | "customer_phone"
  | "cancelled_at"
  | "delivered_at"
  | "delivery_method"
  | "id"
  | "order_number"
  | "payment_method"
  | "payment_status"
  | "paid_at"
  | "shipping_address"
  | "shipping_cost"
  | "shipping_cost_status"
  | "shipped_at"
  | "status"
  | "subtotal"
  | "total"
> & {
  admin_notes?: string | null;
};
type OrderHistoryRow = Pick<
  OrderStatusHistory,
  "created_at" | "id" | "new_status" | "previous_status" | "public_note"
> & {
  internal_note?: string | null;
  note?: string | null;
};

function normalizeOptional(value: string | null | undefined) {
  return value ?? undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

function normalizeAddress(value: unknown): ShippingAddressInput | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    apartment:
      typeof value.apartment === "string" ? value.apartment : undefined,
    city: typeof value.city === "string" ? value.city : undefined,
    postalCode:
      typeof value.postalCode === "string" ? value.postalCode : undefined,
    province: typeof value.province === "string" ? value.province : undefined,
    reference:
      typeof value.reference === "string" ? value.reference : undefined,
    street: typeof value.street === "string" ? value.street : undefined,
    streetNumber:
      typeof value.streetNumber === "string"
        ? value.streetNumber
        : typeof value.number === "string"
          ? value.number
          : undefined,
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function isDeliveryMethod(value: string | undefined): value is DeliveryMethod {
  return (
    value === "pickup" ||
    value === "amba_courier" ||
    value === "nationwide_shipping"
  );
}

function isPaymentMethod(value: string | undefined): value is PaymentMethod {
  return value === "bank_transfer";
}

function isPaymentStatus(value: string | undefined): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "refunded" ||
    value === "cancelled"
  );
}

function isShippingCostStatus(
  value: string | undefined,
): value is ShippingCostStatus {
  return value === "fixed" || value === "to_be_confirmed";
}

function isOrderEmailEventType(
  value: string | undefined,
): value is OrderEmailEventType {
  return (
    value === "order_delivered" ||
    value === "order_received" ||
    value === "order_shipped" ||
    value === "payment_confirmed"
  );
}

function isOrderEmailStatus(value: string | undefined): value is OrderEmailStatus {
  return (
    value === "pending" ||
    value === "processing" ||
    value === "sent" ||
    value === "failed"
  );
}

function getProductAvailabilityType(
  value: unknown,
): ProductAvailabilityType {
  return value === "made_to_order" ? "made_to_order" : "in_stock";
}

function getProductCondition(value: unknown): ProductCondition {
  return value === "used" || value === "refurbished" ? value : "new";
}

function getBuyerType(value: unknown): "guest" | "registered" | undefined {
  return value === "guest" || value === "registered" ? value : undefined;
}

function parseEmailOutboxSummary(
  value: unknown,
): OrderEmailOutboxSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  const eventType = getString(value.eventType);
  const status = getString(value.status);

  if (!isOrderEmailEventType(eventType) || !isOrderEmailStatus(status)) {
    return null;
  }

  return {
    attempts: getNumber(value.attempts) ?? 0,
    eventType,
    lastError: getString(value.lastError),
    providerMessageId: getString(value.providerMessageId),
    sentAt: getString(value.sentAt),
    status,
    updatedAt: getString(value.updatedAt),
  };
}

function getCustomerName(order: OrderCustomerNameSource) {
  return [order.customer_first_name, order.customer_last_name]
    .filter(Boolean)
    .join(" ");
}

function getItemCount(items: Array<OrderItem>) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function mapOrderItem(item: OrderItem): PublicOrderItem {
  return {
    availabilityType: item.availability_type,
    id: item.id,
    imageUrl: normalizeOptional(item.image_url),
    lineTotal: item.line_total,
    productCondition: item.product_condition ?? undefined,
    productName: item.product_name,
    productSlug: normalizeOptional(item.product_slug),
    quantity: item.quantity,
    selectedColor: normalizeOptional(item.selected_color),
    selectedCompatibility: normalizeOptional(item.selected_compatibility),
    unitPrice: item.unit_price,
    variantBrand: normalizeOptional(item.variant_brand),
    variantId: normalizeOptional(item.variant_id),
    variantModel: normalizeOptional(item.variant_model),
  };
}

function mapOrderDetails({
  history,
  items,
  order,
  showPrivateNotes = false,
}: {
  history: Array<OrderHistoryRow>;
  items: Array<OrderItem>;
  order: OrderDetailRow;
  showPrivateNotes?: boolean;
}): OrderDetails {
  return {
    adminNotes: showPrivateNotes
      ? normalizeOptional(order.admin_notes)
      : undefined,
    createdAt: order.created_at,
    currency: order.currency,
    customerDni: normalizeOptional(order.customer_dni),
    customerEmail: order.customer_email,
    customerName: getCustomerName(order),
    customerNotes: normalizeOptional(order.customer_notes),
    customerPhone: order.customer_phone,
    cancelledAt: normalizeOptional(order.cancelled_at),
    deliveryMethod: order.delivery_method,
    history: history.map((entry) => ({
      createdAt: entry.created_at,
      id: entry.id,
      newStatus: entry.new_status,
      note: showPrivateNotes
        ? normalizeOptional(entry.internal_note ?? entry.note)
        : normalizeOptional(entry.public_note),
      previousStatus: entry.previous_status ?? undefined,
    })),
    id: order.id,
    itemCount: getItemCount(items),
    items: items.map(mapOrderItem),
    orderNumber: order.order_number,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    paidAt: normalizeOptional(order.paid_at),
    deliveredAt: normalizeOptional(order.delivered_at),
    shippedAt: normalizeOptional(order.shipped_at),
    shippingAddress: normalizeAddress(order.shipping_address),
    shippingCost: order.shipping_cost,
    shippingCostStatus: order.shipping_cost_status,
    status: order.status,
    subtotal: order.subtotal,
    total: order.total,
  };
}

async function getItemsByOrderIds(orderIds: Array<string>) {
  if (orderIds.length === 0) {
    return new Map<string, Array<OrderItem>>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("No pudimos cargar los pedidos.");
  }

  const itemsByOrderId = new Map<string, Array<OrderItem>>();

  (data ?? []).forEach((item) => {
    const items = itemsByOrderId.get(item.order_id) ?? [];
    items.push(item);
    itemsByOrderId.set(item.order_id, items);
  });

  return itemsByOrderId;
}

export async function getCurrentUserOrders(): Promise<Array<PublicOrder>> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSummarySelect)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error("No pudimos cargar tus pedidos.");
  }

  const orders = data ?? [];
  const itemsByOrderId = await getItemsByOrderIds(
    orders.map((order) => order.id),
  );

  return orders.map((order) => ({
    createdAt: order.created_at,
    deliveryMethod: order.delivery_method,
    id: order.id,
    itemCount: getItemCount(itemsByOrderId.get(order.id) ?? []),
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
    status: order.status,
    total: order.total,
  }));
}

export async function getCurrentUserOrderDetails(orderId: string) {
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(orderDetailSelect)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
  }

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_status_history")
      .select(orderHistoryPublicSelect)
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
  ]);

  return mapOrderDetails({
    history: history ?? [],
    items: items ?? [],
    order,
    showPrivateNotes: false,
  });
}

export async function getAdminOrders({
  dateFrom,
  dateTo,
  limit = 80,
  paymentStatus,
  search,
  status,
}: {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  paymentStatus?: PaymentStatus;
  search?: string;
  status?: OrderStatus;
} = {}): Promise<Array<AdminOrderSummary>> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(orderListSelect)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (paymentStatus) {
    query = query.eq("payment_status", paymentStatus);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lt("created_at", dateTo);
  }

  const normalizedSearch = search?.replace(/\s+/g, " ").trim();

  if (normalizedSearch) {
    query = query.or(
      [
        `order_number.ilike.%${normalizedSearch}%`,
        `customer_email.ilike.%${normalizedSearch}%`,
        `customer_first_name.ilike.%${normalizedSearch}%`,
        `customer_last_name.ilike.%${normalizedSearch}%`,
        `customer_phone.ilike.%${normalizedSearch}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("No pudimos cargar los pedidos.");
  }

  const orders = data ?? [];
  const itemsByOrderId = await getItemsByOrderIds(
    orders.map((order) => order.id),
  );

  return orders.map((order) => ({
    createdAt: order.created_at,
    customerEmail: order.customer_email,
    customerName: getCustomerName(order),
    customerPhone: order.customer_phone,
    deliveryMethod: order.delivery_method,
    id: order.id,
    itemCount: getItemCount(itemsByOrderId.get(order.id) ?? []),
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
    status: order.status,
    total: order.total,
  }));
}

function parseOrderDetailsPayload(
  data: Record<string, unknown>,
): OrderDetails | null {
  const confirmationItems = toRecordArray(data.items);
  const confirmationHistory = toRecordArray(data.history);
  const status = getString(data.status);
  const paymentStatus = getString(data.paymentStatus);
  const shippingMethod = getString(data.shippingMethod);
  const paymentMethod = getString(data.paymentMethod);
  const orderNumberValue = getString(data.orderNumber);
  const createdAt = getString(data.createdAt);
  const currency = getString(data.currency);
  const subtotal = getNumber(data.subtotal);
  const shippingCost = getNumber(data.shippingCost);
  const total = getNumber(data.total);
  const shippingCostStatus = getString(data.shippingCostStatus);

  if (
    !status ||
    !isOrderStatus(status) ||
    !orderNumberValue ||
    !createdAt ||
    currency !== "ARS" ||
    !isPaymentStatus(paymentStatus) ||
    !isPaymentMethod(paymentMethod) ||
    !isDeliveryMethod(shippingMethod) ||
    subtotal === undefined ||
    shippingCost === undefined ||
    total === undefined ||
    !isShippingCostStatus(shippingCostStatus)
  ) {
    return null;
  }

  return {
    adminNotes: getString(data.adminNotes),
    buyerType: getBuyerType(data.buyerType),
    createdAt,
    currency,
    customerDni: getString(data.customerDni),
    customerEmail: getString(data.customerEmail) ?? "",
    customerName:
      getString(data.customerName) ??
      getString(data.customerFirstName) ??
      "Cliente",
    customerNotes: getString(data.customerNotes),
    customerPhone: getString(data.customerPhone) ?? "",
    deliveryMethod: shippingMethod,
    history: confirmationHistory.map((entry, index) => ({
      createdAt: getString(entry.createdAt) ?? createdAt,
      id: getString(entry.id) ?? `${orderNumberValue}-${index}`,
      newStatus: isOrderStatus(getString(entry.newStatus) ?? "")
        ? (getString(entry.newStatus) as OrderStatus)
        : status,
      note: getString(entry.note),
      previousStatus: isOrderStatus(getString(entry.previousStatus) ?? "")
        ? (getString(entry.previousStatus) as OrderStatus)
        : undefined,
    })),
    id: getString(data.id) ?? orderNumberValue,
    itemCount: confirmationItems.reduce((totalItems, item) => {
      return totalItems + (getNumber(item.quantity) ?? 0);
    }, 0),
    items: confirmationItems.map((item, index) => ({
      availabilityType: getProductAvailabilityType(item.availabilityType),
      id: getString(item.id) ?? `${orderNumberValue}-item-${index}`,
      imageUrl: getString(item.imageUrl),
      lineTotal: getNumber(item.lineTotal) ?? 0,
      productCondition: getProductCondition(item.productCondition),
      productName: getString(item.productName) ?? "Producto",
      productSlug: getString(item.productSlug),
      quantity: getNumber(item.quantity) ?? 0,
      selectedColor: getString(item.selectedColor),
      selectedCompatibility: getString(item.selectedCompatibility),
      unitPrice: getNumber(item.unitPrice) ?? 0,
      variantBrand: getString(item.variantBrand),
      variantId: getString(item.variantId),
      variantModel: getString(item.variantModel),
    })),
    orderNumber: orderNumberValue,
    paymentMethod,
    paymentStatus,
    paidAt: getString(data.paidAt),
    emailOutbox: toRecordArray(data.emailOutbox)
      .map(parseEmailOutboxSummary)
      .filter((entry): entry is OrderEmailOutboxSummary => entry !== null),
    shippingAddress: normalizeAddress(data.shippingAddress),
    shippingCost,
    shippingCostStatus,
    status,
    subtotal,
    total,
  };
}

export async function getAdminOrderDetails(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_order_details", {
    order_id_value: orderId,
  });

  if (error || !isRecord(data)) {
    notFound();
  }

  const order = parseOrderDetailsPayload(data);

  if (!order) {
    notFound();
  }

  return order;
}

export async function getAdminOrderCounts() {
  await requireAdmin();
  const supabase = await createClient();
  const statuses: Array<OrderStatus> = [
    "pending_payment",
    "payment_confirmed",
    "preparing",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const [allResult, ...statusResults] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    ...statuses.map((status) =>
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", status),
    ),
  ]);

  if (allResult.error || statusResults.some((result) => result.error)) {
    throw new Error("No pudimos cargar los contadores de pedidos.");
  }

  return statuses.reduce(
    (counts, status, index) => ({
      ...counts,
      [status]: statusResults[index]?.count ?? 0,
    }),
    {
      all: allResult.count ?? 0,
      cancelled: 0,
      delivered: 0,
      payment_confirmed: 0,
      pending_payment: 0,
      preparing: 0,
      ready: 0,
      shipped: 0,
    } satisfies Record<OrderStatus | "all", number>,
  );
}

export async function getOrderConfirmation(
  orderNumber: string,
  confirmationToken: string,
): Promise<OrderDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_order_confirmation", {
    confirmation_token_value: confirmationToken,
    order_number_value: orderNumber,
  });

  if (error || !isRecord(data)) {
    return null;
  }

  return parseOrderDetailsPayload(data);
}
