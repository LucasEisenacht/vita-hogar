import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

export function isAdminRole(role: AppRole) {
  return role === "employee" || role === "admin" || role === "super_admin";
}

export function getRoleLabel(role: AppRole) {
  if (role === "super_admin") {
    return "Superadministrador";
  }

  if (role === "admin") {
    return "Administrador";
  }

  if (role === "employee") {
    return "Empleado";
  }

  return "Cliente";
}

export async function getCurrentRole(user: User): Promise<AppRole> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.role ?? "customer";
}
