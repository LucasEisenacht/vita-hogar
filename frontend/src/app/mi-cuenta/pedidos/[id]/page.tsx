import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserOrderDetails } from "@/lib/orders/queries";
import { formatOrderNumber } from "@/lib/orders/status";
import { OrderDetail } from "@/components/orders/order-detail";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type AccountOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Detalle del pedido | W.todocell",
};

export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const { id } = await params;
  const order = await getCurrentUserOrderDetails(id);

  return (
    <section className="bg-transparent py-10 text-foreground sm:py-14 lg:py-20">
      <Container className="space-y-8">
        <div className="flex flex-wrap gap-3">
          <Link
            className={buttonStyles({ size: "sm", variant: "secondary" })}
            href="/mi-cuenta/pedidos"
          >
            Volver a pedidos
          </Link>
          <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground">
            {formatOrderNumber(order.orderNumber)}
          </span>
        </div>
        <OrderDetail order={order} />
      </Container>
    </section>
  );
}
