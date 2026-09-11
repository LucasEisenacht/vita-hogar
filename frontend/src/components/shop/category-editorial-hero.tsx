import Image from "next/image";
import Link from "next/link";
import { BotanicalMotif } from "@/components/decorative/botanical-motif";
import { BrandLeafField } from "@/components/decorative/brand-leaf-field";
import { CategoryChips } from "@/components/shop/category-chips";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { CatalogEditorialExperience } from "@/config/catalog-editorial";

type CategoryEditorialHeroProps = { activeChipHref?: string; experience: CatalogEditorialExperience };
const benefits = ["Envíos a todo el país", "Compra segura", "Productos seleccionados"] as const;

export function CategoryEditorialHero({ activeChipHref, experience }: CategoryEditorialHeroProps) {
  return (
    <section className="vita-catalog-hero pb-8 pt-6 sm:pb-12 sm:pt-9">
      <Container className="max-w-[1320px]">
        <nav aria-label="Breadcrumb" className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <ol className="flex items-center gap-2"><li><Link href="/">Inicio</Link></li><li aria-hidden="true">/</li><li aria-current="page">Tienda</li></ol>
        </nav>
        <div className="vita-catalog-hero__frame grid overflow-hidden lg:grid-cols-[1.02fr_0.98fr]">
          <div className="vita-catalog-hero__content relative px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <BrandLeafField variant="catalog" />
            <BotanicalMotif className="vita-botanical-motif--catalog" />
            <p className="vita-label">{experience.eyebrow}</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[0.98] text-foreground sm:text-5xl lg:text-6xl">{experience.title}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">{experience.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={buttonStyles({ className: "vita-catalog-hero__primary-cta", size: "md", variant: "primary" })} href="#catalog-products">Ver productos</Link>
              <Link className={buttonStyles({ size: "md", variant: "secondary" })} href={experience.featuredLink?.href ?? activeChipHref ?? "/tienda"}>Explorar ambientes</Link>
            </div>
            <ul className="mt-10 grid gap-3 text-sm text-text-secondary sm:grid-cols-3">{benefits.map((benefit) => <li className="border-t border-border pt-3" key={benefit}>{benefit}</li>)}</ul>
          </div>
          <div className="vita-catalog-hero__media-shell">
            <div className="vita-catalog-hero__media relative min-h-[260px] overflow-hidden bg-background-alt sm:min-h-[340px] lg:aspect-[3/2] lg:min-h-0">
            <Image
              alt="Textiles y objetos de hogar en una composición editorial cálida."
              className="vita-catalog-hero__image object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              src="/images/vita/shop-hero-editorial.webp"
              style={{ objectFit: "cover", objectPosition: "center center" }}
            />
            </div>
          </div>
        </div>
        <div className="mt-5"><CategoryChips activeHref={activeChipHref} chips={experience.chips} /></div>
      </Container>
    </section>
  );
}
