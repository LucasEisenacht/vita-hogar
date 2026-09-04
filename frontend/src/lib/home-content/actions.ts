"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getHomeContentConfig,
  saveHomeContentConfig,
} from "@/lib/home-content/config";
import type {
  HomeContentBenefitIcon,
  HomeContentConfig,
} from "@/lib/home-content/types";
import type { ProductSort } from "@/lib/catalog/types";

export type HomeContentFormState = {
  fieldErrors: Record<string, string>;
  message: string;
  status: "error" | "idle" | "success";
};

const productSorts: Array<ProductSort> = [
  "featured",
  "name",
  "newest",
  "price-asc",
  "price-desc",
];

const benefitIcons: Array<HomeContentBenefitIcon> = [
  "care",
  "heart",
  "send",
  "shield",
  "sparkle",
];

function getString(formData: FormData, name: string, fallback = "") {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : fallback;
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getPositiveInteger(
  formData: FormData,
  name: string,
  fallback: number,
) {
  const value = Number.parseInt(getString(formData, name), 10);

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return value;
}

function getOrder(formData: FormData, name: string, fallback: number) {
  const value = Number.parseInt(getString(formData, name), 10);

  return Number.isFinite(value) ? value : fallback;
}

function getSort(formData: FormData, name: string, fallback: ProductSort) {
  const value = getString(formData, name);

  return productSorts.includes(value as ProductSort)
    ? (value as ProductSort)
    : fallback;
}

function getBenefitIcon(
  formData: FormData,
  name: string,
  fallback: HomeContentBenefitIcon,
) {
  const value = getString(formData, name);

  return benefitIcons.includes(value as HomeContentBenefitIcon)
    ? (value as HomeContentBenefitIcon)
    : fallback;
}

export async function updateHomeContentConfig(
  _previousState: HomeContentFormState,
  formData: FormData,
): Promise<HomeContentFormState> {
  await requireAdmin();

  const currentConfig = await getHomeContentConfig();
  const expectedUpdatedAt = getString(formData, "contentUpdatedAt") || null;
  const nextConfig: HomeContentConfig = {
    hero: {
      badge: getString(formData, "hero.badge", currentConfig.hero.badge),
      desktopImageUrl: getString(
        formData,
        "hero.desktopImageUrl",
        currentConfig.hero.desktopImageUrl,
      ),
      isActive: getBoolean(formData, "hero.isActive"),
      mobileImageUrl: getString(
        formData,
        "hero.mobileImageUrl",
        currentConfig.hero.mobileImageUrl,
      ),
      primaryCtaHref: getString(
        formData,
        "hero.primaryCtaHref",
        currentConfig.hero.primaryCtaHref,
      ),
      primaryCtaLabel: getString(
        formData,
        "hero.primaryCtaLabel",
        currentConfig.hero.primaryCtaLabel,
      ),
      secondaryCtaHref: getString(
        formData,
        "hero.secondaryCtaHref",
        currentConfig.hero.secondaryCtaHref,
      ),
      secondaryCtaLabel: getString(
        formData,
        "hero.secondaryCtaLabel",
        currentConfig.hero.secondaryCtaLabel,
      ),
      subtitle: getString(formData, "hero.subtitle", currentConfig.hero.subtitle),
      title: getString(formData, "hero.title", currentConfig.hero.title),
    },
    featuredProducts: {
      ctaHref: getString(
        formData,
        "featuredProducts.ctaHref",
        currentConfig.featuredProducts.ctaHref,
      ),
      ctaLabel: getString(
        formData,
        "featuredProducts.ctaLabel",
        currentConfig.featuredProducts.ctaLabel,
      ),
      isActive: getBoolean(formData, "featuredProducts.isActive"),
      limit: getPositiveInteger(
        formData,
        "featuredProducts.limit",
        currentConfig.featuredProducts.limit,
      ),
      sort: getSort(
        formData,
        "featuredProducts.sort",
        currentConfig.featuredProducts.sort,
      ),
      subtitle: getString(
        formData,
        "featuredProducts.subtitle",
        currentConfig.featuredProducts.subtitle,
      ),
      title: getString(
        formData,
        "featuredProducts.title",
        currentConfig.featuredProducts.title,
      ),
    },
    featuredCategories: {
      items: currentConfig.featuredCategories.items.map((category, index) => ({
        description: getString(
          formData,
          `featuredCategories.${index}.description`,
          category.description,
        ),
        isActive: getBoolean(formData, `featuredCategories.${index}.isActive`),
        name: getString(formData, `featuredCategories.${index}.name`, category.name),
        order: getOrder(
          formData,
          `featuredCategories.${index}.order`,
          category.order,
        ),
        slug: getString(formData, `featuredCategories.${index}.slug`, category.slug),
      })),
      subtitle: getString(
        formData,
        "featuredCategories.subtitle",
        currentConfig.featuredCategories.subtitle,
      ),
      title: getString(
        formData,
        "featuredCategories.title",
        currentConfig.featuredCategories.title,
      ),
    },
    benefits: {
      items: currentConfig.benefits.items.map((benefit, index) => ({
        description: getString(
          formData,
          `benefits.${index}.description`,
          benefit.description,
        ),
        icon: getBenefitIcon(formData, `benefits.${index}.icon`, benefit.icon),
        isActive: getBoolean(formData, `benefits.${index}.isActive`),
        order: getOrder(formData, `benefits.${index}.order`, benefit.order),
        title: getString(formData, `benefits.${index}.title`, benefit.title),
      })),
      title: getString(formData, "benefits.title", currentConfig.benefits.title),
    },
    instagram: {
      buttonHref: getString(
        formData,
        "instagram.buttonHref",
        currentConfig.instagram.buttonHref,
      ),
      buttonLabel: getString(
        formData,
        "instagram.buttonLabel",
        currentConfig.instagram.buttonLabel,
      ),
      isActive: getBoolean(formData, "instagram.isActive"),
      text: getString(formData, "instagram.text", currentConfig.instagram.text),
      title: getString(formData, "instagram.title", currentConfig.instagram.title),
      username: getString(
        formData,
        "instagram.username",
        currentConfig.instagram.username,
      ),
    },
  };
  const saveResult = await saveHomeContentConfig({
    config: nextConfig,
    expectedUpdatedAt,
  });

  if (saveResult.status === "validation_error") {
    return {
      fieldErrors: saveResult.fieldErrors ?? {},
      message: saveResult.message,
      status: "error",
    };
  }

  if (saveResult.status === "conflict" || saveResult.status === "error") {
    return {
      fieldErrors: {},
      message: saveResult.message,
      status: "error",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/contenido");

  return {
    fieldErrors: {},
    message: "Contenido del inicio actualizado correctamente.",
    status: "success",
  };
}
