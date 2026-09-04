const developmentSiteUrl = "http://localhost:3000";

function hasCredentials(url: URL) {
  return Boolean(url.username || url.password);
}

function isLocalhost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function normalizeSiteUrl(value: string) {
  const trimmedValue = value.trim().replace(/\/+$/, "");

  if (!trimmedValue) {
    throw new Error("NEXT_PUBLIC_SITE_URL is empty.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }

  if (hasCredentials(parsedUrl)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must not include credentials.");
  }

  if (parsedUrl.hash || parsedUrl.search) {
    throw new Error("NEXT_PUBLIC_SITE_URL must not include path, query, or hash.");
  }

  const isLocalDevelopmentUrl =
    parsedUrl.protocol === "http:" && isLocalhost(parsedUrl.hostname);

  if (parsedUrl.protocol !== "https:" && !isLocalDevelopmentUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside localhost.");
  }

  return parsedUrl.origin;
}

function shouldRequireConfiguredProductionUrl() {
  return process.env.VERCEL_ENV === "production";
}

export function getPublicSiteUrl(options?: { fallbackOrigin?: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    return normalizeSiteUrl(siteUrl);
  }

  if (shouldRequireConfiguredProductionUrl()) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SITE_URL.",
    );
  }

  if (options?.fallbackOrigin) {
    return normalizeSiteUrl(options.fallbackOrigin);
  }

  return developmentSiteUrl;
}

export function buildPublicUrl(
  path: string,
  options?: { fallbackOrigin?: string },
) {
  const baseUrl = getPublicSiteUrl(options);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(normalizedPath, baseUrl).toString();
}
