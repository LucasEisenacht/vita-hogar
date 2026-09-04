import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { AddressActions } from "@/components/account/address-actions";
import { AddressForm } from "@/components/account/address-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCurrentUserAddresses } from "@/lib/account/addresses";

type AccountAddressesPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

export const metadata: Metadata = {
  description: "Direcciones guardadas de tu cuenta en W.todocell.",
  title: "Mis direcciones | W.todocell",
};

function getStatus(value?: string | string[]) {
  return typeof value === "string" ? value : undefined;
}

function getStatusMessage(status?: string) {
  if (status === "deleted") {
    return "Direccion eliminada correctamente.";
  }

  if (status === "default") {
    return "Direccion predeterminada actualizada.";
  }

  if (status === "rate-limited") {
    return "Hay demasiados intentos recientes. Espera unos minutos.";
  }

  if (status === "error") {
    return "No pudimos completar la accion.";
  }

  return undefined;
}

function getAddressSummary(address: Awaited<ReturnType<typeof getCurrentUserAddresses>>[number]) {
  return `${address.street} ${address.street_number}${
    address.floor_apartment ? `, ${address.floor_apartment}` : ""
  }`;
}

export default async function AccountAddressesPage({
  searchParams,
}: AccountAddressesPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (!user) {
    redirect("/ingresar?next=/mi-cuenta/direcciones");
  }

  const addresses = await getCurrentUserAddresses();
  const statusMessage = getStatusMessage(getStatus(params?.status));

  return (
    <section className="bg-transparent py-10 text-foreground sm:py-14 lg:py-20">
      <Container className="space-y-8">
        <div className="max-w-3xl space-y-4">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
            Mi cuenta
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Mis direcciones
          </h1>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            Guard&aacute; tus direcciones para completar tus pr&oacute;ximas compras
            con menos pasos.
          </p>
        </div>

        <AccountNav active="addresses" />

        {statusMessage ? (
          <p
            className="rounded-[22px] border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary-hover"
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="grid gap-4">
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <Card className="bg-surface/95" key={address.id}>
                  <CardContent className="space-y-5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-2xl font-semibold text-foreground">
                            {address.label}
                          </h2>
                          {address.is_default ? (
                            <Badge variant="stock">Predeterminada</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {address.recipient_name}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {getAddressSummary(address)}
                          <br />
                          {[address.locality, address.province, address.postal_code]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.phone}
                        </p>
                      </div>
                      <AddressActions
                        addressId={address.id}
                        isDefault={address.is_default}
                      />
                    </div>

                    <details className="rounded-[22px] border border-border bg-surface-soft p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-primary-hover">
                        Editar direcci&oacute;n
                      </summary>
                      <div className="mt-5">
                        <AddressForm address={address} mode="edit" />
                      </div>
                    </details>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                actionHref="#agregar-direccion"
                actionLabel="Agregar direccion"
                message="Guarda una direccion para completar tus proximas compras mas rapido."
                title="Todavia no guardaste direcciones"
              />
            )}
          </div>

          <Card className="bg-surface/95" id="agregar-direccion">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Agregar direcci&oacute;n
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pod&eacute;s guardar hasta 10 direcciones y elegir una
                  predeterminada.
                </p>
              </div>
              <AddressForm mode="create" />
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  );
}
