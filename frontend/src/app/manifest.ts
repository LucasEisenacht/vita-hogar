import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#F7F3EC",
    description:
      "Textiles, objetos y detalles para vestir cada ambiente con calidez natural.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "512x512",
        src: siteConfig.logo.src,
        type: "image/png",
      },
    ],
    name: "VITA HOGAR",
    short_name: "VITA HOGAR",
    start_url: "/",
    theme_color: "#806047",
  };
}
