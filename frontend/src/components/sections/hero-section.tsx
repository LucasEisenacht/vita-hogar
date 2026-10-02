import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { HomeContentHero } from "@/lib/home-content/types";

export function HeroSection({ content }: { content: HomeContentHero }) {
  if (!content.isActive) return null;

  const desktopImageIsRemote = /^https?:\/\//.test(content.desktopImageUrl);
  const mobileImageIsRemote = /^https?:\/\//.test(content.mobileImageUrl);

  return (
    <section aria-label="Presentación VITA HOGAR" className="vita-home-hero overflow-hidden bg-background py-10 sm:py-14 lg:py-20">
      <Container>
        <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-4 xl:gap-10">
          <div className="relative z-10 max-w-xl py-2 sm:py-6 lg:py-14">
            <p className="vita-label">{content.badge}</p>
            <h1 className="mt-6 max-w-[12ch] font-display text-[3.1rem] leading-[0.98] tracking-[-0.042em] text-foreground sm:text-[4rem] lg:text-[4.5rem] xl:text-[5rem]">{content.title}</h1>
            <p className="mt-6 max-w-[27rem] text-lg leading-8 text-text-secondary sm:text-xl">{content.subtitle}</p>
            <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link className={buttonStyles({ className: "vita-home-hero__primary-cta", size: "md" })} href={content.primaryCtaHref}>{content.primaryCtaLabel}</Link>
              {content.secondaryCtaHref && content.secondaryCtaLabel ? (
                <Link className="vita-home-hero__secondary-cta inline-flex min-h-12 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={content.secondaryCtaHref}>{content.secondaryCtaLabel}</Link>
              ) : null}
            </div>
          </div>

          <div className="relative min-w-0 lg:min-h-[42rem]">
            <div className="relative aspect-[4/3] overflow-hidden bg-background-alt sm:aspect-[5/4] lg:absolute lg:right-0 lg:top-0 lg:h-[88%] lg:w-[78%] lg:aspect-auto">
              <Image
                alt="Dormitorio cálido con lino, textiles y luz natural."
                className="hidden object-cover sm:block"
                fill
                priority
                sizes="(min-width: 1280px) 43vw, (min-width: 1024px) 47vw, 100vw"
                src={content.desktopImageUrl}
                style={{ objectPosition: "50% 50%" }}
                unoptimized={desktopImageIsRemote}
              />
              <Image
                alt="Dormitorio cálido con lino, textiles y luz natural."
                className="object-cover sm:hidden"
                fill
                priority
                sizes="100vw"
                src={content.mobileImageUrl}
                style={{ objectPosition: "50% 50%" }}
                unoptimized={mobileImageIsRemote}
              />
            </div>

            <div className="absolute bottom-8 left-[3%] hidden aspect-[4/5] w-[38%] overflow-hidden border-[10px] border-background bg-background-alt shadow-[0_18px_42px_rgba(73,57,43,0.14)] lg:block">
              <Image
                alt="Florero de cerámica y vela sobre madera cálida."
                className="object-cover"
                fill
                sizes="(min-width: 1280px) 18vw, 20vw"
                src="/images/vita/vase-candle-editorial.webp"
              />
            </div>

            <p className="mt-4 flex items-center justify-end gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary lg:absolute lg:bottom-7 lg:right-[1%] lg:mt-0">
              <span aria-hidden="true" className="h-px w-10 bg-primary/45" />
              Nueva colección · 2026
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
