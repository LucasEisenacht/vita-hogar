"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { CatalogSearch } from "@/components/search/catalog-search";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useExperience } from "@/components/experience/experience-provider";
import { useCart } from "@/context/cart-context";
import { ENABLE_MINI_CART } from "@/config/mini-cart";
import { siteConfig } from "@/config/site";

type NavbarProps = { isAuthenticated?: boolean };

type IconProps = SVGProps<SVGSVGElement>;

const primaryLinks = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/tienda?orden=newest", label: "Novedades" },
];

const exploreLinks = [
  { href: "/tienda", label: "Ver toda la tienda", detail: "La selección disponible hoy." },
  { href: "/tienda?orden=featured", label: "Destacados", detail: "Productos señalados en el catálogo." },
  { href: "/tienda?orden=newest", label: "Recién llegados", detail: "Ordenado por las últimas novedades." },
  { href: "/tienda?disponibilidad=in_stock", label: "En stock", detail: "Disponible para comprar ahora." },
];

function SearchIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><circle cx="11" cy="11" r="6.25" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>;
}

function HeartIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><path d="M12 20.25s-7.25-4.42-8.67-9.28C2.28 7.38 4.48 4.5 7.56 4.5c1.8 0 3.29 1 4.44 2.42C13.15 5.5 14.64 4.5 16.44 4.5c3.08 0 5.28 2.88 4.23 6.47C19.25 15.83 12 20.25 12 20.25Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function UserIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><circle cx="12" cy="8.5" r="3.25" /><path d="M5.75 19.25a6.25 6.25 0 0 1 12.5 0" strokeLinecap="round" /></svg>;
}

function BagIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><path d="M6.75 8.5h10.5l1 11H5.75l1-11Z" strokeLinejoin="round" /><path d="M9 8.5a3 3 0 0 1 6 0" strokeLinecap="round" /></svg>;
}

function MenuIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" /></svg>;
}

function CloseIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" /></svg>;
}

function ChevronIcon(props: IconProps) {
  return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}><path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function isActive(pathname: string, href: string) {
  const [path] = href.split("?");
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

function IconLink({ children, href, label, onClick }: { children: ReactNode; href: string; label: string; onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return <Link aria-label={label} className="relative inline-flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-background-alt hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface" href={href} onClick={onClick}>{children}</Link>;
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const { openMiniCart, totalItems } = useCart();
  const { optimisticWishlistCount } = useExperience();
  const accountHref = isAuthenticated ? "/mi-cuenta" : "/ingresar";
  const menuId = useId();
  const mobileDialogRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isAdminPath = pathname.startsWith("/admin");


  useEffect(() => {
    if (!isMobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileOpen(false);
        window.setTimeout(() => menuButtonRef.current?.focus(), 0);
        return;
      }
      if (event.key !== "Tab" || !mobileDialogRef.current) return;
      const focusable = Array.from(mobileDialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isExploreOpen) return;
    const closeOnEscapeOrOutside = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") { setIsExploreOpen(false); return; }
      if (event instanceof PointerEvent && !headerRef.current?.contains(event.target as Node)) setIsExploreOpen(false);
    };
    document.addEventListener("keydown", closeOnEscapeOrOutside);
    document.addEventListener("pointerdown", closeOnEscapeOrOutside);
    return () => { document.removeEventListener("keydown", closeOnEscapeOrOutside); document.removeEventListener("pointerdown", closeOnEscapeOrOutside); };
  }, [isExploreOpen, pathname]);
  if (isAdminPath) return null;

  const closeMobile = () => setIsMobileOpen(false);

  return <header className="vita-navbar sticky top-0 z-40 border-b border-border bg-surface" ref={headerRef}>
    <Container className="vita-navbar__rail flex h-[72px] items-center justify-between gap-3 lg:grid lg:grid-cols-[72px_minmax(0,1fr)_auto]">
      <Link aria-label="Ir al inicio de VITA HOGAR" className="vita-navbar__logo flex h-[60px] w-[60px] shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:h-[72px] lg:w-[72px]" href="/">
        <Image alt={siteConfig.logo.alt} className="h-full w-full object-contain" height={96} priority src={siteConfig.logo.src} width={96} />
      </Link>

      <nav aria-label="Navegación principal" className="vita-navbar__nav hidden items-center justify-center gap-1 lg:inline-flex lg:justify-self-center">
        {primaryLinks.map((link) => <Link aria-current={isActive(pathname, link.href) ? "page" : undefined} className={`inline-flex h-11 items-center px-3 text-sm font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive(pathname, link.href) ? "text-primary" : "text-secondary hover:text-primary"}`} href={link.href} key={link.href}>{link.label}</Link>)}
        <button aria-controls={menuId} aria-expanded={isExploreOpen} className="vita-explore-trigger inline-flex h-11 items-center justify-center gap-1 px-3 text-sm font-semibold leading-none text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setIsExploreOpen((open) => !open)} type="button">Explorar <ChevronIcon className={`h-4 w-4 transition-transform duration-150 ${isExploreOpen ? "rotate-180" : ""}`} /></button>
      </nav>

      <div className="vita-navbar__actions flex w-[132px] shrink-0 items-center sm:w-auto">
        <CatalogSearch className="h-11 w-11 rounded-none border-0 bg-transparent shadow-none hover:bg-background-alt" onOpen={() => { setIsExploreOpen(false); closeMobile(); }} />
        <span className="hidden sm:contents"><IconLink href="/mi-cuenta/favoritos" label={`Mis favoritos, ${optimisticWishlistCount} productos`}><HeartIcon className="h-5 w-5" />{optimisticWishlistCount > 0 ? <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold text-white">{optimisticWishlistCount}</span> : null}</IconLink></span>
        <span className="hidden sm:contents"><IconLink href={accountHref} label={isAuthenticated ? "Ir a mi cuenta" : "Ingresar a mi cuenta"}><UserIcon className="h-5 w-5" /></IconLink></span>
        <IconLink href="/carrito" label={`Carrito, ${totalItems} productos`} onClick={(event) => { if (!ENABLE_MINI_CART) return; event.preventDefault(); openMiniCart(); }}><BagIcon className="h-5 w-5" />{totalItems > 0 ? <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold text-white">{totalItems}</span> : null}</IconLink>
        <button aria-controls="mobile-navigation" aria-expanded={isMobileOpen} aria-label={isMobileOpen ? "Cerrar menú" : "Abrir menú"} className={buttonStyles({ className: "h-11 w-11 rounded-none lg:hidden", size: "icon", variant: "ghost" })} onClick={() => setIsMobileOpen((open) => !open)} ref={menuButtonRef} type="button">{isMobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}</button>
      </div>
    </Container>

    {isExploreOpen ? <div className="vita-explore-panel absolute inset-x-0 top-full hidden border-b border-border bg-surface lg:block" id={menuId}>
      <Container className="grid grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] gap-12 py-8">
        <div className="max-w-sm"><p className="vita-label">La selección</p><h2 className="mt-3 font-display text-3xl leading-tight text-foreground">Explorar VITA HOGAR.</h2><p className="mt-4 text-base leading-7 text-secondary">Una selección editorial para recorrer materiales, texturas y objetos cotidianos.</p></div>
        <nav aria-label="Explorar tienda" className="grid grid-cols-2 gap-x-8 gap-y-6">{exploreLinks.map((link) => <Link className="group border-b border-border pb-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={link.href} key={link.href} onClick={() => setIsExploreOpen(false)}><span className="block font-display text-xl text-foreground transition-colors group-hover:text-primary">{link.label}</span><span className="mt-1 block text-sm leading-5 text-secondary">{link.detail}</span></Link>)}</nav>
      </Container>
    </div> : null}

    {isMobileOpen ? <div className="fixed inset-0 z-[80] bg-foreground/30 p-3 lg:hidden" id="mobile-navigation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMobile(); }}>
      <section aria-label="Menú móvil" className="ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-surface shadow-[0_12px_32px_rgba(46,41,36,0.08)]" ref={mobileDialogRef}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4"><Link aria-label="Ir al inicio de VITA HOGAR" className="flex h-14 w-14 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/" onClick={closeMobile}><Image alt={siteConfig.logo.alt} className="h-full w-full object-contain" height={72} src={siteConfig.logo.src} width={72} /></Link><button aria-label="Cerrar menú" className={buttonStyles({ className: "h-11 w-11 rounded-none", size: "icon", variant: "ghost" })} onClick={closeMobile} ref={closeButtonRef} type="button"><CloseIcon className="h-5 w-5" /></button></div>
        <div className="grid gap-1 p-4"><Link className="flex min-h-11 items-center gap-3 border-b border-border py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/buscar" onClick={closeMobile}><SearchIcon className="h-5 w-5" />Buscar en la tienda</Link>{primaryLinks.map((link) => <Link aria-current={isActive(pathname, link.href) ? "page" : undefined} className={`min-h-11 border-b border-border py-3 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive(pathname, link.href) ? "text-primary" : "text-foreground"}`} href={link.href} key={link.href} onClick={closeMobile}>{link.label}</Link>)}</div>
        <div className="mx-4 border-y border-border py-4"><p className="vita-label">Explorar</p><nav aria-label="Explorar tienda" className="mt-3 grid gap-1">{exploreLinks.map((link) => <Link className="min-h-11 py-2 text-sm font-semibold text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={link.href} key={link.href} onClick={closeMobile}>{link.label}</Link>)}</nav></div>
        <div className="mt-auto grid gap-1 p-4"><Link className="min-h-11 py-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={accountHref} onClick={closeMobile}>{isAuthenticated ? "Mi cuenta" : "Ingresar"}</Link><Link className="min-h-11 py-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/mi-cuenta/favoritos" onClick={closeMobile}>Favoritos{optimisticWishlistCount ? ` (${optimisticWishlistCount})` : ""}</Link><Link className="min-h-11 py-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/carrito" onClick={closeMobile}>Carrito ({totalItems})</Link></div>
      </section>
    </div> : null}
  </header>;
}