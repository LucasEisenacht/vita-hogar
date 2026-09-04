import { deliveryMethodLabels, paymentStatusLabels } from "@/config/checkout";
import { getPaymentMethodLabel } from "@/config/checkout";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatOrderDateTime } from "@/lib/orders/format-order-date";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from "@/types/database";

type ExportOrderRow = Pick<
  Order,
  | "created_at"
  | "currency"
  | "customer_email"
  | "customer_first_name"
  | "customer_last_name"
  | "customer_phone"
  | "delivery_method"
  | "id"
  | "order_number"
  | "payment_method"
  | "payment_status"
  | "shipping_address"
  | "status"
  | "subtotal"
  | "total"
>;

export type AdminOrderExportFilters = {
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus;
  search?: string;
  status?: OrderStatus;
};

const csvColumns: Array<{
  header: string;
  value: (order: ExportOrderRow, items: Array<OrderItem>) => string | number;
}> = [
  {
    header: "numero_pedido",
    value: (order) => order.order_number,
  },
  {
    header: "fecha_buenos_aires",
    value: (order) => formatOrderDateTime(order.created_at),
  },
  {
    header: "cliente",
    value: (order) =>
      [order.customer_first_name, order.customer_last_name]
        .filter(Boolean)
        .join(" "),
  },
  {
    header: "email",
    value: (order) => order.customer_email,
  },
  {
    header: "telefono",
    value: (order) => order.customer_phone,
  },
  {
    header: "subtotal_ars",
    value: (order) => order.subtotal,
  },
  {
    header: "total_ars",
    value: (order) => order.total,
  },
  {
    header: "moneda",
    value: (order) => order.currency,
  },
  {
    header: "estado_pedido",
    value: (order) => getOrderStatusLabel(order.status),
  },
  {
    header: "estado_pago",
    value: (order) => paymentStatusLabels[order.payment_status],
  },
  {
    header: "metodo_pago",
    value: (order) => getPaymentMethodLabel(order.payment_method),
  },
  {
    header: "metodo_entrega",
    value: (order) => deliveryMethodLabels[order.delivery_method],
  },
  {
    header: "provincia",
    value: (order) => getShippingAddressText(order.shipping_address, "province"),
  },
  {
    header: "localidad",
    value: (order) => getShippingAddressText(order.shipping_address, "city"),
  },
  {
    header: "cantidad_productos",
    value: (_order, items) =>
      items.reduce((total, item) => total + item.quantity, 0),
  },
  {
    header: "productos",
    value: (_order, items) =>
      items
        .map((item) => `${item.quantity} x ${item.product_name}`)
        .join(" | "),
  },
];

function escapeCsvValue(value: string | number) {
  if (typeof value === "number") {
    return String(value);
  }

  const normalizedValue = String(value).replace(/\r?\n/g, " ").trim();
  const safeValue = /^[=+\-@]/.test(normalizedValue)
    ? `'${normalizedValue}`
    : normalizedValue;

  if (/[",;\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  return safeValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getShippingAddressText(value: unknown, key: "city" | "province") {
  if (!isRecord(value)) {
    return "";
  }

  const addressValue = value[key];

  return typeof addressValue === "string" ? addressValue : "";
}

export function createOrdersCsv(
  orders: Array<ExportOrderRow>,
  itemsByOrderId: Map<string, Array<OrderItem>>,
) {
  const header = csvColumns.map((column) => column.header).join(",");
  const rows = orders.map((order) =>
    csvColumns
      .map((column) =>
        escapeCsvValue(column.value(order, itemsByOrderId.get(order.id) ?? [])),
      )
      .join(","),
  );

  return `\uFEFF${[header, ...rows].join("\r\n")}\r\n`;
}

export async function getOrdersCsv(filters: AdminOrderExportFilters) {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id,order_number,created_at,customer_first_name,customer_last_name,customer_email,customer_phone,subtotal,total,currency,status,payment_status,payment_method,delivery_method,shipping_address",
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lt("created_at", filters.dateTo);
  }

  const normalizedSearch = filters.search?.replace(/\s+/g, " ").trim();

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

  const { data: orders, error } = await query;

  if (error) {
    throw new Error("No pudimos exportar los pedidos.");
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: items, error: itemsError } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  if (itemsError) {
    throw new Error("No pudimos exportar los productos de los pedidos.");
  }

  const itemsByOrderId = new Map<string, Array<OrderItem>>();

  (items ?? []).forEach((item) => {
    const orderItems = itemsByOrderId.get(item.order_id) ?? [];

    orderItems.push(item);
    itemsByOrderId.set(item.order_id, orderItems);
  });

  return createOrdersCsv(orders ?? [], itemsByOrderId);
}
