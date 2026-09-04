const publicCatalogCategorySlugs = [
  "fundas",
  "accesorios",
  "combos",
  "pop-socket",
  "celulares",
  "consolas",
] as const;

const publicCatalogCategorySlugSet = new Set<string>(
  publicCatalogCategorySlugs,
);

export function normalizeCatalogCategorySlug(value: string) {
  const [pathWithoutQuery] = value.trim().split(/[?#]/, 1);
  const normalizedPath = pathWithoutQuery
    .replace(/^\/+/, "")
    .replace(/^tienda\/+/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  return normalizedPath;
}

export function getCatalogCategoryHref(categorySlug?: string | null) {
  if (!categorySlug) {
    return "/tienda";
  }

  const normalizedSlug = normalizeCatalogCategorySlug(categorySlug);

  return normalizedSlug ? `/tienda/${normalizedSlug}` : "/tienda";
}

export function normalizePublicCatalogHref(value: string) {
  const href = value.trim();

  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  const match = href.match(
    /^\/+(?:(?:tienda)\/+)?([^/?#]+)(.*)$/i,
  );

  if (!match) {
    return href;
  }

  const [, rawSlug, suffix = ""] = match;
  const normalizedSlug = normalizeCatalogCategorySlug(rawSlug);

  if (!publicCatalogCategorySlugSet.has(normalizedSlug)) {
    return href;
  }

  return `${getCatalogCategoryHref(normalizedSlug)}${suffix}`;
}
