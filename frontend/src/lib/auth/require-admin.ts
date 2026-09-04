import { redirect } from "next/navigation";
import { getCurrentRole, isAdminRole } from "@/lib/auth/get-current-role";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/admin");
  }

  const role = await getCurrentRole(user);

  if (!isAdminRole(role)) {
    redirect("/mi-cuenta?error=sin-permisos");
  }

  return {
    role,
    user,
  };
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/admin/usuarios");
  }

  const role = await getCurrentRole(user);

  if (role !== "super_admin") {
    redirect("/admin?error=requiere-super-admin");
  }

  return {
    role,
    user,
  };
}
