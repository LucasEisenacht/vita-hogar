import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fff7f1",
    description:
      "Accesorios, celulares y tecnologia elegidos con una mirada suave, moderna y personal.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "512x512",
        src: siteConfig.logo.src,
        type: "image/png",
      },
    ],
    name: "W.todocell",
    short_name: "W.todocell",
    start_url: "/",
    theme_color: "#fff7f1",
  };
}
