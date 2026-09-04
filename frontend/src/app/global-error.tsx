"use client";

import { buttonStyles } from "@/components/ui/button";

type GlobalErrorProps = {
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground">
        <main className="flex min-h-screen items-center justify-center px-5 py-12">
          <section className="max-w-xl text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
              W.todocell
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight">
              Necesitamos recargar esta experiencia
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Hubo un problema inesperado. No mostramos detalles tecnicos para
              proteger la sesion.
            </p>
            <button className={buttonStyles({ className: "mt-7" })} onClick={reset}>
              Reintentar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
