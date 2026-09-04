"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MouseEvent, ReactNode, SVGProps } from "react";
import { buttonStyles } from "@/components/ui/button";
import { CatalogSearch } from "@/components/search/catalog-search";
import { Container } from "@/components/ui/container";
import { useCart } from "@/context/cart-context";
import { useExperience } from "@/components/experience/experience-provider";
import { mainNavigationItems } from "@/config/catalog-navigation";
import { ENABLE_NAVBAR_SPARKLES } from "@/config/decorative-effects";
import { ENABLE_MINI_CART } from "@/config/mini-cart";
import { siteConfig } from "@/config/site";

type NavbarProps = {
  isAuthenticated?: boolean;
};

type NavLink = {
  description?: string;
  href: string;
  label: string;
};

type MegaMenuConfig = {
  accent: string;
  columns: Array<{
    links: Array<NavLink>;
    title: string;
  }>;
  editorial: {
    description: string;
    href: string;
    imageAlt: string;
    imageSrc: string;
    label: string;
    title: string;
  };
};

const hoverDelayMs = 140;

const megaMenus: Record<string, MegaMenuConfig> = {
  "/tienda": {
    accent: "Tienda completa",
    columns: [
      {
        title: "Explorar",
        links: [
          { href: "/tienda", label: "Ver todo" },
          { href: "/tienda?orden=newest", label: "Novedades" },
          { href: "/tienda?orden=featured", label: "Destacados" },
          { href: "/tienda?disponibilidad=in_stock", label: "En stock" },
          { href: "/tienda/combos", label: "Combos" },
        ],
      },
      {
        title: "Categorias",
        links: [
          { href: "/tienda/fundas", label: "Fundas" },
          { href: "/tienda/accesorios", label: "Accesorios" },
          { href: "/tienda/celulares", label: "Celulares" },
          { href: "/tienda/consolas", label: "Consolas" },
          { href: "/tienda/pop-socket", label: "Pop Socket" },
        ],
      },
    ],
    editorial: {
      description: "Accesorios y tecnologia elegidos con mirada W.todocell.",
      href: "/tienda",
      imageAlt: "Seleccion editorial de productos W.todocell.",
      imageSrc: "/images/mega-menu/accesorios.webp",
      label: "Entrar a la tienda",
      title: "Todo para combinar con tu estilo.",
    },
  },
  "/tienda/fundas": {
    accent: "Fundas",
    columns: [
      {
        title: "Comprar fundas",
        links: [
          { href: "/tienda/fundas", label: "Todas las fundas" },
          { href: "/tienda/fundas?orden=newest", label: "Novedades" },
          { href: "/tienda/fundas?orden=featured", label: "Destacadas" },
          { href: "/tienda/fundas?disponibilidad=in_stock", label: "En stock" },
        ],
      },
      {
        title: "Modelos y estilos",
        links: [
          {
            href: "/buscar?q=iPhone",
            label: "Buscar iPhone",
            description: "Busqueda real en catalogo",
          },
          {
            href: "/buscar?q=Samsung",
            label: "Buscar Samsung",
            description: "Busqueda real en catalogo",
          },
          {
            href: "/buscar?q=Motorola",
            label: "Buscar Motorola",
            description: "Busqueda real en catalogo",
          },
        ],
      },
    ],
    editorial: {
      description: "Fundas pensadas para proteger sin perder delicadeza.",
      href: "/tienda/fundas",
      imageAlt: "Fundas y accesorios en una escena rosa pastel.",
      imageSrc: "/images/mega-menu/fundas.webp",
      label: "Ver fundas",
      title: "Encontra tu estilo.",
    },
  },
  "/tienda/accesorios": {
    accent: "Accesorios",
    columns: [
      {
        title: "Accesos rapidos",
        links: [
          { href: "/tienda/accesorios", label: "Todos los accesorios" },
          { href: "/tienda/accesorios?orden=newest", label: "Mas recientes" },
          { href: "/tienda/accesorios?orden=featured", label: "Destacados" },
          {
            href: "/tienda/accesorios?disponibilidad=in_stock",
            label: "Disponibles ahora",
          },
        ],
      },
      {
        title: "Buscar por tipo",
        links: [
          { href: "/buscar?q=cargador", label: "Cargadores" },
          { href: "/buscar?q=cable", label: "Cables" },
          { href: "/buscar?q=auricular", label: "Auriculares" },
          { href: "/buscar?q=protector", label: "Protectores" },
        ],
      },
    ],
    editorial: {
      description: "Pequenos detalles tecnologicos para todos los dias.",
      href: "/tienda/accesorios",
      imageAlt: "Tecnologia y accesorios premium para uso cotidiano.",
      imageSrc: "/images/mega-menu/accesorios.webp",
      label: "Ver accesorios",
      title: "Tecnologia con una mirada suave.",
    },
  },
  "/tienda/celulares": {
    accent: "Celulares",
    columns: [
      {
        title: "Estado",
        links: [
          { href: "/tienda/celulares", label: "Todos los celulares" },
          { href: "/tienda/celulares?condicion=new", label: "Nuevos" },
          { href: "/tienda/celulares?condicion=used", label: "Usados" },
          {
            href: "/tienda/celulares?condicion=refurbished",
            label: "Reacondicionados",
          },
        ],
      },
      {
        title: "Buscar por marca",
        links: [
          { href: "/buscar?q=Apple", label: "Apple" },
          { href: "/buscar?q=Samsung", label: "Samsung" },
          { href: "/buscar?q=Motorola", label: "Motorola" },
        ],
      },
    ],
    editorial: {
      description: "Equipos seleccionados para comprar con mas calma.",
      href: "/tienda/celulares",
      imageAlt: "Celulares y tecnologia premium en una escena champagne.",
      imageSrc: "/images/mega-menu/celulares.webp",
      label: "Ver celulares",
      title: "Tecnologia lista para acompanar tu dia.",
    },
  },
  "/tienda/consolas": {
    accent: "Gaming",
    columns: [
      {
        title: "Consolas y gaming",
        links: [
          { href: "/tienda/consolas", label: "Ver consolas" },
          { href: "/tienda/consolas?orden=newest", label: "Novedades gaming" },
          {
            href: "/tienda/consolas?disponibilidad=in_stock",
            label: "Disponibles ahora",
          },
          { href: "/buscar?q=gaming", label: "Buscar gaming" },
        ],
      },
      {
        title: "Buscar por familia",
        links: [
          { href: "/buscar?q=PlayStation", label: "PlayStation" },
          { href: "/buscar?q=Nintendo", label: "Nintendo" },
          { href: "/buscar?q=joystick", label: "Joysticks" },
          { href: "/buscar?q=auricular gaming", label: "Auriculares gaming" },
        ],
      },
    ],
    editorial: {
      description: "Consolas, controles y accesorios para jugar mejor.",
      href: "/tienda/consolas",
      imageAlt: "Productos gaming y consola en una composicion premium.",
      imageSrc: "/images/mega-menu/gaming.webp",
      label: "Ver gaming",
      title: "Tu setup tambien puede verse bien.",
    },
  },
  "/tienda/combos": {
    accent: "Combos",
    columns: [
      {
        title: "Packs",
        links: [
          { href: "/tienda/combos", label: "Todos los combos" },
          { href: "/tienda/combos?orden=newest", label: "Combos nuevos" },
          { href: "/tienda/combos?orden=featured", label: "Destacados" },
          {
            href: "/tienda/combos?disponibilidad=in_stock",
            label: "Listos para comprar",
          },
        ],
      },
      {
        title: "Ideas",
        links: [
          { href: "/buscar?q=pack", label: "Packs" },
          { href: "/buscar?q=regalo", label: "Regalos" },
          { href: "/buscar?q=combo", label: "Combos de accesorios" },
        ],
      },
    ],
    editorial: {
      description: "Selecciones preparadas para regalar o resolver rapido.",
      href: "/tienda/combos",
      imageAlt: "Packaging cuidado de W.todocell para una experiencia especial.",
      imageSrc: "/images/mega-menu/combos.webp",
      label: "Ver combos",
      title: "Detalles que llegan listos.",
    },
  },
  "/tienda/pop-socket": {
    accent: "Pop Socket",
    columns: [
      {
        title: "Comprar grips",
        links: [
          { href: "/tienda/pop-socket", label: "Todos los Pop Socket" },
          { href: "/tienda/pop-socket?orden=newest", label: "Novedades" },
          { href: "/tienda/pop-socket?orden=featured", label: "Destacados" },
          {
            href: "/tienda/pop-socket?disponibilidad=in_stock",
            label: "En stock",
          },
        ],
      },
      {
        title: "Buscar por tipo",
        links: [
          { href: "/buscar?q=pop socket", label: "Pop Socket" },
          { href: "/buscar?q=grip", label: "Grips" },
          { href: "/buscar?q=soporte", label: "Soportes" },
        ],
      },
    ],
    editorial: {
      description: "Grips compactos para sumar comodidad y estilo al celular.",
      href: "/tienda/pop-socket",
      imageAlt: "Pop Socket y grips W.todocell en estilo editorial.",
      imageSrc: "/images/mega-menu/pop-socket.webp",
      label: "Ver Pop Socket",
      title: "Un detalle chico que cambia todo.",
    },
  },
};

function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <path
        d="M12 20.25s-7.25-4.42-8.67-9.28C2.28 7.38 4.48 4.5 7.56 4.5c1.8 0 3.29 1 4.44 2.42C13.15 5.5 14.64 4.5 16.44 4.5c3.08 0 5.28 2.88 4.23 6.47C19.25 15.83 12 20.25 12 20.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <circle cx="12" cy="8.5" r="3.25" />
      <path
        d="M5.75 19.25a6.25 6.25 0 0 1 12.5 0"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <path
        d="M6.75 8.5h10.5l1 11H5.75l1-11Z"
        strokeLinejoin="round"
      />
      <path d="M9 8.5a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" />
    </svg>
  );
}

function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/tienda") {
    return pathname === "/tienda";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getMegaMenuId(baseId: string, href: string) {
  return `${baseId}-${href.replace(/[^a-z0-9]/gi, "-")}`;
}

function NavIconLink({
  children,
  className = "",
  href,
  label,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  label: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      aria-label={label}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/38 bg-white/18 text-foreground shadow-none backdrop-blur-sm transition-all duration-[220ms] hover:-translate-y-0.5 hover:bg-white/36 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-10 sm:w-10 ${className}`}
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function Navbar({ isAuthenticated }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [openMegaMenuHref, setOpenMegaMenuHref] = useState<string | null>(null);
  const [openMobileSectionHref, setOpenMobileSectionHref] = useState<
    string | null
  >(null);
  const pathname = usePathname();
  const { openMiniCart, totalItems } = useCart();
  const { optimisticWishlistCount } = useExperience();
  const isAdminPath = pathname.startsWith("/admin");
  const accountHref = isAuthenticated ? "/mi-cuenta" : "/ingresar";
  const accountLabel = isAuthenticated
    ? "Ir a mi cuenta"
    : "Ingresar a mi cuenta";
  const menuBaseId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollStateRef = useRef(false);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const navItems = useMemo(() => mainNavigationItems, []);

  useEffect(() => {
    if (isAdminPath) {
      return;
    }

    const updateScrollState = () => {
      const nextHasScrolled = window.scrollY > 18;

      if (scrollStateRef.current !== nextHasScrolled) {
        scrollStateRef.current = nextHasScrolled;
        setHasScrolled(nextHasScrolled);
      }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, [isAdminPath]);

  useEffect(() => {
    const routeCleanupId = window.setTimeout(() => {
      setOpenMegaMenuHref(null);
      setIsMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(routeCleanupId);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMenuOpen(false);
        window.setTimeout(() => menuButtonRef.current?.focus(), 0);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!openMegaMenuHref) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        headerRef.current &&
        event.target instanceof Node &&
        !headerRef.current.contains(event.target)
      ) {
        setOpenMegaMenuHref(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenMegaMenuHref(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMegaMenuHref]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
      }

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (isAdminPath) {
    return null;
  }

  function clearMenuTimers() {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleMegaMenuOpen(href: string) {
    if (!megaMenus[href]) {
      setOpenMegaMenuHref(null);
      return;
    }

    clearMenuTimers();
    openTimerRef.current = window.setTimeout(() => {
      setOpenMegaMenuHref(href);
    }, hoverDelayMs);
  }

  function scheduleMegaMenuClose() {
    clearMenuTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenMegaMenuHref(null);
    }, hoverDelayMs);
  }

  function keepMegaMenuOpen() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header
      className="sticky top-2 z-40 px-3 py-1.5 sm:px-5"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpenMegaMenuHref(null);
        }
      }}
      ref={headerRef}
    >
      <div
        className={`wt-liquid-navbar ${
          ENABLE_NAVBAR_SPARKLES ? "wt-navbar-sparkles" : ""
        } mx-auto w-full max-w-[1460px] rounded-[30px] transition-all duration-[260ms] ease-out motion-reduce:transition-none sm:rounded-full ${
          hasScrolled ? "wt-liquid-navbar-scrolled" : ""
        }`}
      >
        <Container
          className={`relative z-10 flex items-center justify-between gap-2 px-3 transition-all duration-[260ms] ease-out sm:px-4 lg:px-6 motion-reduce:transition-none ${
            hasScrolled ? "min-h-[48px] sm:min-h-[52px]" : "min-h-[52px] sm:min-h-[58px]"
          }`}
        >
          <Link
            aria-label="Ir al inicio"
            className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-[260ms] hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
              hasScrolled
                ? "h-[40px] w-[40px] sm:h-[46px] sm:w-[46px]"
                : "h-[44px] w-[44px] sm:h-[52px] sm:w-[52px]"
            }`}
            href="/"
          >
            <Image
              alt={siteConfig.logo.alt}
              className="h-full w-full scale-[1.13] object-contain"
              height={76}
              priority
              src={siteConfig.logo.src}
              width={76}
            />
          </Link>

          <nav
            aria-label="Navegacion principal"
            className="hidden flex-1 items-center justify-center gap-0.5 px-2 xl:flex 2xl:gap-1"
          >
            {navItems.map((item) => {
              const isActive = isNavigationItemActive(pathname, item.href);
              const megaMenu = megaMenus[item.href];
              const isMegaOpen = openMegaMenuHref === item.href;
              const menuId = getMegaMenuId(menuBaseId, item.href);

              return (
                <div
                  className="relative"
                  key={item.label}
                  onFocus={() => scheduleMegaMenuOpen(item.href)}
                  onMouseEnter={() => scheduleMegaMenuOpen(item.href)}
                  onMouseLeave={scheduleMegaMenuClose}
                >
                  <Link
                    aria-controls={megaMenu ? menuId : undefined}
                    aria-current={isActive ? "page" : undefined}
                    aria-expanded={megaMenu ? isMegaOpen : undefined}
                    aria-haspopup={megaMenu ? "menu" : undefined}
                    className={`group relative inline-flex whitespace-nowrap items-center gap-1 rounded-full px-2.5 py-1.5 text-[0.78rem] font-semibold transition-all duration-[220ms] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 2xl:px-3 2xl:text-sm ${
                      isActive
                        ? "bg-secondary/45 text-primary-hover shadow-none"
                        : "text-muted-foreground hover:bg-white/22 hover:text-primary-hover"
                    }`}
                    href={item.href}
                    onClick={() => setOpenMegaMenuHref(null)}
                  >
                    {item.label}
                    {megaMenu ? (
                      <ChevronIcon
                        className={`h-3.5 w-3.5 transition-transform duration-[220ms] motion-reduce:transition-none ${
                          isMegaOpen ? "rotate-180" : ""
                        }`}
                      />
                    ) : null}
                    <span
                      className={`absolute inset-x-4 bottom-1 h-px origin-center bg-primary transition-transform duration-[220ms] motion-reduce:transition-none ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>

                  {megaMenu ? (
                    <div
                      className={`absolute left-1/2 top-[calc(100%+0.28rem)] w-[min(680px,calc(100vw-4rem))] -translate-x-1/2 transition-all duration-[210ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                        isMegaOpen
                          ? "pointer-events-auto translate-y-0 opacity-100"
                          : "pointer-events-none -translate-y-1.5 opacity-0"
                      }`}
                      id={menuId}
                      onFocus={keepMegaMenuOpen}
                      onMouseEnter={keepMegaMenuOpen}
                      onMouseLeave={scheduleMegaMenuClose}
                      role="menu"
                    >
                      <MegaMenuContent
                        config={megaMenu}
                        onNavigate={() => setOpenMegaMenuHref(null)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <CatalogSearch
              className="h-9 w-9 border border-white/38 bg-white/18 shadow-none hover:-translate-y-0.5 hover:bg-white/36 sm:h-10 sm:w-10"
              onOpen={() => {
                setIsMenuOpen(false);
                setOpenMegaMenuHref(null);
              }}
            />
            <NavIconLink
              className="hidden xl:inline-flex"
              href="/mi-cuenta/favoritos"
              label={`Mis favoritos, ${optimisticWishlistCount} productos`}
            >
              <HeartIcon className="h-5 w-5" />
              {optimisticWishlistCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                  {optimisticWishlistCount}
                </span>
              ) : null}
            </NavIconLink>
            <NavIconLink
              className="hidden xl:inline-flex"
              href={accountHref}
              label={accountLabel}
            >
              <UserIcon className="h-5 w-5" />
              {isAuthenticated ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-success ring-2 ring-background" />
              ) : null}
            </NavIconLink>
            <NavIconLink
              href="/carrito"
              label={`Carrito, ${totalItems} productos`}
              onClick={(event) => {
                if (!ENABLE_MINI_CART) {
                  return;
                }

                event.preventDefault();
                setIsMenuOpen(false);
                setOpenMegaMenuHref(null);
                openMiniCart();
              }}
            >
              <BagIcon className="h-5 w-5" />
              {totalItems > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                  {totalItems}
                </span>
              ) : null}
            </NavIconLink>
            <button
              aria-controls="mobile-navigation"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
              className={buttonStyles({
                className:
                  "h-9 w-9 border border-white/38 bg-white/18 shadow-none sm:h-10 sm:w-10 xl:hidden",
                size: "icon",
                variant: "ghost",
              })}
              onClick={() => setIsMenuOpen((open) => !open)}
              ref={menuButtonRef}
              type="button"
            >
              {isMenuOpen ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </Container>
      </div>

      {isMenuOpen ? (
        <div
          className="fixed inset-0 top-0 z-[80] overflow-y-auto bg-foreground/18 px-3 py-3 backdrop-blur-[2px] xl:hidden"
          id="mobile-navigation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMobileMenu();
            }
          }}
        >
          <section
            aria-label="Menu movil"
            className="wt-liquid-mobile-menu mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[460px] flex-col overflow-hidden rounded-[28px] bg-[rgba(255,253,251,0.96)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/45 px-4 py-3">
              <Link
                className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href="/"
                onClick={closeMobileMenu}
              >
                <Image
                  alt={siteConfig.logo.alt}
                  className="h-10 w-10 object-contain"
                  height={56}
                  src={siteConfig.logo.src}
                  width={56}
                />
                <span className="font-display text-lg font-semibold text-foreground">
                  W.todocell
                </span>
              </Link>
              <button
                aria-label="Cerrar menu"
                className={buttonStyles({
                  className: "h-10 w-10",
                  size: "icon",
                  variant: "ghost",
                })}
                onClick={closeMobileMenu}
                ref={closeButtonRef}
                type="button"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4">
              <div className="flex items-center gap-2">
                <CatalogSearch
                  className="h-10 w-10 border border-white/45 bg-white/36"
                  onOpen={closeMobileMenu}
                />
                <Link
                  className="flex min-h-10 flex-1 items-center rounded-[18px] border border-white/45 bg-white/36 px-3.5 text-sm font-semibold text-muted-foreground transition-colors duration-[220ms] hover:bg-white/54 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/buscar"
                  onClick={closeMobileMenu}
                >
                  Buscar en la tienda
                </Link>
              </div>

              <nav aria-label="Navegacion movil" className="grid gap-2">
                <Link
                  aria-current={pathname === "/" ? "page" : undefined}
                  className={`rounded-[16px] px-3.5 py-2.5 text-sm font-semibold transition-colors duration-[220ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    pathname === "/"
                      ? "bg-secondary/72 text-primary-hover"
                      : "text-foreground hover:bg-white/42 hover:text-primary-hover"
                  }`}
                  href="/"
                  onClick={closeMobileMenu}
                >
                  Inicio
                </Link>

                {navItems
                  .filter((item) => item.href !== "/")
                  .map((item) => {
                    const megaMenu = megaMenus[item.href];
                    const isActive = isNavigationItemActive(pathname, item.href);
                    const isOpen = openMobileSectionHref === item.href;
                    const mobilePanelId = `${getMegaMenuId(
                      menuBaseId,
                      item.href,
                    )}-mobile`;

                    if (!megaMenu) {
                      return (
                        <Link
                          aria-current={isActive ? "page" : undefined}
                        className={`rounded-[16px] px-3.5 py-2.5 text-sm font-semibold transition-colors duration-[220ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isActive
                              ? "bg-secondary/72 text-primary-hover"
                              : "text-foreground hover:bg-white/42 hover:text-primary-hover"
                          }`}
                          href={item.href}
                          key={item.href}
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      );
                    }

                    return (
                      <div
                        className="overflow-hidden rounded-[18px] border border-white/38 bg-white/24"
                        key={item.href}
                      >
                        <button
                          aria-controls={mobilePanelId}
                          aria-expanded={isOpen}
                          className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors duration-[220ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isActive
                              ? "text-primary-hover"
                              : "text-foreground hover:text-primary-hover"
                          }`}
                          onClick={() =>
                            setOpenMobileSectionHref((currentHref) =>
                              currentHref === item.href ? null : item.href,
                            )
                          }
                          type="button"
                        >
                          {item.label}
                          <ChevronIcon
                            className={`h-4 w-4 transition-transform duration-[220ms] motion-reduce:transition-none ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen ? (
                          <div
                            className="grid gap-2 border-t border-white/35 px-3.5 pb-3 pt-2"
                            id={mobilePanelId}
                          >
                            {megaMenu.columns.map((column) => (
                              <div className="grid gap-1" key={column.title}>
                                <p className="px-2 pt-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground/75">
                                  {column.title}
                                </p>
                                {column.links.map((link) => (
                                  <Link
                                    className="rounded-[14px] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-[220ms] hover:bg-white/42 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    href={link.href}
                                    key={`${item.href}-${link.href}-${link.label}`}
                                    onClick={closeMobileMenu}
                                  >
                                    {link.label}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </nav>

              <div className="grid gap-2 border-t border-white/42 pt-3">
                <Link
                  className="rounded-[16px] px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-[220ms] hover:bg-white/42 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={accountHref}
                  onClick={closeMobileMenu}
                >
                  {isAuthenticated ? "Mi cuenta" : "Ingresar"}
                </Link>
                <Link
                  className="rounded-[16px] px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-[220ms] hover:bg-white/42 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/mi-cuenta/favoritos"
                  onClick={closeMobileMenu}
                >
                  Favoritos
                  {optimisticWishlistCount > 0 ? ` (${optimisticWishlistCount})` : ""}
                </Link>
                <Link
                  className="rounded-[16px] px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-[220ms] hover:bg-white/42 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/carrito"
                  onClick={closeMobileMenu}
                >
                  Carrito ({totalItems})
                </Link>
                <a
                  className="rounded-[16px] bg-secondary/72 px-3.5 py-2.5 text-sm font-semibold text-primary-hover transition-colors duration-[220ms] hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={siteConfig.instagram.url}
                  onClick={closeMobileMenu}
                  rel="noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  );
}

function MegaMenuContent({
  config,
  onNavigate,
}: {
  config: MegaMenuConfig;
  onNavigate: () => void;
}) {
  return (
    <div className="wt-liquid-mobile-menu wt-mega-menu grid gap-3 rounded-t-[18px] rounded-b-[26px] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_190px]">
      <div className="grid gap-4 py-1 sm:grid-cols-2">
        {config.columns.map((column) => (
          <div className="space-y-2" key={column.title}>
            <p className="px-1 font-display text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary-hover">
              {column.title}
            </p>
            <div className="grid gap-0.5">
              {column.links.map((link) => (
                <Link
                  className="group rounded-[10px] px-1 py-1.5 transition-all duration-[200ms] hover:translate-x-0.5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-x-0"
                  href={link.href}
                  key={`${column.title}-${link.href}-${link.label}`}
                  onClick={onNavigate}
                  role="menuitem"
                >
                  <span className="flex items-center justify-between gap-3 text-[0.84rem] font-semibold text-foreground transition-colors duration-[200ms] group-hover:text-primary-hover">
                    {link.label}
                    <ArrowIcon className="h-3 w-3 opacity-0 transition-opacity duration-[200ms] group-hover:opacity-100" />
                  </span>
                  {link.description ? (
                    <span className="mt-0.5 hidden text-[0.68rem] leading-4 text-muted-foreground/72 2xl:block">
                      {link.description}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link
        className="group relative hidden min-h-[156px] overflow-hidden rounded-[18px] bg-white/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:block"
        href={config.editorial.href}
        onClick={onNavigate}
        role="menuitem"
      >
        <Image
          alt={config.editorial.imageAlt}
          className="object-cover object-center opacity-[0.92] transition-transform duration-[300ms] group-hover:scale-[1.015] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          fill
          quality={95}
          sizes="190px"
          src={config.editorial.imageSrc}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,248,0.1)_0%,rgba(255,250,248,0.42)_54%,rgba(255,250,248,0.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4 pt-8 text-foreground">
          <p className="inline-flex rounded-full bg-white/52 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-primary-hover backdrop-blur-sm">
            {config.accent}
          </p>
          <h2 className="font-display text-[1.05rem] font-semibold leading-tight">
            {config.editorial.title}
          </h2>
          <span className="inline-flex items-center gap-1.5 pt-0.5 text-xs font-bold text-primary-hover">
            {config.editorial.label}
            <ArrowIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </div>
  );
}
