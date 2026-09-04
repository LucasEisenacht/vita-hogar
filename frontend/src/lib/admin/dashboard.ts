import { requireAdmin } from "@/lib/auth/require-admin";
import { formatCurrency } from "@/lib/format-currency";
import { getAdminOrders } from "@/lib/orders/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import type { AdminOrderSummary } from "@/lib/orders/types";
import type { OrderStatus, PaymentStatus } from "@/types/database";

export type AdminDashboardRange = "today" | "7d" | "30d";

export type AdminDashboardData = {
  averageTicket: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    slug: string;
    stock: number;
  }>;
  monthSales: number;
  newCustomers: number;
  pendingOrders: number;
  pendingPayments: number;
  range: AdminDashboardRange;
  rangeLabel: string;
  rangeOrderCount: number;
  rangeSales: number;
  statusBreakdown: Array<{
    count: number;
    label: string;
    status: OrderStatus;
  }>;
  todayOrderCount: number;
  todaySales: number;
  topProducts: Array<{
    productId: string | null;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  latestOrders: Array<AdminOrderSummary>;
};

const buenosAiresUtcOffsetHours = 3;
const lowStockThreshold = 3;

const rangeLabels: Record<AdminDashboardRange, string> = {
  "30d": "Ultimos 30 dias",
  "7d": "Ultimos 7 dias",
  today: "Hoy",
};

const activeOperationalStatuses: Array<OrderStatus> = [
  "pending_payment",
  "payment_confirmed",
  "preparing",
  "ready",
  "shipped",
];

const dashboardStatuses: Array<OrderStatus> = [
  "pending_payment",
  "payment_confirmed",
  "preparing",
  "ready",
  "shipped",
  "delivered",
];

function getBuenosAiresDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).formatToParts(date);

  return {
    day: Number(parts.find((part) => part.type === "day")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    year: Number(parts.find((part) => part.type === "year")?.value),
  };
}

function getBuenosAiresDayStart(date: Date) {
  const { day, month, year } = getBuenosAiresDateParts(date);

  return new Date(Date.UTC(year, month - 1, day, buenosAiresUtcOffsetHours));
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function getBuenosAiresMonthStart(date: Date) {
  const { month, year } = getBuenosAiresDateParts(date);

  return new Date(Date.UTC(year, month - 1, 1, buenosAiresUtcOffsetHours));
}

function getNextBuenosAiresMonthStart(date: Date) {
  const { month, year } = getBuenosAiresDateParts(date);

  return new Date(Date.UTC(year, month, 1, buenosAiresUtcOffsetHours));
}

export function normalizeAdminDashboardRange(
  value?: string | string[],
): AdminDashboardRange {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "today" || rawValue === "7d" || rawValue === "30d") {
    return rawValue;
  }

  return "7d";
}

function getRangeBounds(range: AdminDashboardRange, now = new Date()) {
  if (range === "today") {
    const start = getBuenosAiresDayStart(now);

    return {
      end: addUtcDays(start, 1),
      start,
    };
  }

  return {
    end: now,
    start: addUtcDays(now, range === "7d" ? -7 : -30),
  };
}

async function getApprovedSalesTotal({
  end,
  start,
}: {
  end: Date;
  start: Date;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("total")
    .eq("payment_status", "approved" satisfies PaymentStatus)
    .neq("status", "cancelled" satisfies OrderStatus)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw new Error("No pudimos calcular las ventas del dashboard.");
  }

  return (data ?? []).reduce((total, order) => total + order.total, 0);
}

async function getOrderCount({
  end,
  start,
}: {
  end: Date;
  start: Date;
}) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw new Error("No pudimos calcular los pedidos del dashboard.");
  }

  return count ?? 0;
}

async function getAverageTicket({
  end,
  start,
}: {
  end: Date;
  start: Date;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("total")
    .eq("payment_status", "approved" satisfies PaymentStatus)
    .neq("status", "cancelled" satisfies OrderStatus)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw new Error("No pudimos calcular el ticket promedio.");
  }

  if (!data || data.length === 0) {
    return 0;
  }

  return data.reduce((total, order) => total + order.total, 0) / data.length;
}

async function getStatusBreakdown({
  end,
  start,
}: {
  end: Date;
  start: Date;
}) {
  const supabase = await createClient();
  const results = await Promise.all(
    dashboardStatuses.map((status) =>
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString()),
    ),
  );

  if (results.some((result) => result.error)) {
    throw new Error("No pudimos calcular el estado de pedidos.");
  }

  return dashboardStatuses.map((status, index) => ({
    count: results[index]?.count ?? 0,
    label: getOrderStatusLabel(status),
    status,
  }));
}

async function getPendingOrders() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", activeOperationalStatuses);

  if (error) {
    throw new Error("No pudimos calcular pedidos pendientes.");
  }

  return count ?? 0;
}

async function getPendingPayments() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "pending" satisfies PaymentStatus)
    .neq("status", "cancelled" satisfies OrderStatus);

  if (error) {
    throw new Error("No pudimos calcular pagos pendientes.");
  }

  return count ?? 0;
}

async function getNewCustomers({
  end,
  start,
}: {
  end: Date;
  start: Date;
}) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw new Error("No pudimos calcular clientes nuevos.");
  }

  return count ?? 0;
}

async function getLowStockProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,stock")
    .eq("is_active", true)
    .lte("stock", lowStockThreshold)
    .order("stock", { ascending: true })
    .order("name", { ascending: true })
    .limit(8);

  if (error) {
    throw new Error("No pudimos cargar productos con stock bajo.");
  }

  return data ?? [];
}

async function getTopProducts({
  end,
  start,
}: {
  end: Date;
  start: Date;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "product_id,product_name,quantity,line_total,created_at,orders!inner(created_at,payment_status,status)",
    )
    .eq("orders.payment_status", "approved" satisfies PaymentStatus)
    .neq("orders.status", "cancelled" satisfies OrderStatus)
    .gte("orders.created_at", start.toISOString())
    .lt("orders.created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error("No pudimos cargar productos mas vendidos.");
  }

  const products = new Map<
    string,
    {
      productId: string | null;
      productName: string;
      quantity: number;
      revenue: number;
    }
  >();

  (data ?? []).forEach((item) => {
    const key = item.product_id ?? item.product_name;
    const current = products.get(key) ?? {
      productId: item.product_id,
      productName: item.product_name,
      quantity: 0,
      revenue: 0,
    };

    current.quantity += item.quantity;
    current.revenue += item.line_total;
    products.set(key, current);
  });

  return Array.from(products.values())
    .sort((first, second) => {
      if (first.quantity !== second.quantity) {
        return second.quantity - first.quantity;
      }

      return second.revenue - first.revenue;
    })
    .slice(0, 6);
}

export async function getAdminDashboardData(
  range: AdminDashboardRange,
): Promise<AdminDashboardData> {
  await requireAdmin();

  const now = new Date();
  const todayStart = getBuenosAiresDayStart(now);
  const todayEnd = addUtcDays(todayStart, 1);
  const monthStart = getBuenosAiresMonthStart(now);
  const monthEnd = getNextBuenosAiresMonthStart(now);
  const rangeBounds = getRangeBounds(range, now);

  const [
    todaySales,
    monthSales,
    rangeSales,
    todayOrderCount,
    rangeOrderCount,
    pendingOrders,
    pendingPayments,
    averageTicket,
    newCustomers,
    lowStockProducts,
    topProducts,
    statusBreakdown,
    latestOrders,
  ] = await Promise.all([
    getApprovedSalesTotal({ end: todayEnd, start: todayStart }),
    getApprovedSalesTotal({ end: monthEnd, start: monthStart }),
    getApprovedSalesTotal(rangeBounds),
    getOrderCount({ end: todayEnd, start: todayStart }),
    getOrderCount(rangeBounds),
    getPendingOrders(),
    getPendingPayments(),
    getAverageTicket(rangeBounds),
    getNewCustomers(rangeBounds),
    getLowStockProducts(),
    getTopProducts(rangeBounds),
    getStatusBreakdown(rangeBounds),
    getAdminOrders({ limit: 6 }),
  ]);

  return {
    averageTicket,
    latestOrders,
    lowStockProducts,
    monthSales,
    newCustomers,
    pendingOrders,
    pendingPayments,
    range,
    rangeLabel: rangeLabels[range],
    rangeOrderCount,
    rangeSales,
    statusBreakdown,
    todayOrderCount,
    todaySales,
    topProducts,
  };
}

export function formatDashboardMetricCurrency(value: number) {
  return value > 0 ? formatCurrency(value) : "$ 0";
}
