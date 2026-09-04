"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/lib/orders/actions";
import { formatOrderDateTime } from "@/lib/orders/format-order-date";
import type { OrderStatusActionState } from "@/lib/orders/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PaymentConfirmationFormProps = {
  isConfirmed: boolean;
  orderId: string;
  paidAt?: string;
};

const initialState: OrderStatusActionState = {
  status: "idle",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      className="w-full"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Confirmando pago..." : "Confirmar pago recibido"}
    </Button>
  );
}

export function PaymentConfirmationForm({
  isConfirmed,
  orderId,
  paidAt,
}: PaymentConfirmationFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    updateOrderStatusAction,
    initialState,
  );
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  if (isConfirmed) {
    return (
      <Card>
        <CardContent className="space-y-2 p-5 text-sm sm:p-6">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Pago confirmado
          </h2>
          <p className="text-muted-foreground">
            {paidAt
              ? formatOrderDateTime(paidAt)
              : "El pago ya figura aprobado."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Confirmar pago
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Esta accion cambia el pedido a pago confirmado y genera el email de
            pago confirmado en la outbox.
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <input name="orderId" type="hidden" value={orderId} />
          <input name="status" type="hidden" value="payment_confirmed" />
          <label className="flex items-start gap-3 rounded-[22px] border border-border bg-surface-soft p-4 text-sm font-semibold leading-6 text-foreground">
            <input
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>Confirmo que el pago fue recibido correctamente.</span>
          </label>
          <SubmitButton disabled={!confirmed} />
          {state.message ? (
            <p
              aria-live="polite"
              className={
                state.status === "error"
                  ? "text-sm font-semibold text-destructive"
                  : "text-sm font-semibold text-success"
              }
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
