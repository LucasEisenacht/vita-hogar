"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { quickUpdateProductCommercial } from "@/lib/admin/catalog/actions";
import {
  initialProductQuickEditState,
  type ProductWithCategory,
} from "@/lib/admin/catalog/types";

type ProductQuickEditFormProps = {
  product: ProductWithCategory;
};

function QuickEditSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="h-9 rounded-full bg-secondary px-4 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando" : "Guardar"}
    </button>
  );
}

export function ProductQuickEditForm({ product }: ProductQuickEditFormProps) {
  const [state, formAction] = useActionState(
    quickUpdateProductCommercial.bind(null, product.id),
    initialProductQuickEditState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-3 rounded-[22px] bg-surface-soft p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Precio
          <input
            aria-invalid={fieldErrors.price ? true : undefined}
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={product.price}
            min={0}
            name="price"
            step={1}
            type="number"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Stock
          <input
            aria-invalid={fieldErrors.stock ? true : undefined}
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={product.stock}
            min={0}
            name="stock"
            step={1}
            type="number"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Disponibilidad
          <select
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={product.availability_type}
            name="availabilityType"
          >
            <option value="in_stock">En stock</option>
            <option value="made_to_order">Por encargo</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
          Estado
          <select
            className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={product.is_active ? "true" : "false"}
            name="isActive"
          >
            <option value="true">Publicado</option>
            <option value="false">Oculto</option>
          </select>
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={`min-h-5 text-xs font-semibold ${
            state.status === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {state.message ?? fieldErrors.form ?? ""}
        </p>
        <QuickEditSubmitButton />
      </div>
    </form>
  );
}
