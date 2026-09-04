import type { PublicProduct } from "@/lib/catalog/types";
import { ProductCard } from "@/components/shared/product-card";
import { getBalancedProductGridClassName } from "@/components/shop/product-grid-layout";

type ProductGridProps = {
  favoriteProductIds?: Array<string>;
  products: Array<PublicProduct>;
  refreshOnFavoriteChange?: boolean;
};

export function ProductGrid({
  favoriteProductIds = [],
  products,
  refreshOnFavoriteChange = false,
}: ProductGridProps) {
  const favoriteProductIdSet = new Set(favoriteProductIds);

  return (
    <div className={getBalancedProductGridClassName(products.length)}>
      {products.map((product) => (
        <ProductCard
          initialIsFavorite={favoriteProductIdSet.has(product.id)}
          key={product.id}
          product={product}
          refreshOnFavoriteChange={refreshOnFavoriteChange}
        />
      ))}
    </div>
  );
}
