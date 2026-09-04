import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { updateAdminUserRole } from "@/lib/admin/users/actions";
import {
  getAdminRoleAuditLog,
  getAdminUsers,
} from "@/lib/admin/users/queries";
import type {
  AdminManagedUser,
  AdminRoleAuditEntry,
} from "@/lib/admin/users/types";
import type { AppRole } from "@/types/database";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    mensaje?: string | string[];
    q?: string | string[];
    status?: string | string[];
  }>;
};

const roleOptions: Array<AppRole> = [
  "customer",
  "employee",
  "admin",
  "super_admin",
];

const statusLabels: Record<AdminManagedUser["status"], string> = {
  active: "Activo",
  disabled: "Deshabilitado",
  unconfirmed: "Sin confirmar",
};

const actionLabels: Record<AdminRoleAuditEntry["action"], string> = {
  assign: "Asignacion",
  demote: "Degradacion",
  no_change: "Sin cambios",
  promote: "Promocion",
  revoke: "Revocacion",
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Usuarios | Admin W.todocell",
};

function getSearchParam(value?: string | string[]) {
  return typeof value === "string" ? value : undefined;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function getUserName(user: AdminManagedUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

function StatusMessage({
  message,
  status,
}: {
  message?: string;
  status?: string;
}) {
  if (!message || !status) {
    return null;
  }

  const isError = status === "error";

  return (
    <div
      className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${
        isError
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-success/25 bg-[#edf5ef] text-[#4f765a]"
      }`}
      role="status"
    >
      {message}
    </div>
  );
}

function RoleChangeForm({ user }: { user: AdminManagedUser }) {
  return (
    <form action={updateAdminUserRole} className="grid gap-3">
      <input name="targetUserId" type="hidden" value={user.id} />
      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Rol
        <select
          className="h-10 rounded-full border border-border bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
          defaultValue={user.role}
          name="role"
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role)}
            </option>
          ))}
        </select>
      </label>
      <Input
        id={`reason-${user.id}`}
        label="Motivo opcional"
        maxLength={240}
        name="reason"
        placeholder="Ej. alta operativa"
      />
      <Button size="sm" type="submit" variant="secondary">
        Guardar rol
      </Button>
    </form>
  );
}

function UsersTable({ users }: { users: Array<AdminManagedUser> }) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            No encontramos usuarios
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prob&aacute; buscar por otro email o nombre registrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4">
      {users.map((user) => (
        <Card className="bg-surface/95" key={user.id}>
          <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.2fr)_180px_220px] lg:items-start">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={user.role === "super_admin" ? "sale" : "neutral"}>
                  {getRoleLabel(user.role)}
                </Badge>
                <Badge variant={user.status === "active" ? "stock" : "neutral"}>
                  {statusLabels[user.status]}
                </Badge>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {getUserName(user)}
                </h2>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-foreground">Alta</dt>
                  <dd>{formatDateTime(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Ultimo acceso</dt>
                  <dd>{formatDateTime(user.lastSignInAt)}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-[22px] border border-border bg-surface-soft p-4 text-sm leading-6 text-muted-foreground">
              Los cambios de rol quedan auditados. No se eliminan usuarios desde
              este panel.
            </div>
            <RoleChangeForm user={user} />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function AuditLog({ entries }: { entries: Array<AdminRoleAuditEntry> }) {
  return (
    <Card className="bg-surface/95">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Auditor&iacute;a reciente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro permanente de cambios administrativos de roles.
          </p>
        </div>
        {entries.length > 0 ? (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <article
                className="rounded-[20px] border border-border bg-surface-soft p-4 text-sm"
                key={entry.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{actionLabels[entry.action]}</Badge>
                  <span className="font-semibold text-foreground">
                    {entry.previousRole
                      ? `${getRoleLabel(entry.previousRole)} -> ${getRoleLabel(entry.newRole)}`
                      : getRoleLabel(entry.newRole)}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  Usuario: {entry.targetName || entry.targetEmail || "No disponible"}
                </p>
                <p className="text-muted-foreground">
                  Cambio: {entry.actorName || entry.actorEmail || "Sistema"}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </p>
                {entry.reason ? (
                  <p className="mt-2 text-muted-foreground">
                    Motivo: {entry.reason}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-[20px] border border-border bg-surface-soft p-4 text-sm text-muted-foreground">
            Todav&iacute;a no hay cambios de roles registrados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const query = getSearchParam(params?.q);
  const status = getSearchParam(params?.status);
  const message = getSearchParam(params?.mensaje);
  const [{ role, user }, users, auditLog] = await Promise.all([
    requireSuperAdmin(),
    getAdminUsers({ q: query }),
    getAdminRoleAuditLog(),
  ]);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Seguridad"
        roleLabel={getRoleLabel(role)}
        subtitle="Gestiona roles administrativos sin SQL manual y con auditoria permanente."
        title="Usuarios y roles"
        userName={userName}
      />

      <StatusMessage message={message} status={status} />

      <form className="grid gap-3 rounded-[28px] border border-border bg-surface/80 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Input
          defaultValue={query}
          id="q"
          label="Buscar usuario"
          name="q"
          placeholder="Email o nombre"
        />
        <Button size="md" type="submit" variant="primary">
          Buscar
        </Button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <UsersTable users={users} />
        <AuditLog entries={auditLog} />
      </div>
    </div>
  );
}
