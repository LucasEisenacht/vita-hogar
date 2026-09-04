"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminNavItems } from "@/components/admin/admin-nav-data";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

type AdminMobileNavProps = {
  roleLabel: string;
  userName: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function AdminMobileNav({ roleLabel, userName }: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between gap-4 px-5">
        <Link
          className="flex items-center gap-3"
          href="/admin"
          onClick={() => setIsOpen(false)}
        >
          <Image
            alt={siteConfig.logo.alt}
            className="h-10 w-10 object-contain"
            height={40}
            priority
            src={siteConfig.logo.src}
            width={40}
          />
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              Admin
            </p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </Link>
        <Button
          aria-controls="admin-mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar navegación administrativa" : "Abrir navegación administrativa"}
          className="h-10 w-10"
          onClick={() => setIsOpen((current) => !current)}
          size="icon"
          variant="ghost"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </Button>
      </div>

      {isOpen ? (
        <div className="border-t border-border bg-background" id="admin-mobile-navigation">
          <div className="space-y-4 px-5 py-4">
            <div className="rounded-3xl border border-border bg-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sesión
              </p>
              <p className="mt-1 font-display text-base font-semibold text-foreground">
                {userName}
              </p>
            </div>
            <nav aria-label="Navegación administrativa móvil" className="grid gap-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;

                if (item.isEnabled === false) {
                  return (
                    <span
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground opacity-60"
                      key={item.label}
                    >
                      {item.label}
                      <span className="text-[10px] uppercase tracking-[0.12em]">
                        Pronto
                      </span>
                    </span>
                  );
                }

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-[250ms]",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-surface-soft hover:text-primary-hover",
                    )}
                    href={item.href}
                    key={item.label}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
