import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { createNoIndexMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = createNoIndexMetadata({
  description: "Elegir como continuar la compra en W.todocell.",
  title: "Continuar compra | W.todocell",
});

const checkoutReturnPath = "/checkout";

const options = [
  {
    cta: "Continuar como invitado",
    description:
      "Compra sin registrarte. Recibiras todas las novedades de tu pedido por email.",
    href: checkoutReturnPath,
    title: "Comprar como invitado",
    variant: "primary",
  },
  {
    cta: "Crear cuenta",
    description:
      "Crea tu cuenta para guardar tus datos y consultar el historial de todos tus pedidos.",
    href: `/registro?next=${encodeURIComponent(checkoutReturnPath)}`,
    title: "Crear una cuenta",
    variant: "secondary",
  },
  {
    cta: "Ingresar",
    description:
      "Si ya tenes cuenta, ingresa y volvemos automaticamente al checkout.",
    href: `/ingresar?next=${encodeURIComponent(checkoutReturnPath)}`,
    title: "Ya tengo una cuenta",
    variant: "secondary",
  },
] as const;

export default async function CheckoutStartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(checkoutReturnPath);
  }

  return (
    <StorefrontPageShell intensity="low">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="max-w-3xl space-y-3">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
              W.todocell
            </p>
            <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
              Como queres continuar?
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              Tu carrito se conserva completo elijas la opcion que elijas.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {options.map((option) => (
              <Card className="storefront-panel-strong" key={option.title}>
                <CardContent className="flex h-full flex-col gap-5 p-6 sm:p-7">
                  <div className="space-y-3">
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      {option.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <Link
                    className={buttonStyles({
                      className: "mt-auto w-full",
                      size: "lg",
                      variant: option.variant,
                    })}
                    href={option.href}
                  >
                    {option.cta}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </StorefrontPageShell>
  );
}
