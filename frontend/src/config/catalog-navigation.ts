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

export const plannedNavigationCategories: Array<NavigationCategory> = [];

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
  return categories.map((category) => ({
    description: category.description,
    name: category.name,
    slug: category.slug,
  }));
}
