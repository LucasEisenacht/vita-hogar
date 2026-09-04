import type { SVGProps } from "react";
import { Container } from "@/components/ui/container";
import { getActiveBenefits } from "@/lib/home-content/config";
import type {
  HomeContentBenefitIcon,
  HomeContentBenefits,
} from "@/lib/home-content/types";

function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}>
      <path d="M12 3v4M12 17v4M4.2 7.5l3.4 2M16.4 14l3.4 2M19.8 7.5l-3.4 2M7.6 14l-3.4 2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function CareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}>
      <path d="M5 10.5 12 4l7 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-8Z" strokeLinejoin="round" />
      <path d="M9 14h6M9 17h4" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}>
      <path d="M4 7.5h10.5v9H4zM14.5 10.5H18l2 2v4h-5.5" strokeLinejoin="round" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
    </svg>
  );
}

function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}>
      <path d="M12 19.5s-7-4.2-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.3c0 5-7 9.2-7 9.2Z" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24" {...props}>
      <path d="M12 4.5 18 7v5.2c0 3.6-2.4 6.3-6 7.3-3.6-1-6-3.7-6-7.3V7l6-2.5Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const benefitIcons: Record<HomeContentBenefitIcon, typeof SparkIcon> = {
  care: CareIcon,
  heart: HeartIcon,
  send: SendIcon,
  shield: ShieldIcon,
  sparkle: SparkIcon,
};

type BenefitsSectionProps = {
  content: HomeContentBenefits;
};

export function BenefitsSection({ content }: BenefitsSectionProps) {
  const benefits = getActiveBenefits(content.items);

  if (benefits.length === 0) {
    return null;
  }

  return (
    <section className="bg-transparent py-8 sm:py-10 lg:py-14">
      <Container className="max-w-[1320px]">
        <div className="border-y border-primary/10 py-7 sm:py-8">
          <div className="mb-6 max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-hover">
              Experiencia de compra
            </p>
            <h2 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              {content.title}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {benefits.map((benefit) => {
              const Icon = benefitIcons[benefit.icon];

              return (
                <div
                  className="group flex gap-3.5"
                  key={benefit.title}
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/58 text-primary-hover transition-transform duration-[250ms] group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
