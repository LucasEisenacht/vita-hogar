import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { OrderEmailRetryForm } from "@/components/admin/orders/order-email-retry-form";
import { OrderStatusForm } from "@/components/admin/orders/order-status-form";
import { PaymentConfirmationForm } from "@/components/admin/orders/payment-confirmation-form";
import { OrderDetail } from "@/components/orders/order-detail";
import { buttonStyles } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOrderDetails } from "@/lib/orders/queries";
import { formatOrderNumber } from "@/lib/orders/status";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { role, user } = await requireAdmin();
  const { id } = await params;
  const order = await getAdminOrderDetails(id);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const hasRetriableEmails =
    order.emailOutbox?.some((entry) => entry.status !== "sent") ?? false;

  return (
    <div className="space-y-8">
      <AdminHeader
        roleLabel={getRoleLabel(role)}
        subtitle="Revisa el detalle, contacto, productos e historial."
        title={formatOrderNumber(order.orderNumber)}
        userName={userName}
      />
      <Link
        className={buttonStyles({ size: "sm", variant: "secondary" })}
        href="/admin/pedidos"
      >
        Volver a pedidos
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <OrderDetail order={order} showPrivateContact />
        <div className="space-y-6">
          {order.status === "pending_payment" ||
          order.paymentStatus === "approved" ? (
            <PaymentConfirmationForm
              isConfirmed={order.paymentStatus === "approved"}
              orderId={order.id}
              paidAt={order.paidAt}
            />
          ) : null}
          <OrderStatusForm orderId={order.id} status={order.status} />
          <OrderEmailRetryForm
            hasRetriableEmails={hasRetriableEmails}
            orderId={order.id}
          />
        </div>
      </div>
    </div>
  );
}
