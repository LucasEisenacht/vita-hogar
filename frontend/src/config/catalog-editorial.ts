import { getPlannedNavigationCategoryBySlug } from "@/config/catalog-navigation";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";

export type CatalogEditorialAccent = "blush" | "champagne" | "cream" | "lavender" | "rose";
export type CatalogEditorialChip = { href: string; label: string };
export type CatalogEditorialExperience = {
  accent: CatalogEditorialAccent;
  backgroundClassName: string;
  breadcrumbLabel: string;
  chips: Array<CatalogEditorialChip>;
  description: string;
  editorialBlock?: { ctaHref: string; ctaLabel: string; description: string; image?: { alt: string; src: string }; title: string };
  eyebrow: string;
  featuredLink?: CatalogEditorialChip;
  image?: { alt: string; src: string };
  key: string;
  title: string;
};

const vitaTiendaExperience: CatalogEditorialExperience = {
  accent: "champagne",
  backgroundClassName: "bg-transparent",
  breadcrumbLabel: "Tienda",
  chips: [
    { href: "/tienda", label: "Todo" },
    { href: "/tienda?orden=newest", label: "Novedades" },
    { href: "/tienda?orden=featured", label: "Destacados" },
    { href: "/tienda?disponibilidad=in_stock", label: "En stock" },
    { href: "/tienda", label: "Textiles" },
    { href: "/tienda", label: "Dormitorio" },
    { href: "/tienda", label: "Baño" },
    { href: "/tienda", label: "Living" },
    { href: "/tienda", label: "Deco" },
  ],
  description: "Una selección cálida de piezas para dormitorio, living, baño y rincones cotidianos.",
  eyebrow: "Colección VITA HOGAR",
  featuredLink: { href: "/tienda?orden=featured", label: "Explorar ambientes" },
  key: "tienda",
  title: "Objetos y textiles para habitar mejor.",
};

export const catalogEditorialExperiences: Record<string, CatalogEditorialExperience> = {
  tienda: vitaTiendaExperience,
};

export function getCatalogEditorialExperience(slug?: string | null) {
  return !slug ? vitaTiendaExperience : createFallbackCatalogExperience(slug);
}

function createFallbackCatalogExperience(slug: string): CatalogEditorialExperience {
  const plannedCategory = getPlannedNavigationCategoryBySlug(slug);
  const label = plannedCategory?.name ?? slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

  return {
    accent: "champagne",
    backgroundClassName: "bg-transparent",
    breadcrumbLabel: label,
    chips: [{ href: getCatalogCategoryHref(slug), label: "Todo" }],
    description: "Selección de objetos y textiles para acompañar la vida cotidiana.",
    eyebrow: "VITA HOGAR",
    featuredLink: { href: "/tienda", label: "Volver a tienda" },
    key: slug,
    title: label,
  };
}