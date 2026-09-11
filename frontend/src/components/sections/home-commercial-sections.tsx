import type { PublicProduct } from "@/lib/catalog/types";
import { getPublicProducts } from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { ProductShowcaseSection } from "@/components/sections/product-showcase-section";
import type { HomeContentFeaturedProducts } from "@/lib/home-content/types";

function takeProducts(products: Array<PublicProduct>, limit: number) { return products.slice(0, limit); }

export async function HomeCommercialSections({ content }: { content: HomeContentFeaturedProducts }) {
  if (!content.isActive) return null;
  const [products, favoriteProductIds] = await Promise.all([getPublicProducts({ sort: content.sort }), getCurrentUserFavoriteIds()]);
  return <ProductShowcaseSection ctaHref={content.ctaHref} ctaLabel="Ver toda la tienda" favoriteProductIds={favoriteProductIds} products={takeProducts(products.filter((product) => product.featured), Math.min(content.limit, 4))} subtitle={content.subtitle} title={content.title} />;
}