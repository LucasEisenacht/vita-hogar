import Link from "next/link";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <StorefrontPageShell intensity="low">
      <Container className="flex min-h-[62vh] items-center py-16 sm:py-20">
        <section className="mx-auto max-w-2xl text-center">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            404
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Esta pagina no existe
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Puede que el enlace haya cambiado o que el producto ya no este
            disponible. Volve al inicio o segui explorando la tienda.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 min-[420px]:flex-row">
            <Link className={buttonStyles({ size: "md" })} href="/">
              Volver al inicio
            </Link>
            <Link
              className={buttonStyles({ size: "md", variant: "secondary" })}
              href="/tienda"
            >
              Ir a la tienda
            </Link>
          </div>
        </section>
      </Container>
    </StorefrontPageShell>
  );
}
