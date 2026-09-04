import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import { getPublicProducts } from "@/lib/catalog/queries";
import { getCurrentUserFavoriteIds } from "@/lib/favorites/queries";
import { ProductShowcaseSection } from "@/components/sections/product-showcase-section";
import type { HomeContentFeaturedProducts } from "@/lib/home-content/types";
import { formatCurrency } from "@/lib/format-currency";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

function takeProducts(products: Array<PublicProduct>, limit = 4) {
  return products.slice(0, limit);
}

type HomeCommercialSectionsProps = {
  content: HomeContentFeaturedProducts;
};

function RecommendedCombosSection({
  products,
}: {
  products: Array<PublicProduct>;
}) {
  const [featuredCombo, ...secondaryCombos] = takeProducts(products, 3);

  if (!featuredCombo) {
    return null;
  }

  return (
    <section className="relative bg-transparent py-8 sm:py-12 lg:py-16">
      <Container className="max-w-[1320px]">
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.82fr)] lg:items-stretch">
          <Link
            className="group grid min-h-[320px] overflow-hidden rounded-[24px] bg-white/34 p-3.5 transition-all duration-[280ms] hover:-translate-y-1 hover:bg-white/46 hover:shadow-[0_14px_34px_rgba(74,55,47,0.055)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-4"
            href={`/producto/${featuredCombo.slug}`}
          >
            <div className="relative min-h-52 overflow-hidden rounded-[22px] bg-background/60">
              {featuredCombo.primaryImage?.url ? (
                  <Image
                    alt={featuredCombo.primaryImage.alt}
                    className="object-cover transition-transform duration-[450ms] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    src={featuredCombo.primaryImage.url}
                />
              ) : (
                <div className="absolute inset-0 bg-secondary">
                  <div className="absolute inset-6 rounded-[22px] border border-white/70 bg-surface/35" />
                  <div className="absolute bottom-6 right-6 h-24 w-24 rounded-[24px] bg-surface/75" />
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
                  Combo recomendado
                </p>
                <h2 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                  {featuredCombo.name}
                </h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {featuredCombo.shortDescription}
                </p>
              </div>
              <p className="whitespace-nowrap font-display text-xl font-semibold text-foreground sm:text-2xl">
                {formatCurrency(featuredCombo.price)}
              </p>
            </div>
          </Link>

          <div className="flex flex-col justify-between gap-4 rounded-[24px] bg-white/28 p-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
                Preparado para futuras promociones
              </p>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Combos recomendados
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Productos reales del catalogo, presentados como una seleccion
                especial para comprar mas facil.
              </p>
            </div>

            <div className="grid gap-3">
              {secondaryCombos.map((combo) => (
                <Link
                  className="group grid grid-cols-[74px_minmax(0,1fr)] gap-3 rounded-[18px] bg-surface/58 p-2.5 transition-all duration-[250ms] hover:-translate-y-0.5 hover:bg-surface/72 hover:shadow-[0_10px_24px_rgba(74,55,47,0.045)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  href={`/producto/${combo.slug}`}
                  key={combo.id}
                >
                  <div className="relative aspect-square overflow-hidden rounded-[16px] bg-surface-soft">
                    {combo.primaryImage?.url ? (
                        <Image
                          alt={combo.primaryImage.alt}
                          className="object-cover transition-transform duration-[350ms] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          fill
                          sizes="82px"
                        src={combo.primaryImage.url}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-foreground">
                      {combo.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-primary-hover">
                      {formatCurrency(combo.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              className={buttonStyles({ size: "md", variant: "primary" })}
              href="/tienda/combos"
            >
              Ver combos
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export async function HomeCommercialSections({
  content,
}: HomeCommercialSectionsProps) {
  if (!content.isActive) {
    return null;
  }

  const [products, favoriteProductIds] = await Promise.all([
    getPublicProducts({ sort: content.sort }),
    getCurrentUserFavoriteIds(),
  ]);
  const featuredProducts = products.filter((product) => product.featured);
  const comboProducts = products.filter((product) => product.category === "combos");

  return (
    <>
      <ProductShowcaseSection
        ctaHref={content.ctaHref}
        ctaLabel={content.ctaLabel}
        favoriteProductIds={favoriteProductIds}
        products={takeProducts(featuredProducts, content.limit)}
        subtitle={content.subtitle}
        title={content.title}
      />
      <RecommendedCombosSection products={comboProducts} />
    </>
  );
}
