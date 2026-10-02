"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  initialCategoryFormState,
  type CategoryFormState,
} from "@/lib/admin/categories/types";
import { slugifyCategoryName } from "@/lib/admin/categories/validation";
import type { Category } from "@/types/database";

type CategoryFormProps = {
  action: (
    state: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  category?: Category;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="lg" type="submit">
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function CategoryForm({
  action,
  category,
  submitLabel,
}: CategoryFormProps) {
  const [state, formAction] = useActionState(
    action,
    initialCategoryFormState,
  );
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));
  const errors = state.fieldErrors ?? {};

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(slugifyCategoryName(value));
    }
  }

  return (
    <form action={formAction} className="space-y-7">
      <div className="grid gap-5 lg:grid-cols-2">
        <Input
          autoComplete="off"
          error={errors.name}
          label="Nombre"
          maxLength={120}
          name="name"
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Nombre de la categoria"
          required
          value={name}
        />
        <Input
          autoComplete="off"
          error={errors.slug}
          helperText="Se usa en la URL publica de la categoria."
          label="Slug"
          maxLength={120}
          name="slug"
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(slugifyCategoryName(event.target.value));
          }}
          placeholder="nombre-de-la-categoria"
          required
          value={slug}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="grid gap-2">
          <label
            className="text-sm font-semibold text-foreground"
            htmlFor="description"
          >
            Descripcion
          </label>
          <textarea
            aria-describedby={errors.description ? "description-error" : undefined}
            aria-invalid={errors.description ? true : undefined}
            className={`min-h-32 w-full rounded-2xl border bg-surface px-4 py-3 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] focus:outline-none focus:ring-2 focus:ring-ring/35 ${
              errors.description
                ? "border-destructive focus:border-destructive"
                : "border-border focus:border-primary"
            }`}
            defaultValue={category?.description ?? ""}
            id="description"
            maxLength={500}
            name="description"
            placeholder="Descripcion opcional"
          />
          {errors.description ? (
            <p
              className="text-sm font-medium text-destructive"
              id="description-error"
            >
              {errors.description}
            </p>
          ) : null}
        </div>

        <Input
          defaultValue={category?.sort_order ?? 0}
          error={errors.sortOrder}
          helperText="Menor numero, mayor prioridad."
          label="Orden"
          max={9999}
          min={0}
          name="sortOrder"
          required
          step={1}
          type="number"
        />
      </div>

      <label className="flex items-start gap-3 rounded-[22px] border border-border bg-surface-soft p-4 text-sm font-medium text-foreground">
        <input
          className="mt-1 h-4 w-4 rounded border-border accent-primary"
          defaultChecked={category?.is_active ?? true}
          name="isActive"
          type="checkbox"
        />
        <span>
          Categoria activa
          <span className="block font-normal leading-6 text-muted-foreground">
            Las categorias inactivas no aparecen en el catalogo publico ni en
            el alta de productos.
          </span>
        </span>
      </label>

      {errors.form || state.message ? (
        <p className="rounded-[20px] border border-destructive/20 bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-destructive">
          {errors.form ?? state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          className={buttonStyles({
            className: "w-full sm:w-auto",
            size: "lg",
            variant: "ghost",
          })}
          href="/admin/categorias"
        >
          Cancelar
        </Link>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
