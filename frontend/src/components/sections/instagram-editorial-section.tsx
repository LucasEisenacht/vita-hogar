import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/brand/brand-marks";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const instagramImages = [
  {
    alt: "Escena lifestyle W.todocell con tecnologia y accesorios cotidianos.",
    className: "",
    src: "/images/lifestyle/lifestyle-01.webp",
  },
  {
    alt: "Accesorios W.todocell integrados a una rutina diaria.",
    className: "",
    src: "/images/lifestyle/lifestyle-02.webp",
  },
  {
    alt: "Detalle editorial de accesorios y tecnologia W.todocell.",
    className: "",
    src: "/images/lifestyle/lifestyle-03.webp",
  },
  {
    alt: "Inspiracion visual W.todocell con productos de tecnologia.",
    className: "",
    src: "/images/lifestyle/lifestyle-04.webp",
  },
];

export function InstagramEditorialSection() {
  return (
    <section className="relative bg-transparent py-10 sm:py-12 lg:py-16">
      <Container className="max-w-[1320px]">
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.12fr)] lg:items-center">
          <div className="max-w-md space-y-5">
            <div
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/38 text-primary-hover"
            >
              <InstagramIcon className="h-5 w-5" />
            </div>
              <div className="space-y-3">
                <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-hover">
                  Editorial
                </p>
                <h2 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-[2.35rem]">
                  Inspiracion W.todocell
                </h2>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  Tecnologia y accesorios que forman parte de tu dia.
                </p>
              </div>
            <Link
              aria-label="Ver Instagram de W.todocell"
              className={buttonStyles({ size: "md" })}
              href={siteConfig.instagram.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <InstagramIcon className="h-5 w-5" />
              Ver Instagram
            </Link>
          </div>

          <div
            aria-label="Vista editorial de publicaciones de Instagram"
            className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0"
          >
            {instagramImages.map((image, index) => (
              <Link
                aria-label="Abrir Instagram de W.todocell"
                className={`group relative aspect-square w-[72vw] max-w-[260px] shrink-0 snap-center overflow-hidden rounded-[22px] bg-surface/54 shadow-[0_10px_26px_rgba(74,55,47,0.045)] transition-all duration-[260ms] hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(74,55,47,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:w-auto md:max-w-none ${image.className}`}
                href={siteConfig.instagram.url}
                key={image.src}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Image
                  alt={image.alt}
                  className="object-cover transition-transform duration-[360ms] group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  quality={92}
                  sizes="(min-width: 1024px) 240px, 72vw"
                  src={image.src}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,251,0)_58%,rgba(74,55,47,0.18)_100%)] opacity-60 transition-opacity duration-[250ms] group-hover:opacity-45" />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
