"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { checkSensitiveActionRateLimit } from "@/lib/security/sensitive-action-rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

const appRoles: Array<AppRole> = [
  "customer",
  "employee",
  "admin",
  "super_admin",
];

function isAppRole(value: FormDataEntryValue | null): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function getRoleManagementMessage(code?: string) {
  if (code === "last_super_admin") {
    return "No se puede quitar el ultimo super administrador.";
  }

  if (code === "not_allowed") {
    return "Solo un super administrador puede cambiar roles.";
  }

  if (code === "rate_limited") {
    return "Hay demasiados cambios sensibles en poco tiempo. Espera unos minutos.";
  }

  if (code === "user_not_found") {
    return "No pudimos encontrar ese usuario.";
  }

  return "No pudimos actualizar el rol.";
}

function parseManageRoleResult(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      code: "invalid_response",
      success: false,
    };
  }

  const record = value as Record<string, unknown>;

  return {
    changed: getBoolean(record.changed) ?? false,
    code: getString(record.code),
    success: getBoolean(record.success) ?? false,
  };
}

function getRedirectUrl(status: string, message?: string) {
  const url = new URL("/admin/usuarios", "http://localhost");

  url.searchParams.set("status", status);

  if (message) {
    url.searchParams.set("mensaje", message);
  }

  return `${url.pathname}?${url.searchParams}`;
}

export async function updateAdminUserRole(formData: FormData) {
  const { user } = await requireSuperAdmin();
  const targetUserId = formData.get("targetUserId");
  const role = formData.get("role");
  const reason = formData.get("reason");

  if (typeof targetUserId !== "string" || !isAppRole(role)) {
    redirect(
      getRedirectUrl("error", "No pudimos validar el usuario o el rol."),
    );
  }

  const rateLimit = await checkSensitiveActionRateLimit({
    identity: user.id,
    keyPrefix: "admin-role-change",
    limit: 12,
    windowSeconds: 10 * 60,
  });

  if (!rateLimit.allowed) {
    redirect(getRedirectUrl("error", getRoleManagementMessage("rate_limited")));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("manage_user_role", {
    new_role_value: role,
    reason_value: typeof reason === "string" ? reason : null,
    request_ip_hash_value: rateLimit.requestIpHash,
    target_user_id_value: targetUserId,
  });

  if (error) {
    redirect(getRedirectUrl("error", getRoleManagementMessage(error.message)));
  }

  const result = parseManageRoleResult(data);

  if (!result.success) {
    redirect(getRedirectUrl("error", getRoleManagementMessage(result.code)));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");

  redirect(
    getRedirectUrl(
      result.changed ? "updated" : "unchanged",
      result.changed
        ? "Rol actualizado correctamente."
        : "El usuario ya tenia ese rol.",
    ),
  );
}
