import type { ReactNode } from "react";
import Link from "next/link";
import { SparkleMark } from "@/components/brand/brand-marks";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyCatalogProps = {
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  message?: string;
  title?: string;
};

export function EmptyCatalog({
  actionHref,
  actionLabel,
  children,
  message = "Todavia no hay productos activos para mostrar en esta seleccion.",
  title = "Estamos preparando la coleccion",
}: EmptyCatalogProps) {
  return (
    <Card className="relative overflow-hidden rounded-[34px] border border-white/58 bg-[linear-gradient(135deg,rgba(255,250,248,0.82),rgba(250,225,234,0.5))] shadow-[0_24px_72px_rgba(74,55,47,0.08)] backdrop-blur-[16px]">
      <SparkleMark className="pointer-events-none absolute right-8 top-8 h-7 w-7 text-primary-hover opacity-28" />
      <span
        aria-hidden="true"
        className="absolute -left-12 top-12 h-44 w-44 rounded-full bg-primary/18 blur-3xl"
      />
      <CardContent className="relative mx-auto max-w-2xl space-y-6 px-6 py-12 text-center sm:px-10 sm:py-16">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-white/62 bg-white/42 shadow-[0_18px_42px_rgba(207,142,168,0.12)] backdrop-blur-md">
          <div className="relative h-10 w-10">
            <span className="absolute left-1 top-3 h-7 w-7 rounded-full border border-primary/45" />
            <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-primary/35 shadow-[0_0_20px_rgba(223,165,185,0.38)]" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-hover">
            Catalogo
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {message}
          </p>
        </div>
        {children}
        {actionHref && actionLabel ? (
          <Link
            className={buttonStyles({ size: "md", variant: "primary" })}
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
