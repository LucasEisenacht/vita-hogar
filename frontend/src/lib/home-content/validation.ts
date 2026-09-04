import type { ProductSort } from "@/lib/catalog/types";
import type {
  HomeContentBenefit,
  HomeContentBenefitIcon,
  HomeContentConfig,
  HomeContentFeaturedCategory,
} from "@/lib/home-content/types";
import {
  normalizeCatalogCategorySlug,
  normalizePublicCatalogHref,
} from "@/lib/catalog/routes";

export type HomeContentValidationResult =
  | {
      config: HomeContentConfig;
      fieldErrors: Record<string, string>;
      ok: true;
    }
  | {
      fieldErrors: Record<string, string>;
      ok: false;
    };

const benefitIcons: Array<HomeContentBenefitIcon> = [
  "care",
  "heart",
  "send",
  "shield",
  "sparkle",
];
const productSorts: Array<ProductSort> = [
  "featured",
  "name",
  "newest",
  "price-asc",
  "price-desc",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function readOrder(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, 0), 999);
}

function readLimit(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return 6;
  }

  return Math.min(Math.max(value, 1), 24);
}

function readSort(value: unknown) {
  return productSorts.includes(value as ProductSort)
    ? (value as ProductSort)
    : "featured";
}

function readBenefitIcon(value: unknown) {
  return benefitIcons.includes(value as HomeContentBenefitIcon)
    ? (value as HomeContentBenefitIcon)
    : "sparkle";
}

function isSafePathOrUrl(value: string) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function requireText(
  fieldErrors: Record<string, string>,
  field: string,
  value: string,
  label: string,
) {
  if (!value) {
    fieldErrors[field] = `${label} es obligatorio.`;
  }
}

function validatePathOrUrl(
  fieldErrors: Record<string, string>,
  field: string,
  value: string,
  label: string,
) {
  if (!isSafePathOrUrl(value)) {
    fieldErrors[field] =
      `${label} debe ser una ruta interna o una URL http/https valida.`;
  }
}

function normalizeBenefit(
  value: unknown,
  index: number,
  fieldErrors: Record<string, string>,
): HomeContentBenefit | null {
  if (!isRecord(value)) {
    fieldErrors[`benefits.${index}`] = "El beneficio no tiene formato valido.";

    return null;
  }

  const benefit = {
    description: cleanString(value.description, 220),
    icon: readBenefitIcon(value.icon),
    isActive: readBoolean(value.isActive),
    order: readOrder(value.order, index + 1),
    title: cleanString(value.title, 80),
  };

  requireText(fieldErrors, `benefits.${index}.title`, benefit.title, "Titulo");
  requireText(
    fieldErrors,
    `benefits.${index}.description`,
    benefit.description,
    "Descripcion",
  );

  return benefit;
}

function normalizeCategory(
  value: unknown,
  index: number,
  fieldErrors: Record<string, string>,
): HomeContentFeaturedCategory | null {
  if (!isRecord(value)) {
    fieldErrors[`featuredCategories.${index}`] =
      "La categoria no tiene formato valido.";

    return null;
  }

  const category = {
    description: cleanString(value.description, 220),
    isActive: readBoolean(value.isActive),
    name: cleanString(value.name, 80),
    order: readOrder(value.order, index + 1),
    slug: normalizeCatalogCategorySlug(cleanString(value.slug, 80)),
  };

  requireText(
    fieldErrors,
    `featuredCategories.${index}.slug`,
    category.slug,
    "Slug",
  );
  requireText(
    fieldErrors,
    `featuredCategories.${index}.name`,
    category.name,
    "Nombre",
  );

  return category;
}

export function validateHomeContentConfig(
  value: unknown,
): HomeContentValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (!isRecord(value)) {
    return {
      fieldErrors: {
        content: "La configuracion del inicio no tiene formato valido.",
      },
      ok: false,
    };
  }

  const heroSource = isRecord(value.hero) ? value.hero : {};
  const featuredProductsSource = isRecord(value.featuredProducts)
    ? value.featuredProducts
    : {};
  const featuredCategoriesSource = isRecord(value.featuredCategories)
    ? value.featuredCategories
    : {};
  const benefitsSource = isRecord(value.benefits) ? value.benefits : {};
  const instagramSource = isRecord(value.instagram) ? value.instagram : {};
  const featuredCategoryItems = Array.isArray(featuredCategoriesSource.items)
    ? featuredCategoriesSource.items
    : [];
  const benefitItems = Array.isArray(benefitsSource.items)
    ? benefitsSource.items
    : [];
  const config: HomeContentConfig = {
    benefits: {
      items: benefitItems
        .slice(0, 12)
        .map((item, index) => normalizeBenefit(item, index, fieldErrors))
        .filter((item): item is HomeContentBenefit => item !== null),
      title: cleanString(benefitsSource.title, 120),
    },
    featuredCategories: {
      items: featuredCategoryItems
        .slice(0, 12)
        .map((item, index) => normalizeCategory(item, index, fieldErrors))
        .filter((item): item is HomeContentFeaturedCategory => item !== null),
      subtitle: cleanString(featuredCategoriesSource.subtitle, 220),
      title: cleanString(featuredCategoriesSource.title, 120),
    },
    featuredProducts: {
      ctaHref: normalizePublicCatalogHref(
        cleanString(featuredProductsSource.ctaHref, 220),
      ),
      ctaLabel: cleanString(featuredProductsSource.ctaLabel, 80),
      isActive: readBoolean(featuredProductsSource.isActive),
      limit: readLimit(featuredProductsSource.limit),
      sort: readSort(featuredProductsSource.sort),
      subtitle: cleanString(featuredProductsSource.subtitle, 220),
      title: cleanString(featuredProductsSource.title, 120),
    },
    hero: {
      badge: cleanString(heroSource.badge, 60),
      desktopImageUrl: cleanString(heroSource.desktopImageUrl, 500),
      isActive: readBoolean(heroSource.isActive),
      mobileImageUrl: cleanString(heroSource.mobileImageUrl, 500),
      primaryCtaHref: normalizePublicCatalogHref(
        cleanString(heroSource.primaryCtaHref, 220),
      ),
      primaryCtaLabel: cleanString(heroSource.primaryCtaLabel, 80),
      secondaryCtaHref: normalizePublicCatalogHref(
        cleanString(heroSource.secondaryCtaHref, 220),
      ),
      secondaryCtaLabel: cleanString(heroSource.secondaryCtaLabel, 80),
      subtitle: cleanString(heroSource.subtitle, 260),
      title: cleanString(heroSource.title, 140),
    },
    instagram: {
      buttonHref: cleanString(instagramSource.buttonHref, 220),
      buttonLabel: cleanString(instagramSource.buttonLabel, 80),
      isActive: readBoolean(instagramSource.isActive),
      text: cleanString(instagramSource.text, 260),
      title: cleanString(instagramSource.title, 120),
      username: cleanString(instagramSource.username, 80),
    },
  };

  requireText(fieldErrors, "hero.title", config.hero.title, "Titulo");
  requireText(fieldErrors, "hero.subtitle", config.hero.subtitle, "Subtitulo");
  requireText(
    fieldErrors,
    "hero.primaryCtaLabel",
    config.hero.primaryCtaLabel,
    "Texto del boton principal",
  );
  requireText(
    fieldErrors,
    "hero.primaryCtaHref",
    config.hero.primaryCtaHref,
    "Destino del boton principal",
  );
  validatePathOrUrl(
    fieldErrors,
    "hero.primaryCtaHref",
    config.hero.primaryCtaHref,
    "Destino del boton principal",
  );
  validatePathOrUrl(
    fieldErrors,
    "hero.secondaryCtaHref",
    config.hero.secondaryCtaHref,
    "Destino del boton secundario",
  );
  validatePathOrUrl(
    fieldErrors,
    "hero.desktopImageUrl",
    config.hero.desktopImageUrl,
    "Imagen desktop",
  );
  validatePathOrUrl(
    fieldErrors,
    "hero.mobileImageUrl",
    config.hero.mobileImageUrl,
    "Imagen mobile",
  );
  requireText(
    fieldErrors,
    "featuredProducts.title",
    config.featuredProducts.title,
    "Titulo de productos destacados",
  );
  validatePathOrUrl(
    fieldErrors,
    "featuredProducts.ctaHref",
    config.featuredProducts.ctaHref,
    "Destino del boton de destacados",
  );
  requireText(
    fieldErrors,
    "featuredCategories.title",
    config.featuredCategories.title,
    "Titulo de categorias",
  );
  requireText(
    fieldErrors,
    "benefits.title",
    config.benefits.title,
    "Titulo de beneficios",
  );
  requireText(
    fieldErrors,
    "instagram.title",
    config.instagram.title,
    "Titulo de Instagram",
  );
  requireText(
    fieldErrors,
    "instagram.buttonHref",
    config.instagram.buttonHref,
    "Destino del boton de Instagram",
  );
  validatePathOrUrl(
    fieldErrors,
    "instagram.buttonHref",
    config.instagram.buttonHref,
    "Destino del boton de Instagram",
  );

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      ok: false,
    };
  }

  return {
    config,
    fieldErrors,
    ok: true,
  };
}
