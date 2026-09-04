import Link from "next/link";
import {
  HeartMark,
  InstagramIcon,
  SparkleMark,
} from "@/components/brand/brand-marks";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { HomeContentInstagram } from "@/lib/home-content/types";

type InstagramCtaProps = {
  content: HomeContentInstagram;
};

export function InstagramCta({ content }: InstagramCtaProps) {
  if (!content.isActive) {
    return null;
  }

  return (
    <section className="bg-[linear-gradient(180deg,#fff7f1_0%,#f8e4ec_100%)] py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[48px] border border-white/65 bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(255,232,240,0.42)_62%,rgba(255,250,247,0.72)_100%)] p-6 shadow-[0_30px_84px_rgba(74,55,47,0.1)] backdrop-blur-sm sm:p-9 lg:p-12">
          <SparkleMark className="pointer-events-none absolute right-8 top-8 h-8 w-8 opacity-24" />
          <HeartMark className="pointer-events-none absolute bottom-8 left-8 hidden h-5 w-5 opacity-16 sm:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)] lg:items-center">
            <div className="max-w-xl space-y-6 text-left">
              <div
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-border bg-surface/85 text-primary-hover shadow-[0_14px_34px_rgba(74,55,47,0.07)]"
              >
                <InstagramIcon className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
                  Comunidad
                </p>
                <h2 className="font-display text-3xl font-semibold text-foreground sm:text-5xl">
                  {content.title}
                </h2>
                <p className="text-base leading-7 text-muted-foreground">
                  {content.text}
                </p>
              </div>
              <Link
                aria-label={`Abrir Instagram de ${content.username}`}
                className={buttonStyles({ className: "w-full sm:w-auto", size: "lg" })}
                href={content.buttonHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                <InstagramIcon className="h-5 w-5" />
                {content.buttonLabel}
              </Link>
            </div>

            <div className="grid min-h-[360px] grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  className={`rounded-[28px] border border-white/70 bg-surface/70 shadow-[0_18px_38px_rgba(74,55,47,0.07)] ${
                    index % 3 === 1 ? "translate-y-6" : ""
                  } ${index === 0 || index === 5 ? "bg-secondary/75" : ""}`}
                  key={index}
                >
                  <div className="m-3 h-14 rounded-2xl bg-primary/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
