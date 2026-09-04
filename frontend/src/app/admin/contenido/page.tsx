import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { HomeContentForm } from "@/components/admin/content/home-content-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getHomeContentConfigResult } from "@/lib/home-content/config";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createNoIndexMetadata({
  description: "Gestion de contenido de la portada de W.todocell.",
  title: "Contenido | W.todocell Admin",
});

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function AdminContentPage() {
  const [{ role, user }, contentResult] = await Promise.all([
    requireAdmin(),
    getHomeContentConfigResult(),
  ]);
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const roleLabel = getRoleLabel(role);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="CMS de portada"
        roleLabel={roleLabel}
        subtitle="Administra los bloques principales de la portada sin tocar los componentes visuales."
        title="Contenido de Home"
        userName={userName}
      />

      <Card className="bg-surface-soft/70">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="new">Supabase</Badge>
              <Badge variant="neutral">Fallback local disponible</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Fuente actual:{" "}
              {contentResult.source === "supabase"
                ? "Supabase public.home_content"
                : "fallback local src/config/local/home-content.json"}
              . La Home consume una capa desacoplada y no conoce la fuente de
              datos concreta.
            </p>
            {contentResult.warning ? (
              <p className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
                {contentResult.warning}
              </p>
            ) : null}
            {!contentResult.canPersist ? (
              <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                El formulario puede cargarse, pero no va a poder persistir
                cambios hasta aplicar la migracion de Supabase.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <HomeContentForm
        content={contentResult.config}
        updatedAt={contentResult.updatedAt}
      />
    </div>
  );
}
