"use client";

import { useActionState } from "react";
import {
  createAddressAction,
  updateAddressAction,
  type AccountActionState,
} from "@/lib/account/actions";
import type { AccountAddress } from "@/lib/account/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddressFormProps = {
  address?: AccountAddress;
  mode: "create" | "edit";
};

const initialState: AccountActionState = {
  status: "idle",
};

export function AddressForm({ address, mode }: AddressFormProps) {
  const action = mode === "create" ? createAddressAction : updateAddressAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {address ? <input name="addressId" type="hidden" value={address.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          defaultValue={address?.label ?? ""}
          error={state.errors?.label}
          id={`${mode}-${address?.id ?? "new"}-label`}
          label="Alias"
          name="label"
          placeholder="Casa, trabajo, otro"
        />
        <Input
          autoComplete="name"
          defaultValue={address?.recipient_name ?? ""}
          error={state.errors?.recipientName}
          id={`${mode}-${address?.id ?? "new"}-recipientName`}
          label="Quien recibe"
          name="recipientName"
        />
        <Input
          autoComplete="tel"
          defaultValue={address?.phone ?? ""}
          error={state.errors?.phone}
          id={`${mode}-${address?.id ?? "new"}-phone`}
          inputMode="tel"
          label="Telefono"
          name="phone"
        />
        <Input
          autoComplete="address-line1"
          defaultValue={address?.street ?? ""}
          error={state.errors?.street}
          id={`${mode}-${address?.id ?? "new"}-street`}
          label="Calle"
          name="street"
        />
        <Input
          autoComplete="address-line2"
          defaultValue={address?.street_number ?? ""}
          error={state.errors?.streetNumber}
          id={`${mode}-${address?.id ?? "new"}-streetNumber`}
          label="Numero"
          name="streetNumber"
        />
        <Input
          defaultValue={address?.floor_apartment ?? ""}
          id={`${mode}-${address?.id ?? "new"}-floorApartment`}
          label="Piso / Departamento"
          name="floorApartment"
        />
        <Input
          autoComplete="address-level2"
          defaultValue={address?.locality ?? ""}
          error={state.errors?.locality}
          id={`${mode}-${address?.id ?? "new"}-locality`}
          label="Localidad"
          name="locality"
        />
        <Input
          defaultValue={address?.municipality ?? ""}
          id={`${mode}-${address?.id ?? "new"}-municipality`}
          label="Municipio opcional"
          name="municipality"
        />
        <Input
          autoComplete="address-level1"
          defaultValue={address?.province ?? ""}
          error={state.errors?.province}
          id={`${mode}-${address?.id ?? "new"}-province`}
          label="Provincia"
          name="province"
        />
        <Input
          autoComplete="postal-code"
          defaultValue={address?.postal_code ?? ""}
          error={state.errors?.postalCode}
          id={`${mode}-${address?.id ?? "new"}-postalCode`}
          label="Codigo postal"
          name="postalCode"
        />
        <Input
          className="sm:col-span-2"
          defaultValue={address?.reference ?? ""}
          id={`${mode}-${address?.id ?? "new"}-reference`}
          label="Referencia opcional"
          name="reference"
        />
      </div>

      <label className="flex items-center gap-3 rounded-[20px] border border-border bg-surface-soft px-4 py-3 text-sm font-semibold text-foreground">
        <input
          className="h-4 w-4 accent-[var(--primary)]"
          defaultChecked={address?.is_default ?? false}
          name="isDefault"
          type="checkbox"
        />
        Usar como direccion predeterminada
      </label>

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

      <Button disabled={isPending} size="md" type="submit">
        {isPending
          ? "Guardando..."
          : mode === "create"
            ? "Agregar direccion"
            : "Guardar cambios"}
      </Button>
    </form>
  );
}
