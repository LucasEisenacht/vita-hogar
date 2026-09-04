import type { PublicCategory } from "@/lib/catalog/types";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";

export type NavigationCategory = {
  description: string;
  name: string;
  slug: string;
};

export type MainNavigationItem = {
  href: string;
  label: string;
};

export const plannedNavigationCategories: Array<NavigationCategory> = [
  {
    description: "Fundas seleccionadas para proteger y acompanar tu estilo.",
    name: "Fundas",
    slug: "fundas",
  },
  {
    description: "Accesorios de tecnologia para uso cotidiano.",
    name: "Accesorios",
    slug: "accesorios",
  },
  {
    description: "Combos preparados como productos comunes del catalogo.",
    name: "Combos",
    slug: "combos",
  },
  {
    description: "Pop sockets y grips para sostener el celular con estilo.",
    name: "Pop Socket",
    slug: "pop-socket",
  },
  {
    description: "Celulares nuevos, usados y reacondicionados seleccionados.",
    name: "Celulares",
    slug: "celulares",
  },
  {
    description: "Consolas y tecnologia para entretenimiento.",
    name: "Consolas",
    slug: "consolas",
  },
];

export const mainNavigationItems: Array<MainNavigationItem> = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/tienda" },
  ...plannedNavigationCategories.map((category) => ({
    href: getCatalogCategoryHref(category.slug),
    label: category.name,
  })),
];

export function getPlannedNavigationCategoryBySlug(slug: string) {
  return (
    plannedNavigationCategories.find((category) => category.slug === slug) ??
    null
  );
}

export function getNavigationCategories(
  categories: Array<PublicCategory>,
): Array<NavigationCategory> {
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const plannedCategories = plannedNavigationCategories.map((category) => {
    const realCategory = categoriesBySlug.get(category.slug);

    return realCategory
      ? {
          description: realCategory.description || category.description,
          name: realCategory.name,
          slug: realCategory.slug,
        }
      : category;
  });
  const plannedSlugs = new Set(
    plannedNavigationCategories.map((category) => category.slug),
  );
  const additionalCategories = categories
    .filter((category) => !plannedSlugs.has(category.slug))
    .map((category) => ({
      description: category.description,
      name: category.name,
      slug: category.slug,
    }));

  return [...plannedCategories, ...additionalCategories];
}
