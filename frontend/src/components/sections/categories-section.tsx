import Image from "next/image";
import Link from "next/link";
import { getNavigationCategories } from "@/config/catalog-navigation";
import { getPublicCategories } from "@/lib/catalog/queries";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";
import { Container } from "@/components/ui/container";
import { getActiveFeaturedCategories } from "@/lib/home-content/config";
import type { HomeContentFeaturedCategories } from "@/lib/home-content/types";

const categoryTones = [
  "bg-[#f7dce7]",
  "bg-[#f6e7e0]",
  "bg-[#fff0f5]",
  "bg-[#ead8de]",
  "bg-[#fff5ec]",
  "bg-[#f2d5df]",
];

const categoryShapes = [
  "rounded-[24px] bg-primary/24",
  "rounded-full bg-surface/82",
  "rounded-[22px] bg-background/72",
  "rounded-[24px] bg-secondary/72",
];

const categoryImages: Record<
  string,
  {
    alt: string;
    src: string;
  }
> = {
  accesorios: {
    alt: "Accesorios de tecnologia W.todocell en estilo editorial.",
    src: "/images/categories/accesorios.webp",
  },
  celulares: {
    alt: "Celulares seleccionados por W.todocell.",
    src: "/images/categories/celulares.webp",
  },
  combos: {
    alt: "Combos de accesorios W.todocell.",
    src: "/images/categories/combos.webp",
  },
  consolas: {
    alt: "Gaming y consolas seleccionadas por W.todocell.",
    src: "/images/categories/gaming.webp",
  },
  fundas: {
    alt: "Fundas W.todocell en composicion editorial.",
    src: "/images/categories/fundas.webp",
  },
  "pop-socket": {
    alt: "Pop Socket y grips W.todocell en composicion editorial.",
    src: "/images/categories/pop-socket.webp",
  },
};

const categoryImagePositions: Record<string, string> = {
  accesorios: "center center",
  celulares: "center 40%",
  combos: "center center",
  consolas: "center bottom",
  fundas: "center center",
  "pop-socket": "center center",
};

function getCategoryTone(index: number) {
  return categoryTones[index % categoryTones.length];
}

type CategoriesSectionProps = {
  content: HomeContentFeaturedCategories;
};

export async function CategoriesSection({ content }: CategoriesSectionProps) {
  const navigationCategories = getNavigationCategories(await getPublicCategories());
  const categoriesBySlug = new Map(
    navigationCategories.map((category) => [category.slug, category]),
  );
  const categories = getActiveFeaturedCategories(content.items).map((category) => {
    const realCategory = categoriesBySlug.get(category.slug);

    return {
      description: realCategory?.description || category.description,
      name: realCategory?.name || category.name,
      slug: realCategory?.slug || category.slug,
    };
  });

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="relative -mt-6 overflow-hidden bg-transparent py-10 sm:-mt-7 sm:py-12 lg:-mt-8 lg:py-16">
      <Container className="max-w-[1320px] space-y-7">
        <div className="relative mx-auto max-w-2xl space-y-4 text-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
              Colecciones
            </p>
            <h2 className="font-display text-[1.8rem] font-semibold leading-tight text-foreground sm:text-[2.25rem]">
              {content.title}
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {content.subtitle}
            </p>
          </div>
          <Link
            className="inline-flex w-full items-center justify-center rounded-full bg-white/44 px-5 py-2 text-sm font-semibold text-foreground transition-all duration-[250ms] hover:-translate-y-0.5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            href="/tienda"
          >
            Ver tienda
          </Link>
        </div>

        <div className="grid gap-x-5 gap-y-8 min-[430px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category, index) => {
            const categoryImage = categoryImages[category.slug];

            return (
              <Link
                className="group block"
                href={getCatalogCategoryHref(category.slug)}
                key={category.slug}
              >
                <article className="wt-card-hover-spark h-full overflow-hidden rounded-[24px] bg-[rgba(255,250,248,0.82)] shadow-[0_8px_22px_rgba(74,55,47,0.035)] transition-all duration-[300ms] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(74,55,47,0.055)] focus-within:ring-2 focus-within:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div
                    className={`${getCategoryTone(index)} relative aspect-[4/3] overflow-hidden rounded-t-[24px]`}
                  >
                    {categoryImage ? (
                      <Image
                        alt={categoryImage.alt}
                        className="object-cover transition-transform duration-[300ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        fill
                        loading={index === 0 ? "eager" : "lazy"}
                        quality={92}
                        sizes="(min-width: 1280px) 240px, (min-width: 1024px) 30vw, (min-width: 430px) 50vw, 100vw"
                        src={categoryImage.src}
                        style={{
                          objectPosition:
                            categoryImagePositions[category.slug] ??
                            "center center",
                        }}
                      />
                    ) : (
                      <>
                        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/22 blur-sm transition-transform duration-[450ms] group-hover:scale-110" />
                        <div className="absolute right-5 top-5 rounded-full bg-white/34 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-hover">
                          W.
                        </div>
                        <div
                          className={`absolute bottom-6 left-6 h-[42%] w-[38%] ${categoryShapes[index % categoryShapes.length]} shadow-[0_10px_24px_rgba(74,55,47,0.055)] transition-transform duration-[450ms] group-hover:-translate-y-1 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100`}
                        />
                        <div className="absolute bottom-7 right-6 h-[34%] w-[34%] rounded-[22px] bg-surface/58 shadow-[0_10px_22px_rgba(74,55,47,0.045)] transition-transform duration-[450ms] group-hover:translate-x-1 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:scale-100" />
                        <div className="absolute left-6 top-7 h-8 w-24 rounded-full bg-surface/42" />
                      </>
                    )}
                  </div>
                  <div className="space-y-3 bg-[rgba(255,250,248,0.9)] px-4 pb-4 pt-4">
                    <div className="space-y-1.5">
                      <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
                        {category.name}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-hover transition-colors duration-[250ms] group-hover:text-foreground">
                      Explorar
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
