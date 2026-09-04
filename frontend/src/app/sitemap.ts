import type { MetadataRoute } from "next";
import { getNavigationCategories } from "@/config/catalog-navigation";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog/queries";
import { buildPublicUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getPublicCategories(),
    getPublicProducts(),
  ]);
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 1,
      url: buildPublicUrl("/"),
    },
    {
      changeFrequency: "daily",
      lastModified: now,
      priority: 0.9,
      url: buildPublicUrl("/tienda"),
    },
  ];
  const categoryRoutes = getNavigationCategories(categories).map((category) => ({
    changeFrequency: "daily" as const,
    lastModified: now,
    priority: 0.8,
    url: buildPublicUrl(`/tienda/${category.slug}`),
  }));
  const productRoutes = products.map((product) => ({
    changeFrequency: "daily" as const,
    lastModified: new Date(product.updatedAt),
    priority: 0.75,
    url: buildPublicUrl(`/producto/${product.slug}`),
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
