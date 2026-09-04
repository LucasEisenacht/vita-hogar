"use client";

import { useState } from "react";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/lib/account/actions";
import { Button } from "@/components/ui/button";

type AddressActionsProps = {
  addressId: string;
  isDefault: boolean;
};

export function AddressActions({ addressId, isDefault }: AddressActionsProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {!isDefault ? (
        <form action={setDefaultAddressAction}>
          <input name="addressId" type="hidden" value={addressId} />
          <Button size="sm" type="submit" variant="secondary">
            Usar como predeterminada
          </Button>
        </form>
      ) : null}
      {isConfirmingDelete ? (
        <form action={deleteAddressAction} className="flex flex-wrap gap-2">
          <input name="addressId" type="hidden" value={addressId} />
          <Button size="sm" type="submit" variant="primary">
            Confirmar eliminar
          </Button>
          <Button
            onClick={() => setIsConfirmingDelete(false)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <Button
          onClick={() => setIsConfirmingDelete(true)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Eliminar
        </Button>
      )}
    </div>
  );
}
