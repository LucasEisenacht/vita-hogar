import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  return {
    rules: {
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/carrito",
        "/checkout",
        "/checkout/",
        "/ingresar",
        "/mi-cuenta",
        "/mi-cuenta/",
        "/recuperar-contrasena",
        "/registro",
        "/actualizar-contrasena",
      ],
      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
