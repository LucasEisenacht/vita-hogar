"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { retryOrderEmailsAction } from "@/lib/orders/actions";
import type { OrderEmailRetryActionState } from "@/lib/orders/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OrderEmailRetryFormProps = {
  hasRetriableEmails: boolean;
  orderId: string;
};

const initialState: OrderEmailRetryActionState = {
  status: "idle",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      disabled={disabled || pending}
      size="sm"
      type="submit"
      variant="secondary"
    >
      {pending ? "Reintentando..." : "Reintentar emails"}
    </Button>
  );
}

export function OrderEmailRetryForm({
  hasRetriableEmails,
  orderId,
}: OrderEmailRetryFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    retryOrderEmailsAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5 text-sm sm:p-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Reintento de emails
          </h2>
          <p className="leading-6 text-muted-foreground">
            Procesa un lote chico del outbox sin reenviar emails ya enviados.
          </p>
        </div>
        <form action={formAction} className="space-y-3">
          <input name="orderId" type="hidden" value={orderId} />
          <SubmitButton disabled={!hasRetriableEmails} />
          {state.message ? (
            <p
              aria-live="polite"
              className={
                state.status === "error"
                  ? "font-semibold text-destructive"
                  : "font-semibold text-success"
              }
            >
              {state.message}
            </p>
          ) : null}
          {!hasRetriableEmails ? (
            <p className="text-xs text-muted-foreground">
              Este pedido no tiene emails pendientes o fallidos para reintentar.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
