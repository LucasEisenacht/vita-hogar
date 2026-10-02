import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getActiveFeaturedCategories } from "@/lib/home-content/config";
import type { HomeContentFeaturedCategories } from "@/lib/home-content/types";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";

const categoryImages = [
  "/images/vita/textiles-cushion-editorial.webp",
  "/images/vita/shop-hero-editorial.webp",
  "/images/vita/vase-candle-editorial.webp",
];

export function CategoriesSection({ content }: { content: HomeContentFeaturedCategories }) {
  const categories = getActiveFeaturedCategories(content.items);

  if (!categories.length) return null;

  return <section className="vita-home-habitats bg-surface py-12 sm:py-16 lg:py-24"><Container><div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16"><div><p className="vita-label">Formas de habitar</p><h2 className="mt-4 font-display text-4xl leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl">{content.title}</h2><p className="mt-5 max-w-md text-base leading-7 text-text-secondary">{content.subtitle}</p><Link className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/tienda">Explorar la tienda</Link></div><div className="vita-habitat-grid grid gap-px border border-border bg-border sm:grid-cols-[1.22fr_0.89fr_0.89fr]">{categories.map((category, index) => <Link className="group relative flex min-h-72 flex-col justify-end overflow-hidden bg-background p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={getCatalogCategoryHref(category.slug)} key={category.slug}><Image alt={`Composición editorial de ${category.name}.`} className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" fill sizes="(min-width: 640px) 25vw, 100vw" src={categoryImages[index % categoryImages.length]}/><div className="absolute inset-0 bg-[rgba(46,41,36,0.42)]"/><div className="relative text-white"><span className="text-xs font-semibold tracking-[0.16em] text-white/85">Categoría</span><h3 className="mt-3 font-display text-2xl leading-tight">{category.name}</h3><p className="mt-3 text-sm leading-6 text-white/90">{category.description}</p></div></Link>)}</div></div></Container></section>;
}
