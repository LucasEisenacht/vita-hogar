import Image from "next/image";
import Link from "next/link";
import { AdminNavItem } from "@/components/admin/admin-nav-item";
import { adminNavItems } from "@/components/admin/admin-nav-data";
import { HeartDivider } from "@/components/brand/brand-marks";
import { siteConfig } from "@/config/site";

type AdminSidebarProps = {
  roleLabel: string;
  userName: string;
};

export function AdminSidebar({ roleLabel, userName }: AdminSidebarProps) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-border bg-surface/80 px-5 py-6 shadow-[16px_0_54px_rgba(74,55,47,0.04)] lg:flex lg:flex-col">
      <Link
        className="flex items-center gap-3 rounded-3xl p-2 transition-opacity duration-[250ms] hover:opacity-80"
        href="/admin"
      >
        <Image
          alt={siteConfig.logo.alt}
          className="h-12 w-12 object-contain"
          height={48}
          priority
          src={siteConfig.logo.src}
          width={48}
        />
        <div>
          <p className="font-display text-lg font-semibold text-foreground">
            {siteConfig.name}
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-hover">
            Admin
          </p>
        </div>
      </Link>

      <HeartDivider className="my-6 max-w-full" />

      <nav aria-label="Navegación administrativa" className="grid gap-1">
        {adminNavItems.map((item) => (
          <AdminNavItem
            href={item.href}
            icon={item.icon}
            isEnabled={item.isEnabled}
            key={item.label}
            label={item.label}
          />
        ))}
      </nav>

      <div className="mt-auto rounded-[26px] border border-border bg-background/75 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Sesión
        </p>
        <p className="mt-2 truncate font-display text-base font-semibold text-foreground">
          {userName}
        </p>
        <p className="mt-1 text-sm text-primary-hover">{roleLabel}</p>
      </div>
    </aside>
  );
}
