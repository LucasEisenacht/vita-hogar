const MAX_SEARCH_QUERY_LENGTH = 100;

export function sanitizeCatalogSearchQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
}

export function isSearchableCatalogQuery(value: string) {
  return sanitizeCatalogSearchQuery(value).length >= 2;
}

export function getCatalogSearchUrl(query: string) {
  const sanitizedQuery = sanitizeCatalogSearchQuery(query);

  return sanitizedQuery
    ? `/buscar?q=${encodeURIComponent(sanitizedQuery)}`
    : "/buscar";
}
