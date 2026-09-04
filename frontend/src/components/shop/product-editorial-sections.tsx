import Image from "next/image";
import type { PublicProduct } from "@/lib/catalog/types";
import { formatCurrency } from "@/lib/format-currency";
import { buttonStyles } from "@/components/ui/button";

type ProductEditorialSectionsProps = {
  product: PublicProduct;
  relatedProducts: Array<PublicProduct>;
};

const lifestyleImages = [
  {
    alt: "Escena lifestyle W.todocell con accesorios premium.",
    src: "/images/lifestyle/lifestyle-01.webp",
  },
  {
    alt: "Detalle editorial W.todocell en tonos suaves.",
    src: "/images/lifestyle/lifestyle-02.webp",
  },
  {
    alt: "Tecnologia y accesorios con estetica W.todocell.",
    src: "/images/lifestyle/lifestyle-03.webp",
  },
  {
    alt: "Packaging y experiencia visual W.todocell.",
    src: "/images/lifestyle/lifestyle-04.webp",
  },
];

const quickBenefits = [
  {
    description: "Despachos coordinados y opciones para todo el pais.",
    title: "Envios rapidos",
  },
  {
    description: "Compra protegida y acompanamiento en cada paso.",
    title: "Compra segura",
  },
  {
    description: "Productos seleccionados con respaldo y atencion real.",
    title: "Garantia oficial",
  },
];

const defaultHighlights = [
  {
    description: "Pensado para sumar proteccion y mantener una estetica limpia.",
    title: "Proteccion diaria",
  },
  {
    description: "Terminacion suave, moderna y facil de combinar.",
    title: "Soft touch premium",
  },
  {
    description: "Seleccionado para integrarse con accesorios del catalogo.",
    title: "Look completo",
  },
];

const faqs = [
  {
    answer:
      "Si el producto esta en stock, coordinamos el envio o retiro una vez confirmada la compra.",
    question: "Como coordino la entrega?",
  },
  {
    answer:
      "En productos por encargo te confirmamos disponibilidad y tiempos antes de avanzar.",
    question: "Que significa por encargo?",
  },
  {
    answer:
      "Si tenes dudas de compatibilidad, escribinos antes de comprar y lo revisamos con vos.",
    question: "Como confirmo si es compatible?",
  },
];

const reviews = [
  {
    comment:
      "La atencion fue super clara y el producto llego impecable. Se nota el cuidado en los detalles.",
    name: "Camila R.",
  },
  {
    comment:
      "Me ayudaron a elegir el modelo correcto y quedo hermoso con mi celular.",
    name: "Sofia M.",
  },
  {
    comment:
      "Muy linda presentacion, todo prolijo y con una estetica re delicada.",
    name: "Martina L.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
        {eyebrow}
      </p>
      <h2 className="font-display text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.55rem]">
        {title}
      </h2>
      {description ? (
        <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function IconMark({ index }: { index: number }) {
  const paths = [
    "M12 4.5v15M4.5 12h15M7.4 7.4l9.2 9.2M16.6 7.4l-9.2 9.2",
    "M6 12.4 9.8 16 18 7.8",
    "M12 4.75 14.35 9.6l5.35.78-3.88 3.78.92 5.34L12 16.98 7.26 19.5l.92-5.34L4.3 10.38l5.35-.78L12 4.75Z",
  ];

  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/62 bg-white/52 text-primary-hover shadow-[0_10px_24px_rgba(74,55,47,0.045)] backdrop-blur-sm">
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill={index === 2 ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path
          d={paths[index % paths.length]}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ProductQuickBenefits() {
  return (
    <section className="grid gap-5 border-y border-white/48 py-7 sm:grid-cols-3 lg:py-8">
      {quickBenefits.map((benefit, index) => (
        <div className="flex gap-4" key={benefit.title}>
          <IconMark index={index} />
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {benefit.title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {benefit.description}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function ProductLifestyleGallery({ product }: { product: PublicProduct }) {
  return (
    <section className="space-y-8 py-3">
      <SectionHeading
        eyebrow="Lifestyle"
        title="Una experiencia pensada para verse bien"
        description={product.shortDescription}
      />
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[210px_210px] lg:grid-rows-[248px_248px]">
        {lifestyleImages.map((image, index) => (
          <div
            className={`relative overflow-hidden rounded-[30px] border border-white/55 bg-white/28 shadow-[0_18px_46px_rgba(74,55,47,0.055)] ${
              index === 0
                ? "min-h-[360px] md:col-span-2 md:row-span-2"
                : "min-h-[220px]"
            }`}
            key={image.src}
          >
            <Image
              alt={image.alt}
              className="object-cover transition-transform duration-[500ms] hover:scale-[1.025] motion-reduce:transition-none motion-reduce:hover:scale-100"
              fill
              quality={92}
              sizes={
                index === 0
                  ? "(min-width: 1024px) 50vw, 100vw"
                  : "(min-width: 1024px) 25vw, 50vw"
              }
              src={image.src}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function getProductHighlights(product: PublicProduct) {
  const technicalHighlights = Object.entries(product.technicalDetails)
    .slice(0, 3)
    .map(([title, description]) => ({
      description,
      title: title
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\w/, (letter) => letter.toUpperCase()),
    }));

  if (technicalHighlights.length > 0) {
    return technicalHighlights;
  }

  if (product.specifications.length > 0) {
    return product.specifications.slice(0, 3).map((specification) => ({
      description: specification.value,
      title: specification.label,
    }));
  }

  return defaultHighlights;
}

export function ProductDescriptionStory({ product }: { product: PublicProduct }) {
  const highlights = getProductHighlights(product);

  return (
    <section className="grid gap-8 py-3 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
          Detalles
        </p>
        <h2 className="font-display text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.55rem]">
          Dise&ntilde;ado para acompa&ntilde;ar tu dia
        </h2>
        {product.description ? (
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            {product.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {highlights.map((highlight, index) => (
          <article
            className="rounded-[28px] border border-white/55 bg-white/36 p-5 shadow-[0_14px_38px_rgba(74,55,47,0.045)] backdrop-blur-sm"
            key={`${highlight.title}-${index}`}
          >
            <div className="mb-5">
              <IconMark index={index} />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              {highlight.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {highlight.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CompleteStyleSection({
  product,
  relatedProducts,
}: ProductEditorialSectionsProps) {
  const bundleProducts = [product, ...relatedProducts].slice(0, 4);

  if (bundleProducts.length === 0) {
    return null;
  }

  const totalPrice = bundleProducts.reduce((total, item) => total + item.price, 0);
  const savings = Math.round(totalPrice * 0.08);
  const finalPrice = totalPrice - savings;

  return (
    <section className="rounded-[34px] border border-white/56 bg-[linear-gradient(135deg,rgba(255,253,251,0.64),rgba(255,232,240,0.28))] p-5 shadow-[0_18px_46px_rgba(74,55,47,0.05)] backdrop-blur-sm sm:p-7 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
        <div className="space-y-6">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
              Set editorial
            </p>
            <h2 className="font-display text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.55rem]">
              Complet&aacute; tu estilo
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Una combinacion visual preparada para imaginar el look completo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {bundleProducts.map((item) => (
              <article
                className="rounded-[24px] border border-white/58 bg-white/42 p-3 shadow-[0_12px_30px_rgba(74,55,47,0.045)]"
                key={item.id}
              >
                <div className="relative aspect-square overflow-hidden rounded-[20px] bg-surface-soft">
                  {item.primaryImage?.url ? (
                    <Image
                      alt={item.primaryImage.alt}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1280px) 220px, (min-width: 640px) 40vw, 100vw"
                      src={item.primaryImage.url}
                    />
                  ) : null}
                </div>
                <h3 className="mt-3 line-clamp-2 font-display text-base font-semibold text-foreground">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-primary-hover">
                  {formatCurrency(item.price)}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/62 bg-white/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]">
          <div className="space-y-3">
            <div className="flex justify-between gap-4 text-sm text-muted-foreground">
              <span>Precio individual</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm text-muted-foreground">
              <span>Ahorro estimado</span>
              <span className="font-semibold text-success">
                {formatCurrency(savings)}
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Total del set
              </p>
              <p className="font-display text-3xl font-semibold text-foreground">
                {formatCurrency(finalPrice)}
              </p>
            </div>
          </div>
          <button
            className={buttonStyles({
              className: "mt-5 w-full",
              size: "lg",
              variant: "primary",
            })}
            type="button"
          >
            Agregar todo al carrito
          </button>
        </div>
      </div>
    </section>
  );
}

export function ProductFaqSection() {
  return (
    <section className="grid gap-8 py-3 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
          Preguntas frecuentes
        </p>
        <h2 className="font-display text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.45rem]">
          Respuestas simples antes de comprar
        </h2>
      </div>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details
            className="group rounded-[24px] border border-white/58 bg-white/38 p-5 shadow-[0_12px_30px_rgba(74,55,47,0.04)]"
            key={faq.question}
          >
            <summary className="cursor-pointer list-none font-display text-lg font-semibold text-foreground transition-colors duration-[220ms] group-open:text-primary-hover">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ReviewStars() {
  return (
    <span className="flex items-center gap-1 text-primary-hover">
      {[0, 1, 2, 3, 4].map((star) => (
        <svg
          aria-hidden="true"
          className="h-4 w-4 fill-current"
          key={star}
          viewBox="0 0 20 20"
        >
          <path d="m10 1.8 2.45 5.04 5.55.79-4.02 3.92.95 5.53L10 14.47l-4.93 2.61.95-5.53L2 7.63l5.55-.79L10 1.8Z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductReviewsSection() {
  return (
    <section className="space-y-8 py-3">
      <SectionHeading
        eyebrow="Opiniones"
        title="Experiencias con mirada W.todocell"
        description="Un bloque preparado para mostrar reviews con identidad visual, foto y contexto cuando el sistema de opiniones este conectado."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((review, index) => (
          <article
            className="rounded-[30px] border border-white/58 bg-white/40 p-5 shadow-[0_16px_40px_rgba(74,55,47,0.045)] backdrop-blur-sm"
            key={review.name}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-secondary">
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="48px"
                  src={lifestyleImages[index % lifestyleImages.length].src}
                />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  {review.name}
                </h3>
                <ReviewStars />
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {review.comment}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
