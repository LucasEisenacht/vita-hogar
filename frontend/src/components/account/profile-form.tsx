"use client";

import { useActionState } from "react";
import { updateProfileAction, type AccountActionState } from "@/lib/account/actions";
import type { AccountProfile } from "@/lib/account/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileFormProps = {
  profile: AccountProfile;
};

const initialState: AccountActionState = {
  status: "idle",
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          autoComplete="given-name"
          defaultValue={profile.firstName ?? ""}
          error={state.errors?.firstName}
          id="firstName"
          label="Nombre"
          name="firstName"
        />
        <Input
          autoComplete="family-name"
          defaultValue={profile.lastName ?? ""}
          error={state.errors?.lastName}
          id="lastName"
          label="Apellido"
          name="lastName"
        />
        <Input
          autoComplete="tel"
          defaultValue={profile.phone ?? ""}
          error={state.errors?.phone}
          id="phone"
          inputMode="tel"
          label="Telefono"
          name="phone"
        />
        <Input
          defaultValue={profile.birthDate ?? ""}
          error={state.errors?.birthDate}
          id="birthDate"
          label="Fecha de nacimiento opcional"
          name="birthDate"
          type="date"
        />
        <Input
          className="text-muted-foreground"
          defaultValue={profile.email}
          disabled
          id="email"
          label="Email"
          type="email"
        />
      </div>

      <div className="rounded-[22px] border border-border bg-surface-soft px-4 py-3 text-sm leading-6 text-muted-foreground">
        El email pertenece a tu cuenta de acceso. Por seguridad no se cambia
        desde este formulario.
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "text-sm font-semibold text-success"
              : "text-sm font-semibold text-destructive"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <Button disabled={isPending} size="lg" type="submit">
        {isPending ? "Guardando..." : "Guardar perfil"}
      </Button>
    </form>
  );
}
