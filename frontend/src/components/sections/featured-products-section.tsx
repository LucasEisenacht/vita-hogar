import { getFeaturedProducts } from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { getBalancedProductGridClassName } from "@/components/shop/product-grid-layout";
import { ProductCard } from "@/components/shared/product-card";
import { Container } from "@/components/ui/container";

export async function FeaturedProductsSection() {
  const [products, favoriteProductIds] = await Promise.all([
    getFeaturedProducts(),
    getCurrentUserFavoriteIds(),
  ]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-transparent py-8 sm:py-12 lg:py-14">
      <Container className="max-w-[1320px] space-y-7">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-display text-3xl font-semibold text-foreground sm:text-[2.35rem]">
            Elegidos para vos
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Una selecci&oacute;n de accesorios que combinan dise&ntilde;o,
            funcionalidad y estilo.
          </p>
        </div>

        <div className={getBalancedProductGridClassName(products.length)}>
          {products.map((product) => (
            <ProductCard
              initialIsFavorite={favoriteProductIds.includes(product.id)}
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
