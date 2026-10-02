import Image from "next/image";
import Link from "next/link";
import { BotanicalMotif } from "@/components/decorative/botanical-motif";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { HomeContentHero } from "@/lib/home-content/types";

export function HeroSection({ content }: { content: HomeContentHero }) {
  if (!content.isActive) return null;

  const desktopImageIsRemote = /^https?:\/\//.test(content.desktopImageUrl);
  const mobileImageIsRemote = /^https?:\/\//.test(content.mobileImageUrl);

  return (
    <section aria-label="Presentación VITA HOGAR" className="vita-home-hero bg-background py-6 sm:py-8 lg:py-12">
      <Container>
        <div className="vita-home-hero__frame grid overflow-hidden lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div className="vita-home-hero__media-shell">
            <div className="vita-home-hero__media relative overflow-hidden">
              <Image
                alt="Dormitorio cálido con lino, textiles y luz natural."
                className="vita-home-hero__image hidden object-cover sm:block"
                fill
                priority
                sizes="(min-width: 1024px) 56vw, 100vw"
                src={content.desktopImageUrl}
                style={{ objectFit: "cover", objectPosition: "46% 50%" }}
                unoptimized={desktopImageIsRemote}
              />
              <Image
                alt="Dormitorio cálido con lino, textiles y luz natural."
                className="vita-home-hero__image object-cover sm:hidden"
                fill
                priority
                sizes="100vw"
                src={content.mobileImageUrl}
                style={{ objectFit: "cover", objectPosition: "46% 50%" }}
                unoptimized={mobileImageIsRemote}
              />
              <BotanicalMotif className="vita-botanical-motif--hero" />
            </div>
          </div>
          <div className="vita-home-hero__content flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
            <p className="vita-label">{content.badge}</p>
            <h1 className="mt-5 max-w-[11ch] font-display text-[2.75rem] leading-[1.01] tracking-[-0.035em] text-foreground sm:text-[3.6rem] lg:text-[4rem]">{content.title}</h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-7 text-text-secondary">{content.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className={buttonStyles({ className: "vita-home-hero__primary-cta", size: "lg" })} href={content.primaryCtaHref}>{content.primaryCtaLabel}</Link>
              {content.secondaryCtaHref && content.secondaryCtaLabel ? (
                <Link className="vita-home-hero__secondary-cta inline-flex min-h-12 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={content.secondaryCtaHref}>{content.secondaryCtaLabel}</Link>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
