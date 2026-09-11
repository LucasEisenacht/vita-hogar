import type { ReactNode } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyCatalogProps = { actionHref?: string; actionLabel?: string; children?: ReactNode; message?: string; title?: string };

export function EmptyCatalog({ actionHref, actionLabel, children, message = "Todavía no hay productos activos para mostrar en esta selección.", title = "Estamos preparando la colección" }: EmptyCatalogProps) {
  return <Card className="vita-empty-catalog border-border bg-surface shadow-none"><CardContent className="mx-auto max-w-2xl space-y-5 px-6 py-12 text-center sm:px-10 sm:py-16"><p className="vita-label">Catálogo</p><h2 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h2><p className="mx-auto max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">{message}</p>{children}{actionHref && actionLabel ? <Link className={buttonStyles({ size: "md", variant: "primary" })} href={actionHref}>{actionLabel}</Link> : null}</CardContent></Card>;
}