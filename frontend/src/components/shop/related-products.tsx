import type { PublicProduct } from "@/lib/catalog/types";
import { getBalancedProductGridClassName } from "@/components/shop/product-grid-layout";
import { ProductCard } from "@/components/shared/product-card";

type RelatedProductsProps = {
  favoriteProductIds?: Array<string>;
  products: Array<PublicProduct>;
};

export function RelatedProducts({
  favoriteProductIds = [],
  products,
}: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  const favoriteProductIdSet = new Set(favoriteProductIds);

  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
          Segui explorando
        </p>
        <h2 className="font-display text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.45rem]">
          Productos relacionados
        </h2>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Mas opciones reales del catalogo para completar tu compra con el
          mismo estilo.
        </p>
      </div>
      <div className={getBalancedProductGridClassName(products.length)}>
        {products.map((product) => (
          <ProductCard
            initialIsFavorite={favoriteProductIdSet.has(product.id)}
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}
