import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCurrentUserOrders } from "@/lib/orders/queries";
import { OrderSummary } from "@/components/orders/order-summary";
import { EmptyState } from "@/components/shared/empty-state";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  description: "Pedidos de tu cuenta en W.todocell.",
  title: "Mis pedidos | W.todocell",
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/mi-cuenta/pedidos");
  }

  const orders = await getCurrentUserOrders();

  return (
    <section className="bg-transparent py-10 text-foreground sm:py-14 lg:py-20">
      <Container className="space-y-8">
        <div className="max-w-3xl space-y-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            Mi cuenta
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Mis pedidos
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            Segui tus compras y el estado de preparacion desde aca.
          </p>
        </div>

        <AccountNav active="orders" />

        {orders.length > 0 ? (
          <div className="grid gap-4">
            {orders.map((order) => (
              <OrderSummary
                href={`/mi-cuenta/pedidos/${order.id}`}
                key={order.id}
                order={order}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/tienda"
            actionLabel="Explorar productos"
            message="Cuando hagas una compra, vas a poder seguirla desde aca."
            title="Todavia no tenes pedidos"
          />
        )}
      </Container>
    </section>
  );
}
