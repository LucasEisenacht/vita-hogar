import defaultHomeContent from "@/config/local/home-content.json";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type {
  HomeContentBenefit,
  HomeContentConfig,
  HomeContentFeaturedCategory,
} from "@/lib/home-content/types";
import { validateHomeContentConfig } from "@/lib/home-content/validation";
import type { Json } from "@/types/database";

const homeContentKey = "home";
const fallbackValidation = validateHomeContentConfig(defaultHomeContent);
const fallbackHomeContentConfig: HomeContentConfig = fallbackValidation.ok
  ? fallbackValidation.config
  : (defaultHomeContent as HomeContentConfig);

export type HomeContentSource = "fallback" | "supabase";

export type HomeContentLoadResult = {
  canPersist: boolean;
  config: HomeContentConfig;
  source: HomeContentSource;
  updatedAt: string | null;
  warning?: string;
};

export type HomeContentSaveResult =
  | {
      config: HomeContentConfig;
      status: "success";
      updatedAt: string;
    }
  | {
      fieldErrors?: Record<string, string>;
      message: string;
      status: "conflict" | "error" | "validation_error";
    };

function withTextFallback(value: string, fallback: string) {
  return value.trim() || fallback;
}

export function resolveHomeContentFallbacks(
  config: HomeContentConfig,
): HomeContentConfig {
  return {
    benefits: {
      ...config.benefits,
      title: withTextFallback(
        config.benefits.title,
        fallbackHomeContentConfig.benefits.title,
      ),
    },
    featuredCategories: {
      ...config.featuredCategories,
      subtitle: withTextFallback(
        config.featuredCategories.subtitle,
        fallbackHomeContentConfig.featuredCategories.subtitle,
      ),
      title: withTextFallback(
        config.featuredCategories.title,
        fallbackHomeContentConfig.featuredCategories.title,
      ),
    },
    featuredProducts: {
      ...config.featuredProducts,
      ctaHref: withTextFallback(
        config.featuredProducts.ctaHref,
        fallbackHomeContentConfig.featuredProducts.ctaHref,
      ),
      ctaLabel: withTextFallback(
        config.featuredProducts.ctaLabel,
        fallbackHomeContentConfig.featuredProducts.ctaLabel,
      ),
      subtitle: withTextFallback(
        config.featuredProducts.subtitle,
        fallbackHomeContentConfig.featuredProducts.subtitle,
      ),
      title: withTextFallback(
        config.featuredProducts.title,
        fallbackHomeContentConfig.featuredProducts.title,
      ),
    },
    hero: {
      ...config.hero,
      badge: withTextFallback(
        config.hero.badge,
        fallbackHomeContentConfig.hero.badge,
      ),
      desktopImageUrl: withTextFallback(
        config.hero.desktopImageUrl,
        fallbackHomeContentConfig.hero.desktopImageUrl,
      ),
      mobileImageUrl: withTextFallback(
        config.hero.mobileImageUrl,
        config.hero.desktopImageUrl ||
          fallbackHomeContentConfig.hero.mobileImageUrl,
      ),
      primaryCtaHref: withTextFallback(
        config.hero.primaryCtaHref,
        fallbackHomeContentConfig.hero.primaryCtaHref,
      ),
      primaryCtaLabel: withTextFallback(
        config.hero.primaryCtaLabel,
        fallbackHomeContentConfig.hero.primaryCtaLabel,
      ),
      secondaryCtaHref: config.hero.secondaryCtaLabel
        ? withTextFallback(
            config.hero.secondaryCtaHref,
            fallbackHomeContentConfig.hero.secondaryCtaHref,
          )
        : "",
      secondaryCtaLabel: config.hero.secondaryCtaHref
        ? withTextFallback(
            config.hero.secondaryCtaLabel,
            fallbackHomeContentConfig.hero.secondaryCtaLabel,
          )
        : "",
      subtitle: withTextFallback(
        config.hero.subtitle,
        fallbackHomeContentConfig.hero.subtitle,
      ),
      title: withTextFallback(
        config.hero.title,
        fallbackHomeContentConfig.hero.title,
      ),
    },
    instagram: {
      ...config.instagram,
      buttonHref: withTextFallback(
        config.instagram.buttonHref,
        fallbackHomeContentConfig.instagram.buttonHref,
      ),
      buttonLabel: withTextFallback(
        config.instagram.buttonLabel,
        fallbackHomeContentConfig.instagram.buttonLabel,
      ),
      text: withTextFallback(
        config.instagram.text,
        fallbackHomeContentConfig.instagram.text,
      ),
      title: withTextFallback(
        config.instagram.title,
        fallbackHomeContentConfig.instagram.title,
      ),
    },
  };
}

function sortByOrder<TItem extends { order: number }>(items: Array<TItem>) {
  return [...items].sort((firstItem, secondItem) => {
    if (firstItem.order !== secondItem.order) {
      return firstItem.order - secondItem.order;
    }

    return 0;
  });
}

function toJson(value: HomeContentConfig): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function getFallbackResult(
  warning: string,
  options: {
    canPersist?: boolean;
    updatedAt?: string | null;
  } = {},
): HomeContentLoadResult {
  return {
    canPersist: options.canPersist ?? false,
    config: fallbackHomeContentConfig,
    source: "fallback",
    updatedAt: options.updatedAt ?? null,
    warning,
  };
}

function getDatabaseErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "42P01") {
    return "La migracion de contenido todavia no fue aplicada.";
  }

  return error.message || "No se pudo acceder a la configuracion del inicio.";
}

export function getActiveHomeBenefits(config: HomeContentConfig) {
  return sortByOrder(
    config.benefits.items.filter((benefit) => benefit.isActive),
  );
}

export function getActiveBenefits(benefits: Array<HomeContentBenefit>) {
  return sortByOrder(benefits.filter((benefit) => benefit.isActive));
}

export function getActiveHomeCategories(config: HomeContentConfig) {
  return sortByOrder(
    config.featuredCategories.items.filter((category) => category.isActive),
  );
}

export function getActiveFeaturedCategories(
  categories: Array<HomeContentFeaturedCategory>,
) {
  return sortByOrder(categories.filter((category) => category.isActive));
}

export async function getHomeContentConfigResult(): Promise<HomeContentLoadResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("home_content")
    .select("content,is_active,updated_at")
    .eq("key", homeContentKey)
    .maybeSingle();

  if (error) {
    return getFallbackResult(getDatabaseErrorMessage(error));
  }

  if (!data) {
    return getFallbackResult(
      "No existe todavia la fila home en Supabase. Se esta usando el fallback local.",
      { canPersist: true },
    );
  }

  if (!data.is_active) {
    return getFallbackResult(
      "La configuracion home existe, pero esta inactiva. Se esta usando el fallback local.",
      { canPersist: true, updatedAt: data.updated_at },
    );
  }

  const validation = validateHomeContentConfig(data.content);

  if (!validation.ok) {
    return getFallbackResult(
      "El JSON guardado en Supabase es invalido. Se esta usando el fallback local.",
      { canPersist: true, updatedAt: data.updated_at },
    );
  }

  return {
    canPersist: true,
    config: validation.config,
    source: "supabase",
    updatedAt: data.updated_at,
  };
}

export async function getHomeContentConfig(): Promise<HomeContentConfig> {
  const result = await getHomeContentConfigResult();

  return result.config;
}

export async function saveHomeContentConfig({
  config,
  expectedUpdatedAt,
}: {
  config: HomeContentConfig;
  expectedUpdatedAt: string | null;
}): Promise<HomeContentSaveResult> {
  await requireAdmin();

  const validation = validateHomeContentConfig(config);

  if (!validation.ok) {
    return {
      fieldErrors: validation.fieldErrors,
      message: "Revisa los campos marcados antes de guardar.",
      status: "validation_error",
    };
  }

  const supabase = await createClient();
  const payload = toJson(validation.config);

  if (expectedUpdatedAt) {
    const { data, error } = await supabase
      .from("home_content")
      .update({
        content: payload,
        is_active: true,
      })
      .eq("key", homeContentKey)
      .eq("updated_at", expectedUpdatedAt)
      .select("content,updated_at")
      .maybeSingle();

    if (error) {
      return {
        message: getDatabaseErrorMessage(error),
        status: "error",
      };
    }

    if (!data) {
      return {
        message:
          "El contenido fue modificado desde otra sesion. Recarga la pagina antes de guardar nuevamente.",
        status: "conflict",
      };
    }

    return {
      config: validation.config,
      status: "success",
      updatedAt: data.updated_at,
    };
  }

  const { data, error } = await supabase
    .from("home_content")
    .upsert(
      {
        content: payload,
        is_active: true,
        key: homeContentKey,
      },
      {
        ignoreDuplicates: true,
        onConflict: "key",
      },
    )
    .select("content,updated_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        message:
          "El contenido fue modificado desde otra sesion. Recarga la pagina antes de guardar nuevamente.",
        status: "conflict",
      };
    }

    return {
      message: getDatabaseErrorMessage(error),
      status: "error",
    };
  }

  if (!data) {
    return {
      message: "No se pudo confirmar el guardado del contenido.",
      status: "error",
    };
  }

  return {
    config: validation.config,
    status: "success",
    updatedAt: data.updated_at,
  };
}
