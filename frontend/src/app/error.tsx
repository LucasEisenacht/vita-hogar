"use client";

import Link from "next/link";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <StorefrontPageShell intensity="low">
      <Container className="flex min-h-[62vh] items-center py-16 sm:py-20">
        <section className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            Algo no salio bien
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            No pudimos cargar esta vista
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Intenta nuevamente en unos segundos. Si el problema continua, podes
            volver al inicio y seguir navegando.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row">
            <button className={buttonStyles({ size: "md" })} onClick={reset}>
              Reintentar
            </button>
            <Link
              className={buttonStyles({ size: "md", variant: "secondary" })}
              href="/"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </Container>
    </StorefrontPageShell>
  );
}
