import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export function InstagramEditorialSection() {
  return (
    <section className="bg-surface py-12 sm:py-16 lg:py-24">
      <Container>
        <div className="grid overflow-hidden border border-border lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex min-h-72 flex-col justify-center p-7 sm:p-10 lg:p-12">
            <p className="vita-label">Inspiración</p>
            <h2 className="mt-4 max-w-md font-display text-4xl leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl">La escena importa tanto como el objeto.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-secondary">Luz natural, texturas honestas y piezas que encuentran su lugar sin apuro.</p>
            <Link className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/tienda">Ver la selección</Link>
          </div>
          <div className="relative min-h-80 bg-background-alt lg:min-h-[34rem]">
            <Image alt="Comedor cálido con lino, cerámica, fibras y ramas naturales." className="object-cover" fill sizes="(min-width: 1024px) 58vw, 100vw" src="/images/vita/shop-hero-editorial.webp" />
          </div>
        </div>
      </Container>
    </section>
  );
}