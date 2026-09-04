import type { PublicProduct } from "@/lib/catalog/types";
import { CatalogEditorialBlock } from "@/components/shop/catalog-editorial-block";
import { ProductCard } from "@/components/shared/product-card";
import { getBalancedProductGridClassName } from "@/components/shop/product-grid-layout";
import type { CatalogEditorialExperience } from "@/config/catalog-editorial";

type EditorialProductGridProps = {
  editorialBlock?: CatalogEditorialExperience["editorialBlock"];
  favoriteProductIds?: Array<string>;
  products: Array<PublicProduct>;
  refreshOnFavoriteChange?: boolean;
};

export function EditorialProductGrid({
  editorialBlock,
  favoriteProductIds = [],
  products,
  refreshOnFavoriteChange = false,
}: EditorialProductGridProps) {
  const favoriteProductIdSet = new Set(favoriteProductIds);
  const shouldShowEditorialBlock = Boolean(editorialBlock) && products.length >= 8;

  return (
    <div className={getBalancedProductGridClassName(products.length)}>
      {products.map((product) => (
        <ProductCard
          initialIsFavorite={favoriteProductIdSet.has(product.id)}
          key={product.id}
          product={product}
          refreshOnFavoriteChange={refreshOnFavoriteChange}
        />
      )).flatMap((card, index) =>
        shouldShowEditorialBlock && index === 7 && editorialBlock
          ? [card, <CatalogEditorialBlock block={editorialBlock} key="editorial-block" />]
          : [card],
      )}
    </div>
  );
}
