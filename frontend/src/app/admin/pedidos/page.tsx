import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminOrderList } from "@/components/admin/orders/admin-order-list";
import { OrderSummaryCards } from "@/components/admin/orders/order-summary-cards";
import { buttonStyles } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAdminOrderCounts,
  getAdminOrders,
} from "@/lib/orders/queries";
import { paymentStatusLabels } from "@/config/checkout";
import { getOrderStatusLabel, isOrderStatus } from "@/lib/orders/status";
import type { OrderStatus, PaymentStatus } from "@/types/database";

type AdminOrdersPageProps = {
  searchParams: Promise<{
    desde?: string;
    estado?: string;
    hasta?: string;
    pago?: string;
    q?: string;
  }>;
};

const filterItems: Array<{
  label: string;
  status?: OrderStatus;
}> = [
  { label: "Todos" },
  { label: "Pendientes", status: "pending_payment" },
  { label: getOrderStatusLabel("payment_confirmed"), status: "payment_confirmed" },
  { label: "Preparando", status: "preparing" },
  { label: getOrderStatusLabel("shipped"), status: "shipped" },
  { label: getOrderStatusLabel("delivered"), status: "delivered" },
  { label: getOrderStatusLabel("cancelled"), status: "cancelled" },
];

const paymentFilters: Array<{
  label: string;
  status?: PaymentStatus;
}> = [
  { label: "Todos" },
  { label: paymentStatusLabels.pending, status: "pending" },
  { label: paymentStatusLabels.approved, status: "approved" },
  { label: paymentStatusLabels.rejected, status: "rejected" },
];

function isPaymentStatus(value: string): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "refunded" ||
    value === "cancelled"
  );
}

const buenosAiresUtcOffsetHours = 3;

function parseDateInput(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, buenosAiresUtcOffsetHours));
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const { role, user } = await requireAdmin();
  const { desde, estado, hasta, pago, q } = await searchParams;
  const status = estado && isOrderStatus(estado) ? estado : undefined;
  const paymentStatus = pago && isPaymentStatus(pago) ? pago : undefined;
  const dateFrom = parseDateInput(desde);
  const dateTo = parseDateInput(hasta);
  const [orders, counts] = await Promise.all([
    getAdminOrders({
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo ? addUtcDays(dateTo, 1).toISOString() : undefined,
      paymentStatus,
      search: q,
      status,
    }),
    getAdminOrderCounts(),
  ]);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const exportQuery = new URLSearchParams();

  if (status) {
    exportQuery.set("estado", status);
  }

  if (paymentStatus) {
    exportQuery.set("pago", paymentStatus);
  }

  if (q) {
    exportQuery.set("q", q);
  }

  if (desde && dateFrom) {
    exportQuery.set("desde", desde);
  }

  if (hasta && dateTo) {
    exportQuery.set("hasta", hasta);
  }

  return (
    <div className="space-y-8">
      <AdminHeader
        roleLabel={getRoleLabel(role)}
        subtitle="Gestiona compras reales, estados y seguimiento operativo."
        title="Pedidos"
        userName={userName}
      />
      <OrderSummaryCards counts={counts} />
      <form className="grid gap-3 rounded-[28px] border border-border bg-surface/80 p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
        <label className="sr-only" htmlFor="q">
          Buscar pedido
        </label>
        <input
          className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
          defaultValue={q ?? ""}
          id="q"
          name="q"
          placeholder="Buscar por pedido, email, nombre o telefono"
        />
        <div className="grid gap-1">
          <label
            className="px-1 text-xs font-semibold text-muted-foreground"
            htmlFor="desde"
          >
            Desde
          </label>
          <input
            className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={desde ?? ""}
            id="desde"
            name="desde"
            type="date"
          />
        </div>
        <div className="grid gap-1">
          <label
            className="px-1 text-xs font-semibold text-muted-foreground"
            htmlFor="hasta"
          >
            Hasta
          </label>
          <input
            className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={hasta ?? ""}
            id="hasta"
            name="hasta"
            type="date"
          />
        </div>
        {status ? <input name="estado" type="hidden" value={status} /> : null}
        {paymentStatus ? (
          <input name="pago" type="hidden" value={paymentStatus} />
        ) : null}
        <button
          className={buttonStyles({ size: "sm", variant: "primary" })}
          type="submit"
        >
          Buscar
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-muted-foreground">
          Fechas interpretadas en America/Argentina/Buenos_Aires.
        </p>
        <Link
          className={buttonStyles({ size: "sm", variant: "secondary" })}
          href={`/admin/pedidos/exportar${
            exportQuery.size > 0 ? `?${exportQuery}` : ""
          }`}
        >
          Exportar CSV
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {filterItems.map((filter) => {
          const isActive = filter.status === status || (!filter.status && !status);
          const query = new URLSearchParams();

          if (filter.status) {
            query.set("estado", filter.status);
          }

          if (paymentStatus) {
            query.set("pago", paymentStatus);
          }

          if (q) {
            query.set("q", q);
          }

          if (desde && dateFrom) {
            query.set("desde", desde);
          }

          if (hasta && dateTo) {
            query.set("hasta", hasta);
          }

          return (
            <Link
              className={buttonStyles({
                size: "sm",
                variant: isActive ? "primary" : "secondary",
              })}
              href={`/admin/pedidos${query.size > 0 ? `?${query}` : ""}`}
              key={filter.label}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {paymentFilters.map((filter) => {
          const isActive =
            filter.status === paymentStatus || (!filter.status && !paymentStatus);
          const query = new URLSearchParams();

          if (status) {
            query.set("estado", status);
          }

          if (filter.status) {
            query.set("pago", filter.status);
          }

          if (q) {
            query.set("q", q);
          }

          if (desde && dateFrom) {
            query.set("desde", desde);
          }

          if (hasta && dateTo) {
            query.set("hasta", hasta);
          }

          return (
            <Link
              className={buttonStyles({
                size: "sm",
                variant: isActive ? "primary" : "secondary",
              })}
              href={`/admin/pedidos${query.size > 0 ? `?${query}` : ""}`}
              key={filter.label}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>
      <AdminOrderList orders={orders} />
    </div>
  );
}
