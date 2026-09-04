"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  className: string;
  confirmLabel?: string;
  initialLabel: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  className,
  confirmLabel = "Confirmar",
  initialLabel,
  pendingLabel = "Procesando",
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  if (!needsConfirmation) {
    return (
      <button
        className={className}
        onClick={(event) => {
          event.preventDefault();
          setNeedsConfirmation(true);
        }}
        type="button"
      >
        {initialLabel}
      </button>
    );
  }

  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium leading-5 text-muted-foreground">
        Esta accion requiere confirmacion.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className={className} disabled={pending} type="submit">
          {pending ? pendingLabel : confirmLabel}
        </button>
        <button
          className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          disabled={pending}
          onClick={() => setNeedsConfirmation(false)}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
