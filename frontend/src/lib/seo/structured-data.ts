import { siteConfig } from "@/config/site";
import { buildPublicUrl, getPublicSiteUrl } from "@/lib/site-url";
import type { PublicProduct } from "@/lib/catalog/types";

type JsonLdValue =
  | Array<JsonLdValue>
  | boolean
  | null
  | number
  | string
  | { [key: string]: JsonLdValue | undefined };

function removeUndefinedValues<TValue extends Record<string, JsonLdValue | undefined>>(
  value: TValue,
) {
  return Object.fromEntries(
    Object.entries(value).filter((entry) => entry[1] !== undefined),
  );
}

export function createJsonLdScript(data: JsonLdValue) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function createOrganizationJsonLd() {
  return removeUndefinedValues({
    "@context": "https://schema.org",
    "@type": "Organization",
    logo: buildPublicUrl(siteConfig.logo.src),
    name: siteConfig.name,
    url: getPublicSiteUrl(),
  });
}

export function createWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    potentialAction: {
      "@type": "SearchAction",
      "query-input": "required name=search_term_string",
      target: `${buildPublicUrl("/buscar")}?q={search_term_string}`,
    },
    url: getPublicSiteUrl(),
  };
}

export function createBreadcrumbJsonLd(
  items: Array<{
    name: string;
    path: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: buildPublicUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}

export function createProductJsonLd(product: PublicProduct) {
  const isAvailable =
    product.availabilityType === "made_to_order" || product.stock > 0;
  const brand = product.brand ?? product.model;

  return removeUndefinedValues({
    "@context": "https://schema.org",
    "@type": "Product",
    brand: brand
      ? {
          "@type": "Brand",
          name: brand,
        }
      : undefined,
    description: product.description || product.shortDescription,
    image:
      product.images.length > 0
        ? product.images.map((image) => image.url).filter(Boolean)
        : undefined,
    name: product.name,
    offers: {
      "@type": "Offer",
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      price: product.price,
      priceCurrency: "ARS",
      url: buildPublicUrl(`/producto/${product.slug}`),
    },
    url: buildPublicUrl(`/producto/${product.slug}`),
  });
}
