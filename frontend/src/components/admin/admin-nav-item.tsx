"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

export type AdminNavIcon =
  | "categories"
  | "content"
  | "customers"
  | "newsletter"
  | "orders"
  | "overview"
  | "products"
  | "settings"
  | "shop";

export type AdminNavItemData = {
  href: string;
  icon: AdminNavIcon;
  isEnabled?: boolean;
  label: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M4.5 11.5 12 5l7.5 6.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M7 10.5v8h10v-8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ProductsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="m12 4 7 3.8v8.4L12 20l-7-3.8V7.8L12 4Z" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m5.4 8 6.6 3.5L18.6 8M12 11.5V20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function OrdersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <rect height="16" rx="3" width="13" x="5.5" y="4" strokeWidth="1.7" />
      <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function CustomersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <circle cx="9.5" cy="8.5" r="3" strokeWidth="1.7" />
      <path d="M4.5 19a5 5 0 0 1 10 0" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M16 7a2.6 2.6 0 0 1 0 5M18.5 18a4 4 0 0 0-2.4-3.7" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function CategoriesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <rect height="6" rx="2" width="6" x="4" y="4" strokeWidth="1.7" />
      <rect height="6" rx="2" width="6" x="14" y="4" strokeWidth="1.7" />
      <rect height="6" rx="2" width="6" x="4" y="14" strokeWidth="1.7" />
      <rect height="6" rx="2" width="6" x="14" y="14" strokeWidth="1.7" />
    </svg>
  );
}

function NewsletterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <rect height="13" rx="3" width="17" x="3.5" y="6" strokeWidth="1.7" />
      <path d="m5.5 9 6.5 4.4L18.5 9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M17 4.5v3M15.5 6h3" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ContentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M5 5.5h14v13H5z" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M8 9h8M8 12h5M8 15h7" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="3" strokeWidth="1.7" />
      <path d="M12 4.5v2M12 17.5v2M5.5 8.2l1.7 1M16.8 14.8l1.7 1M5.5 15.8l1.7-1M16.8 9.2l1.7-1" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ShopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M6 10.5h12l-1 9H7l-1-9Z" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M8.5 10.5a3.5 3.5 0 0 1 7 0M8 5h8" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function AdminIcon({ icon }: { icon: AdminNavIcon }) {
  const className = "h-[18px] w-[18px]";

  if (icon === "products") {
    return <ProductsIcon className={className} />;
  }

  if (icon === "orders") {
    return <OrdersIcon className={className} />;
  }

  if (icon === "customers") {
    return <CustomersIcon className={className} />;
  }

  if (icon === "categories") {
    return <CategoriesIcon className={className} />;
  }

  if (icon === "newsletter") {
    return <NewsletterIcon className={className} />;
  }

  if (icon === "content") {
    return <ContentIcon className={className} />;
  }

  if (icon === "settings") {
    return <SettingsIcon className={className} />;
  }

  if (icon === "shop") {
    return <ShopIcon className={className} />;
  }

  return <OverviewIcon className={className} />;
}

export function AdminNavItem({ href, icon, isEnabled = true, label }: AdminNavItemData) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const className = cn(
    "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-[250ms] motion-reduce:transition-none",
    isActive
      ? "bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(207,142,168,0.22)]"
      : "text-muted-foreground hover:bg-surface-soft hover:text-primary-hover",
    !isEnabled && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-muted-foreground",
  );

  if (!isEnabled) {
    return (
      <span aria-disabled="true" className={className}>
        <AdminIcon icon={icon} />
        <span className="flex-1">{label}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
          Pronto
        </span>
      </span>
    );
  }

  return (
    <Link aria-current={isActive ? "page" : undefined} className={className} href={href}>
      <AdminIcon icon={icon} />
      <span>{label}</span>
    </Link>
  );
}
