"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import {
  HeartMark,
  InstagramIcon,
  SparkleMark,
  WhatsAppIcon,
} from "@/components/brand/brand-marks";
import { Container } from "@/components/ui/container";
import { plannedNavigationCategories } from "@/config/catalog-navigation";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";
import { siteConfig } from "@/config/site";

type FooterLinkItem = {
  href: string;
  label: string;
};

type FooterGroup = {
  items: Array<FooterLinkItem>;
  label: string;
};

const shoppingLinks: Array<FooterLinkItem> = [
  { label: "Tienda", href: "/tienda" },
  ...plannedNavigationCategories
    .filter((category) =>
      [
        "fundas",
        "accesorios",
        "celulares",
        "consolas",
        "combos",
        "pop-socket",
      ].includes(category.slug),
    )
    .map((category) => ({
      href: getCatalogCategoryHref(category.slug),
      label: category.name,
    })),
];

const accountLinks: Array<FooterLinkItem> = [
  { label: "Buscar", href: "/buscar" },
  { label: "Carrito", href: "/carrito" },
  { label: "Mi cuenta", href: "/mi-cuenta" },
  { label: "Favoritos", href: "/mi-cuenta/favoritos" },
];

const contactLinks: Array<FooterLinkItem> = [
  { label: "Instagram", href: siteConfig.instagram.url },
  { label: "WhatsApp", href: siteConfig.whatsapp.url },
];

const footerGroups: Array<FooterGroup> = [
  { items: shoppingLinks, label: "Comprar" },
  { items: accountLinks, label: "Cuenta" },
  { items: contactLinks, label: "Contacto" },
];

const paymentItems = ["Transferencia bancaria"];
const shippingItems = [siteConfig.coverage, "Moto AMBA", "Correo Argentino"];

function isExternalHref(href: string) {
  return href.startsWith("http");
}

function FooterLink({ href, label }: FooterLinkItem) {
  const className =
    "group/footer-link inline-flex min-h-7 items-center gap-2 text-sm font-medium text-[#49393f] transition-all duration-[200ms] hover:translate-x-0.5 hover:text-[#a96780] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-x-0";
  const content = (
    <>
      <span
        aria-hidden="true"
        className="h-1 w-1 rounded-full bg-[#e9b6c7] opacity-0 transition-opacity duration-[200ms] group-hover/footer-link:opacity-80"
      />
      <span>{label}</span>
    </>
  );
  const isExternal = isExternalHref(href);

  if (isExternal) {
    return (
      <a
        className={className}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}

function SocialPill({
  ariaLabel,
  children,
  href,
  icon,
}: {
  ariaLabel: string;
  children: ReactNode;
  href: string;
  icon: ReactNode;
}) {
  return (
    <a
      aria-label={ariaLabel}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[16px] border border-[rgba(218,143,171,0.34)] bg-[rgba(255,232,241,0.82)] px-3.5 text-sm font-semibold text-[#4b343d] shadow-[0_8px_18px_rgba(172,105,132,0.08)] backdrop-blur-sm transition-all duration-[220ms] hover:-translate-y-0.5 hover:border-[rgba(204,119,151,0.52)] hover:bg-[rgba(245,200,217,0.72)] hover:text-[#4b343d] hover:shadow-[0_12px_26px_rgba(172,105,132,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}

function FooterPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[rgba(216,145,171,0.28)] bg-[rgba(244,203,218,0.4)] px-2.5 py-1 text-[0.72rem] font-medium text-[#72535f] backdrop-blur-sm transition-colors duration-[200ms] hover:bg-[rgba(240,185,206,0.52)]">
      {children}
    </span>
  );
}

function DesktopFooterGroup({ group }: { group: FooterGroup }) {
  return (
    <div className="hidden space-y-3 md:block">
      <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#a96780]">
        {group.label}
      </h2>
      <nav aria-label={group.label} className="grid gap-2.5">
        {group.items.map((item) => (
          <FooterLink href={item.href} key={item.href} label={item.label} />
        ))}
      </nav>
    </div>
  );
}

function MobileFooterAccordion({
  group,
  isOpen,
  onToggle,
}: {
  group: FooterGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = `${useId()}-${group.label}`;

  return (
    <div className="border-b border-white/42 py-1 md:hidden">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-3 text-left font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#a96780] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onToggle}
        type="button"
      >
        {group.label}
        <span
          aria-hidden="true"
          className={`text-lg leading-none transition-transform duration-[220ms] motion-reduce:transition-none ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {isOpen ? (
        <nav aria-label={group.label} className="grid gap-2.5 pb-3" id={panelId}>
          {group.items.map((item) => (
            <FooterLink href={item.href} key={item.href} label={item.label} />
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,235,242,0.88)_0%,rgba(250,219,231,0.9)_54%,rgba(255,240,235,0.9)_100%)] text-[#2f2529]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(225,145,176,0.44),transparent)]" />
      <span
        aria-hidden="true"
        className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-primary/18 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-[#f4bed3]/32 blur-3xl"
      />

      <Container className="relative max-w-[1320px] py-8 sm:py-10 lg:py-12">
        <SparkleMark className="wt-sparkle-soft pointer-events-none absolute right-6 top-8 h-6 w-6 text-[#f6c8d8] opacity-80 sm:right-10 [animation-delay:1.2s]" />
        <SparkleMark className="wt-sparkle-soft pointer-events-none absolute bottom-16 left-8 hidden h-4 w-4 text-[#e9b6c7] opacity-[0.68] sm:block [animation-delay:2.6s]" />
        <HeartMark className="pointer-events-none absolute bottom-[5.5rem] left-10 hidden h-5 w-5 text-[#e9b6c7] opacity-[0.34] sm:block" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[18%] top-16 hidden h-1.5 w-1.5 rounded-full bg-[#f6c8d8] opacity-80 shadow-[0_0_9px_rgba(246,200,216,0.6)] lg:block"
        />

        <div className="relative overflow-hidden rounded-[28px] border border-[rgba(224,153,180,0.32)] bg-[linear-gradient(135deg,rgba(255,238,244,0.96),rgba(252,229,238,0.93),rgba(255,244,239,0.95))] p-5 shadow-[0_26px_70px_rgba(172,105,132,0.16),0_0_35px_rgba(244,190,211,0.14)] sm:p-6 lg:p-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(225,145,176,0.44),transparent)]"
          />
          <SparkleMark className="wt-sparkle-soft pointer-events-none absolute left-[42%] top-6 hidden h-4 w-4 text-[#f4d6e1] opacity-[0.72] lg:block [animation-delay:3.2s]" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-12 left-[36%] hidden h-1.5 w-1.5 rounded-full bg-[#f5e6da] opacity-80 shadow-[0_0_8px_rgba(245,230,218,0.56)] lg:block"
          />
          <span
            aria-hidden="true"
            className="wt-sparkle-cluster bottom-10 right-10 hidden text-[#f6c8d8] opacity-80 sm:block [animation-delay:1.8s]"
          />

          <div className="grid gap-7 lg:grid-cols-[minmax(260px,0.95fr)_minmax(0,1.45fr)_minmax(240px,0.9fr)] lg:gap-10">
            <div className="max-w-sm space-y-4">
              <Link
                aria-label="Ir al inicio"
                className="inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full transition-all duration-[240ms] hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-[5.25rem] sm:w-[5.25rem]"
                href="/"
              >
                <Image
                  alt={siteConfig.logo.alt}
                  className="h-full w-full object-contain"
                  height={112}
                  src={siteConfig.logo.src}
                  width={112}
                />
              </Link>
              <div className="space-y-2.5">
                <p className="font-display text-xl font-bold text-[#2f2529]">
                  {siteConfig.name}
                </p>
                <p className="max-w-[21rem] text-sm leading-7 text-[#7d666e]">
                  Accesorios y tecnologia elegidos con una mirada suave,
                  moderna y personal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <SocialPill
                  ariaLabel="Seguir a W.todocell en Instagram"
                  href={siteConfig.instagram.url}
                  icon={<InstagramIcon className="h-5 w-5" />}
                >
                  Instagram
                </SocialPill>
                <SocialPill
                  ariaLabel="Hablar con W.todocell por WhatsApp"
                  href={siteConfig.whatsapp.url}
                  icon={<WhatsAppIcon className="h-5 w-5" />}
                >
                  WhatsApp
                </SocialPill>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3 md:gap-6">
              {footerGroups.map((group) => (
                <div key={group.label}>
                  <DesktopFooterGroup group={group} />
                  <MobileFooterAccordion
                    group={group}
                    isOpen={openMobileGroup === group.label}
                    onToggle={() =>
                      setOpenMobileGroup((currentGroup) =>
                        currentGroup === group.label ? null : group.label,
                      )
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-6 text-[#7d666e]">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#a96780]">
                  Información útil
                </p>
                <p>
                  {siteConfig.location.city}, {siteConfig.location.province}
                </p>
                <p>{siteConfig.coverage}</p>
              </div>
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-[#9f5e78]">
                  Métodos de pago
                </p>
                <div className="flex flex-wrap gap-2">
                  {paymentItems.map((item) => (
                    <FooterPill key={item}>{item}</FooterPill>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-[#9f5e78]">
                  Entregas
                </p>
                <div className="flex flex-wrap gap-2">
                  {shippingItems.map((item) => (
                    <FooterPill key={item}>{item}</FooterPill>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 border-t border-transparent bg-[linear-gradient(90deg,transparent,rgba(209,135,163,0.34),transparent)] bg-[length:100%_1px] bg-top bg-no-repeat pt-4 text-sm text-[#806b72] sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {currentYear} {siteConfig.name}. Todos los derechos
              reservados.
            </p>
            <p>Atención personalizada por WhatsApp e Instagram.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
