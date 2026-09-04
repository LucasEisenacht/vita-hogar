import { getPlannedNavigationCategoryBySlug } from "@/config/catalog-navigation";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";

export type CatalogEditorialAccent =
  | "blush"
  | "champagne"
  | "cream"
  | "lavender"
  | "rose";

export type CatalogEditorialChip = {
  href: string;
  label: string;
};

export type CatalogEditorialExperience = {
  accent: CatalogEditorialAccent;
  backgroundClassName: string;
  breadcrumbLabel: string;
  chips: Array<CatalogEditorialChip>;
  description: string;
  editorialBlock?: {
    ctaHref: string;
    ctaLabel: string;
    description: string;
    image?: {
      alt: string;
      src: string;
    };
    title: string;
  };
  eyebrow: string;
  featuredLink?: CatalogEditorialChip;
  image?: {
    alt: string;
    src: string;
  };
  key: string;
  title: string;
};

const categoryFallbackDescription =
  "Productos seleccionados con una mirada suave, moderna y personal.";

export const catalogEditorialExperiences: Record<
  string,
  CatalogEditorialExperience
> = {
  tienda: {
    accent: "rose",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,253,251,0.92)_0%,rgba(253,238,243,0.88)_52%,rgba(245,225,232,0.72)_100%)]",
    breadcrumbLabel: "Tienda",
    chips: [
      { href: "/tienda", label: "Todo" },
      { href: "/tienda?orden=newest", label: "Novedades" },
      { href: "/tienda?orden=featured", label: "Destacados" },
      { href: "/tienda?disponibilidad=in_stock", label: "En stock" },
      { href: "/tienda/fundas", label: "Fundas" },
      { href: "/tienda/accesorios", label: "Accesorios" },
      { href: "/tienda/celulares", label: "Celulares" },
      { href: "/tienda/consolas", label: "Consolas" },
    ],
    description:
      "Accesorios, celulares y tecnologia elegidos para que comprar se sienta simple, lindo y personal.",
    editorialBlock: {
      ctaHref: "/tienda/fundas",
      ctaLabel: "Ver fundas",
      description:
        "Descubri los favoritos de W.todocell en una seleccion suave, practica y lista para combinar.",
      image: {
        alt: "Detalle lifestyle de accesorios W.todocell.",
        src: "/images/lifestyle/lifestyle-01.webp",
      },
      title: "Elegidos para vos",
    },
    eyebrow: "Catalogo W.todocell",
    featuredLink: { href: "/tienda?orden=newest", label: "Ver novedades" },
    image: {
      alt: "Seleccion lifestyle de accesorios W.todocell.",
      src: "/images/lifestyle/lifestyle-01.webp",
    },
    key: "tienda",
    title: "Tecnologia para todos los dias.",
  },
  fundas: {
    accent: "blush",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,246,249,0.94)_0%,rgba(253,238,243,0.9)_58%,rgba(255,253,251,0.82)_100%)]",
    breadcrumbLabel: "Fundas",
    chips: [
      { href: "/tienda/fundas", label: "Todas" },
      { href: "/buscar?q=iPhone", label: "iPhone" },
      { href: "/buscar?q=Samsung", label: "Samsung" },
      { href: "/buscar?q=Motorola", label: "Motorola" },
      { href: "/buscar?q=MagSafe", label: "MagSafe" },
      { href: "/buscar?q=glitter", label: "Glitter" },
      { href: "/buscar?q=transparente", label: "Transparentes" },
    ],
    description:
      "Modelos seleccionados para cuidar tu celular y acompanar tu estilo sin esfuerzo.",
    editorialBlock: {
      ctaHref: "/buscar?q=iPhone",
      ctaLabel: "Ver destacados",
      description:
        "Descubri fundas elegidas por su terminacion, color y sensacion premium.",
      image: {
        alt: "Fundas W.todocell en una composicion editorial.",
        src: "/images/categories/fundas.webp",
      },
      title: "Descubri los favoritos de W.todocell",
    },
    eyebrow: "Fundas",
    featuredLink: { href: "/tienda/fundas?disponibilidad=in_stock", label: "Ver disponibles" },
    image: {
      alt: "Fundas W.todocell en una escena rosa pastel.",
      src: "/images/categories/fundas.webp",
    },
    key: "fundas",
    title: "Fundas que protegen sin perder estilo.",
  },
  accesorios: {
    accent: "cream",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,253,251,0.94)_0%,rgba(250,241,228,0.82)_50%,rgba(253,238,243,0.58)_100%)]",
    breadcrumbLabel: "Accesorios",
    chips: [
      { href: "/tienda/accesorios", label: "Todos" },
      { href: "/buscar?q=cargador", label: "Cargadores" },
      { href: "/buscar?q=cable", label: "Cables" },
      { href: "/buscar?q=auricular", label: "Auriculares" },
      { href: "/buscar?q=soporte", label: "Soportes" },
      { href: "/buscar?q=protector", label: "Protectores" },
    ],
    description:
      "Esenciales lindos, utiles y faciles de sumar a tu rutina diaria.",
    editorialBlock: {
      ctaHref: "/tienda/accesorios?disponibilidad=in_stock",
      ctaLabel: "Ver destacados",
      description:
        "Pequenos objetos que ordenan, conectan y hacen mas linda la tecnologia cotidiana.",
      image: {
        alt: "Accesorios W.todocell en una escena lifestyle.",
        src: "/images/lifestyle/lifestyle-02.webp",
      },
      title: "Descubri los favoritos de W.todocell",
    },
    eyebrow: "Accesorios",
    featuredLink: { href: "/tienda/accesorios?orden=featured", label: "Ver destacados" },
    image: {
      alt: "Tecnologia y accesorios premium para uso cotidiano.",
      src: "/images/lifestyle/lifestyle-02.webp",
    },
    key: "accesorios",
    title: "Tecnologia para todos los dias.",
  },
  celulares: {
    accent: "champagne",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,253,251,0.96)_0%,rgba(246,232,207,0.72)_54%,rgba(253,238,243,0.48)_100%)]",
    breadcrumbLabel: "Celulares",
    chips: [
      { href: "/tienda/celulares", label: "Todos" },
      { href: "/tienda/celulares?condicion=new", label: "Nuevos" },
      { href: "/tienda/celulares?condicion=used", label: "Usados" },
      { href: "/tienda/celulares?condicion=refurbished", label: "Reacondicionados" },
      { href: "/buscar?q=Apple", label: "Apple" },
      { href: "/buscar?q=Samsung", label: "Samsung" },
      { href: "/buscar?q=Motorola", label: "Motorola" },
    ],
    description:
      "Equipos seleccionados con una mirada clara para elegir mejor y comprar con calma.",
    editorialBlock: {
      ctaHref: "/tienda/celulares?condicion=refurbished",
      ctaLabel: "Ver destacados",
      description:
        "Opciones para renovar tu equipo con una experiencia simple, cuidada y confiable.",
      image: {
        alt: "Celulares W.todocell con estetica editorial.",
        src: "/images/hero/hero-celulares.webp",
      },
      title: "Descubri los favoritos de W.todocell",
    },
    eyebrow: "Celulares",
    featuredLink: { href: "/tienda/celulares?condicion=new", label: "Ver nuevos" },
    image: {
      alt: "Celulares y tecnologia en una composicion clara.",
      src: "/images/categories/celulares.webp",
    },
    key: "celulares",
    title: "Tu escritorio, mas lindo.",
  },
  consolas: {
    accent: "lavender",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,253,251,0.92)_0%,rgba(232,223,249,0.78)_48%,rgba(253,238,243,0.54)_100%)]",
    breadcrumbLabel: "Consolas",
    chips: [
      { href: "/tienda/consolas", label: "Todas" },
      { href: "/buscar?q=gaming", label: "Gaming" },
      { href: "/buscar?q=PlayStation", label: "PlayStation" },
      { href: "/buscar?q=Nintendo", label: "Nintendo" },
      { href: "/buscar?q=joystick", label: "Joysticks" },
      { href: "/buscar?q=auricular gaming", label: "Auriculares" },
    ],
    description:
      "Consolas y accesorios para llevar tu experiencia al siguiente nivel, sin perder estilo.",
    editorialBlock: {
      ctaHref: "/buscar?q=gaming",
      ctaLabel: "Ver destacados",
      description:
        "Una seleccion para jugar mejor con una estetica mas limpia, moderna y personal.",
      image: {
        alt: "Consola y accesorios gaming W.todocell.",
        src: "/images/hero/hero-gaming.webp",
      },
      title: "Descubri los favoritos de W.todocell",
    },
    eyebrow: "Consolas y gaming",
    featuredLink: { href: "/tienda/consolas?orden=newest", label: "Ver novedades" },
    image: {
      alt: "Productos gaming y consola en una composicion premium.",
      src: "/images/hero/hero-gaming.webp",
    },
    key: "consolas",
    title: "Gaming con diseno.",
  },
  combos: {
    accent: "rose",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,248,250,0.94)_0%,rgba(245,225,232,0.82)_52%,rgba(255,253,251,0.86)_100%)]",
    breadcrumbLabel: "Combos",
    chips: [
      { href: "/tienda/combos", label: "Todos" },
      { href: "/tienda/combos?orden=newest", label: "Nuevos" },
      { href: "/tienda/combos?orden=featured", label: "Destacados" },
      { href: "/buscar?q=pack", label: "Packs" },
      { href: "/buscar?q=regalo", label: "Regalos" },
      { href: "/buscar?q=combo", label: "Combos" },
    ],
    description:
      "Packs pensados para regalar, resolver rapido y mantener una experiencia cuidada.",
    editorialBlock: {
      ctaHref: "/buscar?q=regalo",
      ctaLabel: "Ver destacados",
      description:
        "Selecciones listas para sorprender, combinar y comprar con menos vueltas.",
      image: {
        alt: "Packaging W.todocell con seleccion de combos.",
        src: "/images/hero/hero-combos.webp",
      },
      title: "Descubri los favoritos de W.todocell",
    },
    eyebrow: "Combos",
    featuredLink: { href: "/tienda/combos?disponibilidad=in_stock", label: "Listos para comprar" },
    image: {
      alt: "Packaging cuidado de W.todocell para una experiencia especial.",
      src: "/images/hero/hero-combos.webp",
    },
    key: "combos",
    title: "Todo lo que necesitas, en un solo combo.",
  },
  "pop-socket": {
    accent: "blush",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(253,238,243,0.94)_0%,rgba(255,253,251,0.86)_54%,rgba(245,225,232,0.7)_100%)]",
    breadcrumbLabel: "Pop Socket",
    chips: [
      { href: "/tienda/pop-socket", label: "Todos" },
      { href: "/buscar?q=pop socket", label: "Pop Socket" },
      { href: "/buscar?q=grip", label: "Grips" },
      { href: "/tienda/pop-socket?orden=newest", label: "Nuevos" },
      { href: "/tienda/pop-socket?disponibilidad=in_stock", label: "En stock" },
    ],
    description:
      "Grips compactos para sumar comodidad, color y un detalle personal al celular.",
    editorialBlock: {
      ctaHref: "/buscar?q=grip",
      ctaLabel: "Ver destacados",
      description:
        "Detalles chicos, comodos y lindos para que el celular se sienta mas tuyo.",
      image: {
        alt: "Pop Socket W.todocell en una escena editorial.",
        src: "/images/categories/pop-socket.webp",
      },
      title: "Descubri los favoritos de W.todocell",
    },
    eyebrow: "Pop Socket",
    featuredLink: { href: "/tienda/pop-socket?orden=newest", label: "Ver nuevos" },
    image: {
      alt: "Accesorios W.todocell en una escena lifestyle rosa pastel.",
      src: "/images/categories/pop-socket.webp",
    },
    key: "pop-socket",
    title: "Tu celular, mas comodo y mas tuyo.",
  },
};

export function getCatalogEditorialExperience(slug?: string | null) {
  if (!slug) {
    return catalogEditorialExperiences.tienda;
  }

  return (
    catalogEditorialExperiences[slug] ??
    createFallbackCatalogExperience(slug)
  );
}

function createFallbackCatalogExperience(slug: string): CatalogEditorialExperience {
  const plannedCategory = getPlannedNavigationCategoryBySlug(slug);
  const label =
    plannedCategory?.name ??
    slug
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  return {
    accent: "rose",
    backgroundClassName:
      "bg-[linear-gradient(135deg,rgba(255,253,251,0.94)_0%,rgba(253,238,243,0.82)_100%)]",
    breadcrumbLabel: label,
    chips: [
      { href: getCatalogCategoryHref(slug), label: "Todo" },
      { href: `${getCatalogCategoryHref(slug)}?orden=newest`, label: "Novedades" },
      { href: `${getCatalogCategoryHref(slug)}?orden=featured`, label: "Destacados" },
    ],
    description: plannedCategory?.description || categoryFallbackDescription,
    eyebrow: "Categoria",
    featuredLink: { href: `${getCatalogCategoryHref(slug)}?orden=newest`, label: "Ver novedades" },
    key: slug,
    title: label,
  };
}
