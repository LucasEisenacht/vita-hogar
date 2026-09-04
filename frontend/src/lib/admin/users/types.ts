import type { AppRole } from "@/types/database";

export type AdminManagedUser = {
  createdAt: string;
  email: string;
  emailConfirmedAt?: string;
  firstName?: string;
  id: string;
  lastName?: string;
  lastSignInAt?: string;
  role: AppRole;
  status: "active" | "disabled" | "unconfirmed";
};

export type AdminRoleAuditEntry = {
  action: "assign" | "demote" | "no_change" | "promote" | "revoke";
  actorEmail?: string;
  actorName?: string;
  createdAt: string;
  id: string;
  newRole: AppRole;
  previousRole?: AppRole;
  reason?: string;
  targetEmail?: string;
  targetName?: string;
};
