"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { buttonStyles } from "@/components/ui/button";
import {
  initialProductDeleteState,
  type ProductDeleteState,
} from "@/lib/admin/catalog/types";

type DeleteProductButtonProps = {
  action: (
    state: ProductDeleteState,
    formData: FormData,
  ) => Promise<ProductDeleteState>;
  productName: string;
};

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={buttonStyles({
        className:
          "w-full border-destructive/35 bg-[#fff1f2] text-destructive hover:border-destructive/50 hover:bg-[#ffe4e6] sm:w-auto",
        size: "sm",
        variant: "secondary",
      })}
      disabled={pending}
      type="submit"
    >
      {pending ? "Eliminando" : "Eliminar producto"}
    </button>
  );
}

export function DeleteProductButton({
  action,
  productName,
}: DeleteProductButtonProps) {
  const [state, formAction] = useActionState(action, initialProductDeleteState);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        className={buttonStyles({
          className:
            "w-full border-destructive/30 text-destructive hover:border-destructive/45 hover:bg-[#fff1f2] sm:w-auto",
          size: "sm",
          variant: "secondary",
        })}
        onClick={openDialog}
        type="button"
      >
        Eliminar producto
      </button>

      <dialog
        aria-labelledby="delete-product-title"
        className="w-[min(92vw,460px)] rounded-[30px] border border-border bg-surface p-0 text-foreground shadow-[0_28px_80px_rgba(74,55,47,0.18)] backdrop:bg-[#4a372f]/20"
        ref={dialogRef}
      >
        <div className="space-y-6 p-6 sm:p-7">
          <div className="space-y-2">
            <p
              className="font-display text-2xl font-semibold text-foreground"
              id="delete-product-title"
            >
              Eliminar producto
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Seguro que queres eliminar este producto? Esta accion no se puede
              deshacer.
            </p>
            <p className="text-sm font-semibold text-foreground">
              {productName}
            </p>
          </div>

          {state.message ? (
            <p className="rounded-[20px] border border-destructive/20 bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-destructive">
              {state.message}
            </p>
          ) : null}

          <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className={buttonStyles({
                className: "w-full sm:w-auto",
                size: "sm",
                variant: "ghost",
              })}
              onClick={closeDialog}
              type="button"
            >
              Cancelar
            </button>
            <ConfirmDeleteButton />
          </form>
        </div>
      </dialog>
    </>
  );
}
