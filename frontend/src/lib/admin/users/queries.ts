import "server-only";
import type { User } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminManagedUser, AdminRoleAuditEntry } from "@/lib/admin/users/types";
import type { AppRole } from "@/types/database";

type ProfileSummary = {
  first_name: string | null;
  id: string;
  last_name: string | null;
};

type UserRoleSummary = {
  role: AppRole;
  user_id: string;
};

type UserLookupSummary = {
  email?: string;
  name?: string;
};

function normalizeQuery(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";
}

function getMetadataText(
  metadata: User["user_metadata"],
  key: "first_name" | "last_name" | "full_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value.trim() : "";
}

function getUserStatus(user: User): AdminManagedUser["status"] {
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
    return "disabled";
  }

  return user.email_confirmed_at ? "active" : "unconfirmed";
}

function matchesQuery({
  email,
  firstName,
  lastName,
  query,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
  query: string;
}) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();

  return [email, firstName, lastName, `${firstName ?? ""} ${lastName ?? ""}`]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

function getLookupName(lookup?: UserLookupSummary) {
  return lookup?.name?.trim() || undefined;
}

export async function getAdminUsers({
  q,
}: {
  q?: string | string[];
} = {}): Promise<Array<AdminManagedUser>> {
  await requireSuperAdmin();

  const query = normalizeQuery(q);
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error("No pudimos cargar los usuarios.");
  }

  const users = data.users;
  const userIds = users.map((user) => user.id);
  const [{ data: profiles }, { data: roles }] =
    userIds.length > 0
      ? await Promise.all([
          supabase
            .from("profiles")
            .select("id,first_name,last_name")
            .in("id", userIds),
          supabase.from("user_roles").select("user_id,role").in("user_id", userIds),
        ])
      : [{ data: [] }, { data: [] }];
  const profilesById = new Map(
    ((profiles ?? []) as Array<ProfileSummary>).map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const rolesByUserId = new Map(
    ((roles ?? []) as Array<UserRoleSummary>).map((role) => [
      role.user_id,
      role.role,
    ]),
  );

  return users
    .map((user) => {
      const profile = profilesById.get(user.id);
      const metadataFirstName = getMetadataText(user.user_metadata, "first_name");
      const metadataLastName = getMetadataText(user.user_metadata, "last_name");
      const fullName = getMetadataText(user.user_metadata, "full_name");
      const [fallbackFirstName = "", fallbackLastName = ""] = fullName.split(" ");
      const firstName =
        profile?.first_name ?? (metadataFirstName || fallbackFirstName);
      const lastName =
        profile?.last_name ?? (metadataLastName || fallbackLastName);
      const email = user.email ?? "";

      return {
        createdAt: user.created_at,
        email,
        emailConfirmedAt: user.email_confirmed_at ?? undefined,
        firstName: firstName || undefined,
        id: user.id,
        lastName: lastName || undefined,
        lastSignInAt: user.last_sign_in_at ?? undefined,
        role: rolesByUserId.get(user.id) ?? "customer",
        status: getUserStatus(user),
      };
    })
    .filter((user) =>
      matchesQuery({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        query,
      }),
    )
    .sort((left, right) => {
      const roleWeight: Record<AppRole, number> = {
        admin: 1,
        customer: 4,
        employee: 3,
        super_admin: 0,
      };

      return roleWeight[left.role] - roleWeight[right.role];
    })
    .slice(0, 80);
}

export async function getAdminRoleAuditLog(): Promise<Array<AdminRoleAuditEntry>> {
  await requireSuperAdmin();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_role_audit_log")
    .select(
      "id,target_user_id,previous_role,new_role,changed_by,action,reason,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return [];
  }

  const entries = data ?? [];
  const lookupIds = Array.from(
    new Set(
      entries
        .flatMap((entry) => [entry.target_user_id, entry.changed_by])
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const usersById = new Map<string, UserLookupSummary>();

  await Promise.all(
    lookupIds.map(async (userId) => {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const user = userData.user;

      if (!user) {
        return;
      }

      const firstName = getMetadataText(user.user_metadata, "first_name");
      const lastName = getMetadataText(user.user_metadata, "last_name");
      const fullName = getMetadataText(user.user_metadata, "full_name");

      usersById.set(user.id, {
        email: user.email,
        name: [firstName, lastName].filter(Boolean).join(" ") || fullName,
      });
    }),
  );

  return entries.map((entry) => {
    const target = usersById.get(entry.target_user_id);
    const actor = entry.changed_by ? usersById.get(entry.changed_by) : undefined;

    return {
      action: entry.action,
      actorEmail: actor?.email,
      actorName: getLookupName(actor),
      createdAt: entry.created_at,
      id: entry.id,
      newRole: entry.new_role,
      previousRole: entry.previous_role ?? undefined,
      reason: entry.reason ?? undefined,
      targetEmail: target?.email,
      targetName: getLookupName(target),
    };
  });
}
