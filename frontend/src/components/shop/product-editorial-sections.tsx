import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/types";
import { formatCurrency } from "@/lib/format-currency";
import { buttonStyles } from "@/components/ui/button";

type ProductEditorialSectionsProps = {
  product: PublicProduct;
  relatedProducts: Array<PublicProduct>;
};

const lifestyleImages = [
  { alt: "Comedor sereno con lino, madera, cerámica y ramas naturales.", src: "/images/vita/shop-hero-editorial.webp" },
  { alt: "Toallas de algodón en tonos marfil y arena.", src: "/images/vita/bath-towels-editorial.webp" },
  { alt: "Canasto tejido con una manta de lino en un living luminoso.", src: "/images/vita/woven-basket-editorial.webp" },
  { alt: "Florero de cerámica y vela artesanal sobre madera clara.", src: "/images/vita/vase-candle-editorial.webp" },
];

const quickBenefits = [
  { description: "Opciones de entrega coordinadas para todo el país.", title: "Envíos cuidados" },
  { description: "Información clara y acompañamiento antes de comprar.", title: "Compra segura" },
  { description: "Piezas elegidas por su material, uso y presencia.", title: "Selección con criterio" },
];

const defaultHighlights = [
  { description: "Materiales agradables al tacto y elegidos para el uso cotidiano.", title: "Materia honesta" },
  { description: "Una paleta serena que convive con distintos ambientes.", title: "Calma visual" },
  { description: "Cuidados simples para disfrutar la pieza durante más tiempo.", title: "Hecho para durar" },
];

const faqs = [
  { answer: "Si el producto está en stock, coordinamos el envío o retiro una vez confirmada la compra.", question: "¿Cómo coordino la entrega?" },
  { answer: "En productos por encargo te confirmamos disponibilidad y tiempos antes de avanzar.", question: "¿Qué significa por encargo?" },
  { answer: "Las medidas, materiales y cuidados están detallados en esta página. Si necesitás otra referencia, escribinos antes de comprar.", question: "¿Cómo elijo la pieza indicada?" },
];

const reviews = [
  { comment: "La atención fue muy clara y el producto llegó impecable. Se nota el cuidado en cada detalle.", name: "Camila R." },
  { comment: "La textura y el color eran tal como se veían. Quedó precioso en casa.", name: "Sofía M." },
  { comment: "Muy linda presentación, todo prolijo y con una estética serena.", name: "Martina L." },
];

function SectionHeading({ eyebrow, title, description }: { description?: string; eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="vita-label">{eyebrow}</p>
      <h2 className="font-display text-[2rem] leading-tight text-foreground sm:text-[2.55rem]">{title}</h2>
      {description ? <p className="text-base leading-7 text-secondary">{description}</p> : null}
    </div>
  );
}

function LeafMark({ index }: { index: number }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background text-[var(--accent-secondary)]">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
        <path d={index % 2 === 0 ? "M18.5 5.5C12 5.5 7.5 9.3 7.5 15.5c5.7.5 10-3.5 11-10Z" : "M5.5 18.5c6.5 0 11-3.8 11-10-5.7-.5-10 3.5-11 10Z"} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 19c3.7-5 7.5-8.3 12-12" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function ProductQuickBenefits() {
  return (
    <section className="grid gap-6 border-y border-border py-8 sm:grid-cols-3">
      {quickBenefits.map((benefit, index) => (
        <div className="flex gap-4" key={benefit.title}>
          <LeafMark index={index} />
          <div><h2 className="font-display text-xl text-foreground">{benefit.title}</h2><p className="mt-1 text-sm leading-6 text-secondary">{benefit.description}</p></div>
        </div>
      ))}
    </section>
  );
}

export function ProductLifestyleGallery({ product }: { product: PublicProduct }) {
  return (
    <section className="space-y-8 py-4">
      <SectionHeading eyebrow="En casa" title="Materia, luz y una forma tranquila de habitar" description={product.shortDescription} />
      <div className="grid gap-3 md:grid-cols-4 md:grid-rows-[220px_220px] lg:grid-rows-[260px_260px]">
        {lifestyleImages.map((image, index) => (
          <div className={`relative overflow-hidden bg-background-alt ${index === 0 ? "min-h-[360px] md:col-span-2 md:row-span-2" : "min-h-[220px]"}`} key={image.src}>
            <Image alt={image.alt} className="object-cover transition-transform duration-500 hover:scale-[1.015] motion-reduce:transition-none motion-reduce:hover:scale-100" fill quality={90} sizes={index === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} src={image.src} />
          </div>
        ))}
      </div>
    </section>
  );
}

function getProductHighlights(product: PublicProduct) {
  if (product.specifications.length > 0) {
    return product.specifications.slice(0, 3).map((item) => ({ description: item.value, title: item.label }));
  }
  return defaultHighlights;
}

export function ProductDescriptionStory({ product }: { product: PublicProduct }) {
  const highlights = getProductHighlights(product);
  return (
    <section className="grid gap-10 border-y border-border py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div><p className="vita-label">Detalles</p><h2 className="mt-4 font-display text-[2rem] leading-tight text-foreground sm:text-[2.55rem]">Pensado para acompañar tu casa</h2><p className="mt-5 max-w-xl text-base leading-8 text-secondary">{product.description}</p></div>
      <div className="grid gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-1">
        {highlights.map((highlight, index) => (
          <article className="bg-surface p-5" key={`${highlight.title}-${index}`}>
            <div className="flex items-center gap-3"><LeafMark index={index} /><h3 className="font-display text-xl text-foreground">{highlight.title}</h3></div>
            <p className="mt-3 text-sm leading-6 text-secondary">{highlight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CompleteStyleSection({ product, relatedProducts }: ProductEditorialSectionsProps) {
  const products = [product, ...relatedProducts].slice(0, 4);
  if (products.length === 0) return null;
  return (
    <section className="border border-border bg-background-alt p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Selección editorial" title="Piezas que conviven bien" description="Una combinación de texturas y objetos para construir el ambiente de a poco." />
        <Link className={buttonStyles({ size: "md", variant: "secondary" })} href="/tienda">Ver tienda</Link>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((item) => (
          <Link className="group" href={`/producto/${item.slug}`} key={item.id}>
            <div className="relative aspect-[4/5] overflow-hidden bg-surface">{item.primaryImage?.url ? <Image alt={item.primaryImage.alt} className="object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none" fill sizes="(min-width: 1024px) 22vw, 50vw" src={item.primaryImage.url} /> : null}</div>
            <h3 className="mt-3 font-display text-xl text-foreground group-hover:text-primary">{item.name}</h3>
            <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProductFaqSection() {
  return (
    <section className="grid gap-8 py-4 lg:grid-cols-[0.85fr_1.15fr]">
      <SectionHeading eyebrow="Antes de elegir" title="Respuestas simples" />
      <div className="border-t border-border">{faqs.map((faq) => <details className="group border-b border-border py-5" key={faq.question}><summary className="cursor-pointer list-none font-display text-xl text-foreground group-open:text-primary">{faq.question}</summary><p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">{faq.answer}</p></details>)}</div>
    </section>
  );
}

function ReviewStars() {
  return <span aria-label="5 de 5 estrellas" className="text-[var(--accent-secondary)]">★★★★★</span>;
}

export function ProductReviewsSection() {
  return (
    <section className="space-y-8 border-t border-border pt-12">
      <SectionHeading eyebrow="Opiniones" title="Casas que ya sumaron VITA" description="Historias de quienes eligieron sumar textura, calma y detalle a sus espacios." />
      <div className="grid gap-px border border-border bg-border md:grid-cols-3">
        {reviews.map((review) => <article className="bg-surface p-6" key={review.name}><ReviewStars /><p className="mt-4 text-base leading-7 text-secondary">“{review.comment}”</p><p className="mt-5 font-semibold text-foreground">{review.name}</p></article>)}
      </div>
    </section>
  );
}