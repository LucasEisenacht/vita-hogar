const allowedReturnPaths = [
  "/checkout",
  "/checkout/inicio",
  "/actualizar-contrasena",
  "/mi-cuenta",
  "/mi-cuenta/pedidos",
];

function isKnownInternalPath(pathname: string) {
  return (
    allowedReturnPaths.includes(pathname) ||
    pathname.startsWith("/mi-cuenta/pedidos/")
  );
}

export function getSafeAuthRedirect(
  nextPath: string | null | undefined,
  fallback = "/mi-cuenta",
) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  try {
    const parsedUrl = new URL(nextPath, "https://wtodocell.local");

    if (parsedUrl.origin !== "https://wtodocell.local") {
      return fallback;
    }

    if (!isKnownInternalPath(parsedUrl.pathname)) {
      return fallback;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return fallback;
  }
}
