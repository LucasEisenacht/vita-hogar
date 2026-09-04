import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { ProfileForm } from "@/components/account/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getCurrentAccountProfile } from "@/lib/account/profile";

export const metadata: Metadata = {
  description: "Edita tus datos personales en W.todocell.",
  title: "Mi perfil | W.todocell",
};

export default async function AccountProfilePage() {
  const profile = await getCurrentAccountProfile();

  if (!profile) {
    redirect("/ingresar?next=/mi-cuenta/perfil");
  }

  return (
    <section className="bg-transparent py-10 text-foreground sm:py-14 lg:py-20">
      <Container className="space-y-8">
        <div className="max-w-3xl space-y-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            Mi cuenta
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Mi perfil
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            Manten&eacute; tus datos personales actualizados para completar tus
            compras m&aacute;s r&aacute;pido.
          </p>
        </div>

        <AccountNav active="profile" />

        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Datos personales
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Usamos estos datos como punto de partida del checkout. Siempre
                pod&eacute;s modificarlos antes de confirmar un pedido.
              </p>
            </div>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
