"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/lib/orders/actions";
import { getNextOrderStatuses, getOrderStatusLabel } from "@/lib/orders/status";
import type { OrderStatusActionState } from "@/lib/orders/types";
import type { OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OrderStatusFormProps = {
  orderId: string;
  status: OrderStatus;
};

const initialState: OrderStatusActionState = {
  status: "idle",
};

function SubmitButton({
  disabled,
  isCancelling,
}: {
  disabled: boolean;
  isCancelling: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      className="w-full"
      disabled={disabled || pending}
      type="submit"
      variant={isCancelling ? "secondary" : "primary"}
    >
      {pending
        ? "Guardando estado..."
        : isCancelling
          ? "Cancelar pedido"
          : "Guardar estado"}
    </Button>
  );
}

export function OrderStatusForm({ orderId, status }: OrderStatusFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateOrderStatusAction,
    initialState,
  );
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(status);
  const [confirmedCancellation, setConfirmedCancellation] = useState(false);
  const isCancelled = status === "cancelled";
  const nextStatuses = getNextOrderStatuses(status);
  const selectableStatuses = [status, ...nextStatuses];
  const isCancelling = status !== "cancelled" && selectedStatus === "cancelled";
  const submitDisabled =
    nextStatuses.length === 0 || (isCancelling && !confirmedCancellation);
  const statusMessageClassName = useMemo(() => {
    if (state.status === "success") {
      return "text-success";
    }

    if (state.status === "error") {
      return "text-destructive";
    }

    return "text-muted-foreground";
  }, [state.status]);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Cambiar estado
        </h2>
        <form action={formAction} className="space-y-5">
          <input name="orderId" type="hidden" value={orderId} />
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Estado
            <select
              className="h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60"
              defaultValue={status}
              disabled={nextStatuses.length === 0}
              name="status"
              onChange={(event) => {
                setSelectedStatus(event.target.value as OrderStatus);
                setConfirmedCancellation(false);
              }}
            >
              {selectableStatuses.map((orderStatus) => (
                <option key={orderStatus} value={orderStatus}>
                  {getOrderStatusLabel(orderStatus)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Nota interna
            <textarea
              className="min-h-24 rounded-[22px] border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
              maxLength={240}
              name="note"
              placeholder="Opcional"
            />
          </label>
          {isCancelling ? (
            <div className="space-y-3 rounded-[22px] border border-warning/25 bg-[#fff7e8] p-4 text-sm leading-6 text-[#8a6a2a]">
              <p className="font-semibold">
                Al cancelar, se repone automaticamente el stock inmediato de
                este pedido.
              </p>
              <p>
                Los productos por encargo no modifican stock. Esta accion no se
                puede revertir desde el panel.
              </p>
              <label className="flex items-start gap-3 font-semibold text-foreground">
                <input
                  className="mt-1 h-4 w-4 rounded border-border accent-primary"
                  name="confirmCancellation"
                  onChange={(event) =>
                    setConfirmedCancellation(event.target.checked)
                  }
                  type="checkbox"
                  value="true"
                />
                <span>
                  Confirmo que quiero cancelar el pedido y reponer el stock
                  inmediato.
                </span>
              </label>
            </div>
          ) : null}
          {isCancelled ? (
            <div className="rounded-[22px] border border-border bg-surface-soft p-4 text-sm leading-6 text-muted-foreground">
              Este pedido ya esta cancelado y no puede reactivarse desde el
              panel.
            </div>
          ) : null}
          {status === "shipped" || status === "delivered" ? (
            <div className="rounded-[22px] border border-border bg-surface-soft p-4 text-sm leading-6 text-muted-foreground">
              Los pedidos enviados o entregados no se cancelan desde este flujo
              para evitar reposiciones de stock incorrectas.
            </div>
          ) : null}
          <SubmitButton disabled={submitDisabled} isCancelling={isCancelling} />
          {state.message ? (
            <p
              aria-live="polite"
              className={`text-sm font-semibold ${statusMessageClassName}`}
            >
              {state.message}
            </p>
          ) : null}
        </form>
        <p className="text-xs leading-5 text-muted-foreground">
          Cancelar repone el stock descontado solo cuando el pedido todavia no
          fue enviado.
        </p>
      </CardContent>
    </Card>
  );
}
