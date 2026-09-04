import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getRoleLabel } from "@/lib/auth/get-current-role";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

type AdminLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = createNoIndexMetadata({
  description: "Panel administrativo privado de W.todocell.",
  title: "Admin | W.todocell",
});

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { role, user } = await requireAdmin();
  const firstName = getMetadataText(user.user_metadata, "first_name");
  const lastName = getMetadataText(user.user_metadata, "last_name");
  const userName =
    [firstName, lastName].filter(Boolean).join(" ") || "Equipo W.todocell";
  const roleLabel = getRoleLabel(role);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminMobileNav roleLabel={roleLabel} userName={userName} />
      <div className="flex min-h-screen w-full">
        <AdminSidebar roleLabel={roleLabel} userName={userName} />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
