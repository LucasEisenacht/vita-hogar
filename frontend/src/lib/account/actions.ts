"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { checkSensitiveActionRateLimit } from "@/lib/security/sensitive-action-rate-limit";
import {
  toAddressInsert,
  toAddressUpdate,
  validateAddressForm,
  validateProfileForm,
  type FieldErrors,
} from "@/lib/account/validation";

export type AccountActionState = {
  errors?: FieldErrors;
  message?: string;
  status: "error" | "idle" | "success";
};

const authErrorMessage = "Iniciá sesión para continuar.";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function revalidateAccountPaths() {
  revalidatePath("/mi-cuenta");
  revalidatePath("/mi-cuenta/perfil");
  revalidatePath("/mi-cuenta/direcciones");
  revalidatePath("/checkout");
}

function getAddressErrorMessage(message?: string) {
  if (message?.includes("address_limit_reached")) {
    return "Podés guardar hasta 10 direcciones.";
  }

  return "No pudimos guardar la dirección. Intentá nuevamente.";
}

export async function updateProfileAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      message: authErrorMessage,
      status: "error",
    };
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "account-profile-update",
    limit: 12,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      message: "Hay demasiados intentos recientes. Esperá unos minutos.",
      status: "error",
    };
  }

  const validation = validateProfileForm(formData);

  if (validation.errors) {
    return {
      errors: validation.errors,
      message: "Revisá los campos marcados.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { values } = validation;
  const { error } = await supabase.from("profiles").upsert(
    {
      birth_date: values.birthDate ?? null,
      first_name: values.firstName,
      id: user.id,
      last_name: values.lastName,
      phone: values.phone,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    return {
      message: "No pudimos actualizar tu perfil. Intentá nuevamente.",
      status: "error",
    };
  }

  revalidateAccountPaths();

  return {
    message: "Perfil actualizado correctamente.",
    status: "success",
  };
}

export async function createAddressAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      message: authErrorMessage,
      status: "error",
    };
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "account-address-create",
    limit: 15,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      message: "Hay demasiados intentos recientes. Esperá unos minutos.",
      status: "error",
    };
  }

  const validation = validateAddressForm(formData);

  if (validation.errors) {
    return {
      errors: validation.errors,
      message: "Revisá los campos marcados.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_addresses")
    .insert(toAddressInsert(validation.values, user.id));

  if (error) {
    return {
      message: getAddressErrorMessage(error.message),
      status: "error",
    };
  }

  revalidateAccountPaths();

  return {
    message: "Dirección guardada correctamente.",
    status: "success",
  };
}

export async function updateAddressAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      message: authErrorMessage,
      status: "error",
    };
  }

  const addressId = getFormString(formData, "addressId");
  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "account-address-update",
    limit: 20,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      message: "Hay demasiados intentos recientes. Esperá unos minutos.",
      status: "error",
    };
  }

  const validation = validateAddressForm(formData);

  if (!addressId) {
    return {
      message: "No pudimos identificar la dirección.",
      status: "error",
    };
  }

  if (validation.errors) {
    return {
      errors: validation.errors,
      message: "Revisá los campos marcados.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_addresses")
    .update(toAddressUpdate(validation.values))
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    return {
      message: getAddressErrorMessage(error.message),
      status: "error",
    };
  }

  revalidateAccountPaths();

  return {
    message: "Dirección actualizada correctamente.",
    status: "success",
  };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/mi-cuenta/direcciones");
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "account-address-delete",
    limit: 20,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    redirect("/mi-cuenta/direcciones?status=rate-limited");
  }

  const addressId = getFormString(formData, "addressId");

  if (!addressId) {
    redirect("/mi-cuenta/direcciones?status=error");
  }

  const supabase = await createClient();
  await supabase
    .from("user_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  revalidateAccountPaths();
  redirect("/mi-cuenta/direcciones?status=deleted");
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/mi-cuenta/direcciones");
  }

  const addressId = getFormString(formData, "addressId");

  if (!addressId) {
    redirect("/mi-cuenta/direcciones?status=error");
  }

  const supabase = await createClient();
  await supabase
    .from("user_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id);

  revalidateAccountPaths();
  redirect("/mi-cuenta/direcciones?status=default");
}
