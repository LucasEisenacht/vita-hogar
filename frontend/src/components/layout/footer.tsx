"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandLeafField } from "@/components/decorative/brand-leaf-field";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

type FooterLink = { href: string; label: string };

const groups: Array<{ label: string; links: Array<FooterLink> }> = [
  { label: "Explorar", links: [{ label: "Tienda", href: "/tienda" }, { label: "Novedades", href: "/tienda?orden=newest" }, { label: "Destacados", href: "/tienda?orden=featured" }] },
  { label: "Mi compra", links: [{ label: "Buscar", href: "/buscar" }, { label: "Carrito", href: "/carrito" }, { label: "Mi cuenta", href: "/mi-cuenta" }, { label: "Favoritos", href: "/mi-cuenta/favoritos" }] },
  { label: "Contacto", links: [{ label: "WhatsApp", href: siteConfig.whatsapp.url }] },
];

function FooterLinkItem({ href, label }: FooterLink) {
  const className = "inline-flex min-h-9 items-center text-sm text-secondary underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return href.startsWith("http") ? <a className={className} href={href} rel="noopener noreferrer" target="_blank">{label}</a> : <Link className={className} href={href}>{label}</Link>;
}

export function Footer() {
  return <footer className="vita-footer border-t border-border bg-surface text-foreground"><BrandLeafField variant="footer" /><Container className="py-12 sm:py-16"><div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]"><div><Link aria-label="Ir al inicio de VITA HOGAR" className="inline-flex h-16 w-16 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" href="/"><Image alt={siteConfig.logo.alt} className="h-full w-full object-contain" height={88} src={siteConfig.logo.src} width={88} /></Link><p className="mt-5 font-display text-3xl text-foreground">{siteConfig.name}</p><p className="mt-3 max-w-sm text-sm leading-6 text-secondary">Una casa se arma con decisiones simples, materiales que duran y detalles que se disfrutan todos los días.</p></div><div className="grid gap-8 sm:grid-cols-3">{groups.map((group) => <nav aria-label={group.label} key={group.label}><p className="vita-label">{group.label}</p><div className="mt-4 grid gap-1">{group.links.map((link) => <FooterLinkItem {...link} key={link.href} />)}</div></nav>)}</div></div><div className="mt-12 flex flex-col gap-3 border-t border-border pt-5 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</p><p>{siteConfig.coverage}</p></div></Container></footer>;
}