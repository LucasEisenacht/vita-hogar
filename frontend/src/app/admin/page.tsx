import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  formatDashboardMetricCurrency,
  getAdminDashboardData,
  normalizeAdminDashboardRange,
  type AdminDashboardRange,
} from "@/lib/admin/dashboard";
import { formatCurrency } from "@/lib/format-currency";
import { formatOrderDate } from "@/lib/orders/format-order-date";
import { formatOrderNumber } from "@/lib/orders/status";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

type AdminPageProps = {
  searchParams: Promise<{
    rango?: string;
  }>;
};

const rangeFilters: Array<{
  label: string;
  value: AdminDashboardRange;
}> = [
  { label: "Hoy", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
];

const quickLinks = [
  {
    description: "Seguimiento de compras, pagos y estados.",
    href: "/admin/pedidos",
    label: "Abrir pedidos",
    title: "Pedidos",
  },
  {
    description: "Catalogo, variantes, stock e imagenes.",
    href: "/admin/productos",
    label: "Abrir productos",
    title: "Productos",
  },
  {
    description: "Home editorial, destacados y contenido comercial.",
    href: "/admin/contenido",
    label: "Abrir contenido",
    title: "Contenido",
  },
  {
    description: "Roles administrativos y auditoria.",
    href: "/admin/usuarios",
    label: "Abrir usuarios",
    title: "Usuarios",
  },
];

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

function KpiCard({
  detail,
  label,
  tone = "neutral",
  value,
}: {
  detail?: string;
  label: string;
  tone?: "neutral" | "success" | "warning";
  value: string;
}) {
  const toneClassName =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";

  return (
    <Card className="bg-surface/92">
      <CardContent className="space-y-3 p-5">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p
          className={`font-display text-2xl font-semibold leading-tight sm:text-3xl ${toneClassName}`}
        >
          {value}
        </p>
        {detail ? (
          <p className="text-xs font-medium leading-5 text-muted-foreground/82">
            {detail}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ role, user }, { rango }] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const range = normalizeAdminDashboardRange(rango);
  const dashboard = await getAdminDashboardData(range);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const roleLabel = getRoleLabel(role);

  return (
    <div className="space-y-8">
      <AdminHeader
        roleLabel={roleLabel}
        subtitle="Lectura rapida de ventas, pedidos, pagos y stock para operar la tienda."
        title="Dashboard administrativo"
        userName={userName}
      />

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            Vista operativa
          </p>
          <p className="font-display text-2xl font-semibold text-foreground">
            {dashboard.rangeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filtros de dashboard">
          {rangeFilters.map((filter) => (
            <Link
              className={buttonStyles({
                size: "sm",
                variant: filter.value === range ? "primary" : "secondary",
              })}
              href={`/admin?rango=${filter.value}`}
              key={filter.value}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          detail={`${dashboard.todayOrderCount} pedidos creados hoy`}
          label="Ventas de hoy"
          tone="success"
          value={formatDashboardMetricCurrency(dashboard.todaySales)}
        />
        <KpiCard
          detail="Pagos acreditados del mes calendario"
          label="Ventas del mes"
          tone="success"
          value={formatDashboardMetricCurrency(dashboard.monthSales)}
        />
        <KpiCard
          detail={`${dashboard.rangeOrderCount} pedidos en el rango`}
          label="Ventas del rango"
          value={formatDashboardMetricCurrency(dashboard.rangeSales)}
        />
        <KpiCard
          detail="Promedio sobre pagos acreditados"
          label="Ticket promedio"
          value={formatDashboardMetricCurrency(dashboard.averageTicket)}
        />
        <KpiCard
          detail="Pedidos no entregados ni cancelados"
          label="Pedidos pendientes"
          tone="warning"
          value={String(dashboard.pendingOrders)}
        />
        <KpiCard
          detail="Pagos pendientes en pedidos activos"
          label="Pagos pendientes"
          tone="warning"
          value={String(dashboard.pendingPayments)}
        />
        <KpiCard
          detail="Perfiles creados en el rango"
          label="Clientes nuevos"
          value={String(dashboard.newCustomers)}
        />
        <KpiCard
          detail="Productos activos con 3 unidades o menos"
          label="Stock bajo"
          tone="warning"
          value={String(dashboard.lowStockProducts.length)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Ultimas ordenes</CardTitle>
              <Link
                className={buttonStyles({ size: "sm", variant: "secondary" })}
                href="/admin/pedidos"
              >
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0">
            {dashboard.latestOrders.length > 0 ? (
              dashboard.latestOrders.map((order) => (
                <Link
                  className="grid gap-3 rounded-[24px] border border-border bg-surface-soft/45 px-4 py-3 transition-colors duration-[220ms] hover:border-primary hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  href={`/admin/pedidos/${order.id}`}
                  key={order.id}
                >
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-display text-lg font-semibold text-foreground">
                        {formatOrderNumber(order.orderNumber)}
                      </span>
                    </span>
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {order.customerName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatOrderDate(order.createdAt)} / {order.itemCount} articulos
                    </span>
                  </span>
                  <span className="font-display text-xl font-semibold text-foreground">
                    {formatCurrency(order.total)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Todavia no hay ordenes para mostrar.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Productos mas vendidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {dashboard.topProducts.length > 0 ? (
                dashboard.topProducts.map((product, index) => (
                  <div
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] border border-border bg-surface-soft/45 px-4 py-3"
                    key={`${product.productId ?? product.productName}-${index}`}
                  >
                    <Badge variant="neutral">#{index + 1}</Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} unidades
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Todavia no hay productos vendidos en este rango.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock bajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {dashboard.lowStockProducts.length > 0 ? (
                dashboard.lowStockProducts.map((product) => (
                  <Link
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] border border-border bg-surface-soft/45 px-4 py-3 transition-colors duration-[220ms] hover:border-primary hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/admin/productos/${product.id}/editar`}
                    key={product.id}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /producto/{product.slug}
                      </span>
                    </span>
                    <Badge variant={product.stock === 0 ? "sale" : "neutral"}>
                      {product.stock}
                    </Badge>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No hay productos activos con stock bajo.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Estados del rango</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dashboard.statusBreakdown.map((item) => (
              <div
                className="flex items-center justify-between gap-4 rounded-[18px] bg-surface-soft/45 px-4 py-3"
                key={item.status}
              >
                <span className="text-sm font-semibold text-muted-foreground">
                  {item.label}
                </span>
                <span className="font-display text-xl font-semibold text-foreground">
                  {item.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                className="rounded-[24px] border border-border bg-surface/80 p-4 transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-primary hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                href={item.href}
                key={item.href}
              >
                <span className="block font-display text-lg font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {item.description}
                </span>
                <span className="mt-4 block text-sm font-semibold text-primary-hover">
                  {item.label}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
