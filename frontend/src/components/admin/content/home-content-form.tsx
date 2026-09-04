"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateHomeContentConfig } from "@/lib/home-content/actions";
import type { HomeContentConfig } from "@/lib/home-content/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type HomeContentFormProps = {
  content: HomeContentConfig;
  updatedAt: string | null;
};

const initialState = {
  fieldErrors: {},
  message: "",
  status: "idle" as const,
};

const sortOptions = [
  { label: "Destacados primero", value: "featured" },
  { label: "Mas recientes", value: "newest" },
  { label: "Nombre", value: "name" },
  { label: "Precio menor a mayor", value: "price-asc" },
  { label: "Precio mayor a menor", value: "price-desc" },
];

const iconOptions = [
  { label: "Cuidado", value: "care" },
  { label: "Corazon", value: "heart" },
  { label: "Envio", value: "send" },
  { label: "Seguridad", value: "shield" },
  { label: "Brillo", value: "sparkle" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="lg" type="submit">
      {pending ? "Guardando..." : "Guardar contenido"}
    </Button>
  );
}

function SectionHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h2>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function TextareaField({
  defaultValue,
  error,
  label,
  name,
  rows = 3,
}: {
  defaultValue: string;
  error?: string;
  label: string;
  name: string;
  rows?: number;
}) {
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-foreground" htmlFor={name}>
        {label}
      </label>
      <textarea
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className="min-h-28 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] ease-out placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35"
        defaultValue={defaultValue}
        id={name}
        name={name}
        rows={rows}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckboxField({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="inline-flex items-center gap-3 rounded-2xl border border-border bg-surface-soft px-4 py-3 text-sm font-semibold text-foreground">
      <input
        className="h-4 w-4 accent-primary"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-foreground" htmlFor={name}>
        {label}
      </label>
      <select
        className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35"
        defaultValue={defaultValue}
        id={name}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function HomeContentForm({ content, updatedAt }: HomeContentFormProps) {
  const [state, formAction] = useActionState(
    updateHomeContentConfig,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input name="contentUpdatedAt" type="hidden" value={updatedAt ?? ""} />
      <Card>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeader
            description="Controla el primer bloque de la portada y sus llamados a la accion."
            title="Banner principal"
          />
          <CheckboxField
            defaultChecked={content.hero.isActive}
            label="Banner activo"
            name="hero.isActive"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              defaultValue={content.hero.badge}
              error={state.fieldErrors["hero.badge"]}
              label="Etiqueta"
              name="hero.badge"
            />
            <Input
              defaultValue={content.hero.title}
              error={state.fieldErrors["hero.title"]}
              label="Titulo"
              name="hero.title"
            />
            <TextareaField
              defaultValue={content.hero.subtitle}
              error={state.fieldErrors["hero.subtitle"]}
              label="Subtitulo"
              name="hero.subtitle"
            />
            <div className="grid gap-4">
              <Input
                defaultValue={content.hero.primaryCtaLabel}
                error={state.fieldErrors["hero.primaryCtaLabel"]}
                label="Texto del boton principal"
                name="hero.primaryCtaLabel"
              />
              <Input
                defaultValue={content.hero.primaryCtaHref}
                error={state.fieldErrors["hero.primaryCtaHref"]}
                label="Destino del boton principal"
                name="hero.primaryCtaHref"
              />
            </div>
            <Input
              defaultValue={content.hero.secondaryCtaLabel}
              label="Texto del boton secundario"
              name="hero.secondaryCtaLabel"
            />
            <Input
              defaultValue={content.hero.secondaryCtaHref}
              error={state.fieldErrors["hero.secondaryCtaHref"]}
              label="Destino del boton secundario"
              name="hero.secondaryCtaHref"
            />
            <Input
              defaultValue={content.hero.desktopImageUrl}
              error={state.fieldErrors["hero.desktopImageUrl"]}
              helperText="URL local o publica. Si queda vacia, se usa la composicion visual actual."
              label="Imagen desktop"
              name="hero.desktopImageUrl"
            />
            <Input
              defaultValue={content.hero.mobileImageUrl}
              error={state.fieldErrors["hero.mobileImageUrl"]}
              helperText="Preparado para una imagen especifica de mobile."
              label="Imagen mobile"
              name="hero.mobileImageUrl"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeader
            description="La seccion toma productos reales marcados como destacados desde el catalogo."
            title="Productos destacados"
          />
          <CheckboxField
            defaultChecked={content.featuredProducts.isActive}
            label="Mostrar seccion"
            name="featuredProducts.isActive"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              defaultValue={content.featuredProducts.title}
              error={state.fieldErrors["featuredProducts.title"]}
              label="Titulo"
              name="featuredProducts.title"
            />
            <Input
              defaultValue={String(content.featuredProducts.limit)}
              label="Cantidad"
              min={1}
              name="featuredProducts.limit"
              type="number"
            />
            <TextareaField
              defaultValue={content.featuredProducts.subtitle}
              label="Descripcion"
              name="featuredProducts.subtitle"
            />
            <SelectField
              defaultValue={content.featuredProducts.sort}
              label="Orden"
              name="featuredProducts.sort"
              options={sortOptions}
            />
            <Input
              defaultValue={content.featuredProducts.ctaLabel}
              label="Texto del boton"
              name="featuredProducts.ctaLabel"
            />
            <Input
              defaultValue={content.featuredProducts.ctaHref}
              error={state.fieldErrors["featuredProducts.ctaHref"]}
              label="Destino del boton"
              name="featuredProducts.ctaHref"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeader
            description="Elegi que categorias aparecen, su texto y su prioridad visual."
            title="Categorias destacadas"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              defaultValue={content.featuredCategories.title}
              error={state.fieldErrors["featuredCategories.title"]}
              label="Titulo"
              name="featuredCategories.title"
            />
            <Input
              defaultValue={content.featuredCategories.subtitle}
              label="Subtitulo"
              name="featuredCategories.subtitle"
            />
          </div>
          <div className="grid gap-4">
            {content.featuredCategories.items.map((category, index) => (
              <div
                className="grid gap-4 rounded-[26px] border border-border bg-surface-soft p-4 lg:grid-cols-[90px_1fr_1fr_1.4fr_auto]"
                key={category.slug}
              >
                <Input
                  defaultValue={String(category.order)}
                  label="Orden"
                  name={`featuredCategories.${index}.order`}
                  type="number"
                />
                <Input
                  defaultValue={category.slug}
                  error={state.fieldErrors[`featuredCategories.${index}.slug`]}
                  label="Slug"
                  name={`featuredCategories.${index}.slug`}
                />
                <Input
                  defaultValue={category.name}
                  error={state.fieldErrors[`featuredCategories.${index}.name`]}
                  label="Nombre"
                  name={`featuredCategories.${index}.name`}
                />
                <Input
                  defaultValue={category.description}
                  label="Descripcion"
                  name={`featuredCategories.${index}.description`}
                />
                <div className="flex items-end">
                  <CheckboxField
                    defaultChecked={category.isActive}
                    label="Activa"
                    name={`featuredCategories.${index}.isActive`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeader
            description="Edita icono, titulo, descripcion, orden y visibilidad de cada beneficio."
            title="Beneficios"
          />
          <Input
            defaultValue={content.benefits.title}
            error={state.fieldErrors["benefits.title"]}
            label="Titulo de la seccion"
            name="benefits.title"
          />
          <div className="grid gap-4">
            {content.benefits.items.map((benefit, index) => (
              <div
                className="grid gap-4 rounded-[26px] border border-border bg-surface-soft p-4 lg:grid-cols-[90px_160px_1fr_1.4fr_auto]"
                key={`${benefit.title}-${index}`}
              >
                <Input
                  defaultValue={String(benefit.order)}
                  label="Orden"
                  name={`benefits.${index}.order`}
                  type="number"
                />
                <SelectField
                  defaultValue={benefit.icon}
                  label="Icono"
                  name={`benefits.${index}.icon`}
                  options={iconOptions}
                />
                <Input
                  defaultValue={benefit.title}
                  error={state.fieldErrors[`benefits.${index}.title`]}
                  label="Titulo"
                  name={`benefits.${index}.title`}
                />
                <Input
                  defaultValue={benefit.description}
                  error={state.fieldErrors[`benefits.${index}.description`]}
                  label="Descripcion"
                  name={`benefits.${index}.description`}
                />
                <div className="flex items-end">
                  <CheckboxField
                    defaultChecked={benefit.isActive}
                    label="Activo"
                    name={`benefits.${index}.isActive`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeader
            description="No conecta API. Solo controla el CTA y el texto visible de la portada."
            title="Instagram"
          />
          <CheckboxField
            defaultChecked={content.instagram.isActive}
            label="Mostrar Instagram"
            name="instagram.isActive"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              defaultValue={content.instagram.username}
              label="Usuario"
              name="instagram.username"
            />
            <Input
              defaultValue={content.instagram.title}
              error={state.fieldErrors["instagram.title"]}
              label="Titulo"
              name="instagram.title"
            />
            <TextareaField
              defaultValue={content.instagram.text}
              error={state.fieldErrors["instagram.text"]}
              label="Texto"
              name="instagram.text"
            />
            <div className="grid gap-4">
              <Input
                defaultValue={content.instagram.buttonLabel}
                label="Texto del boton"
                name="instagram.buttonLabel"
              />
              <Input
                defaultValue={content.instagram.buttonHref}
                error={state.fieldErrors["instagram.buttonHref"]}
                label="Destino del boton"
                name="instagram.buttonHref"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-20 rounded-[28px] border border-border bg-background/90 p-4 shadow-[0_22px_58px_rgba(74,55,47,0.12)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={`text-sm font-semibold ${
              state.status === "error" ? "text-destructive" : "text-primary-hover"
            }`}
          >
            {state.message ||
              "Los cambios se guardan en Supabase cuando la migracion de contenido esta aplicada."}
          </p>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
