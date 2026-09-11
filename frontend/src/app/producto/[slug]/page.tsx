import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { ProductPurchaseExperience } from "@/components/shop/product-purchase-experience";
import { RelatedProducts } from "@/components/shop/related-products";
import { ProductStickyPurchaseBar } from "@/components/shop/product-sticky-purchase-bar";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import {
  CompleteStyleSection,
  ProductDescriptionStory,
  ProductFaqSection,
  ProductLifestyleGallery,
  ProductQuickBenefits,
  ProductReviewsSection,
} from "@/components/shop/product-editorial-sections";
import { Container } from "@/components/ui/container";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";
import { createPublicMetadata } from "@/lib/seo/metadata";
import {
  createBreadcrumbJsonLd,
  createJsonLdScript,
  createProductJsonLd,
} from "@/lib/seo/structured-data";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado | VITA HOGAR",
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  return createPublicMetadata({
    description: product.shortDescription || product.description,
    image: product.primaryImage?.url,
    path: `/producto/${product.slug}`,
    title: `${product.name} | VITA HOGAR`,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, favoriteProductIds] = await Promise.all([
    getRelatedProducts(product, 4),
    getCurrentUserFavoriteIds(),
  ]);
  const isInitiallyFavorite = favoriteProductIds.includes(product.id);

  return (
    <StorefrontPageShell intensity="low">
      <script
        dangerouslySetInnerHTML={createJsonLdScript(
          createBreadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Tienda", path: "/tienda" },
            {
              name: product.categoryLabel,
              path: getCatalogCategoryHref(product.category),
            },
            { name: product.name, path: `/producto/${product.slug}` },
          ]),
        )}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={createJsonLdScript(createProductJsonLd(product))}
        type="application/ld+json"
      />
      <div className="vita-product-page pb-24 pt-7 text-foreground sm:pt-10 lg:pb-28 lg:pt-12">
      <Container className="max-w-[1400px] space-y-12 lg:space-y-16">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 pb-1 text-sm text-muted-foreground"
        >
          <Link className="hover:text-primary-hover" href="/">
            Inicio
          </Link>
          <span>/</span>
          <Link className="hover:text-primary-hover" href="/tienda">
            Tienda
          </Link>
          <span>/</span>
          <Link
            className="hover:text-primary-hover"
            href={getCatalogCategoryHref(product.category)}
          >
            {product.categoryLabel}
          </Link>
          <span>/</span>
          <span aria-current="page" className="text-foreground">
            {product.name}
          </span>
        </nav>

        <ProductPurchaseExperience
          initialIsFavorite={isInitiallyFavorite}
          product={product}
        />

        <ProductQuickBenefits />
        <ProductLifestyleGallery product={product} />
        <ProductDescriptionStory product={product} />
        <CompleteStyleSection
          product={product}
          relatedProducts={relatedProducts}
        />
        <RelatedProducts
          favoriteProductIds={favoriteProductIds}
          products={relatedProducts}
        />
        <ProductFaqSection />
        <ProductReviewsSection />
      </Container>
      <ProductStickyPurchaseBar
        initialIsFavorite={isInitiallyFavorite}
        product={product}
      />
      </div>
    </StorefrontPageShell>
  );
}
