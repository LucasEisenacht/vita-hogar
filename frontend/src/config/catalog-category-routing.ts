import { normalizeProductColorName } from "@/lib/catalog/product-colors";
import { normalizeCatalogCategorySlug } from "@/lib/catalog/routes";

const categoryRouteAliases: Record<string, Array<string>> = {
  consolas: ["consolas", "gaming"],
};

export function getCatalogCategoryRouteSlugs(categorySlug: string) {
  const normalizedSlug = normalizeProductColorName(
    normalizeCatalogCategorySlug(categorySlug),
  );
  const aliases = categoryRouteAliases[normalizedSlug] ?? [categorySlug];

  return Array.from(
    new Set(
      aliases.map((slug) => normalizeProductColorName(slug)).filter(Boolean),
    ),
  );
}
