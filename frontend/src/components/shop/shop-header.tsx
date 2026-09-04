import { Container } from "@/components/ui/container";
import { SparkleMark } from "@/components/brand/brand-marks";

type ShopHeaderProps = {
  children?: React.ReactNode;
  count?: number;
  eyebrow?: string;
  title: string;
  description: string;
};

export function ShopHeader({
  children,
  count,
  description,
  eyebrow = "W.todocell",
  title,
}: ShopHeaderProps) {
  return (
    <section className="bg-transparent py-8 sm:py-10">
      <Container className="max-w-[1320px] space-y-6">
        <div className="storefront-panel relative overflow-hidden rounded-[28px] px-5 py-6 sm:px-6 lg:px-8">
          <SparkleMark className="wt-sparkle-soft pointer-events-none absolute right-6 top-6 h-6 w-6 [animation-delay:1.2s]" />
          <span
            aria-hidden="true"
            className="wt-glow-dot bottom-8 right-24 hidden h-3 w-3 sm:block [animation-delay:2.8s]"
          />
          <div className="max-w-3xl space-y-3">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
              {eyebrow}
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-[3.5rem]">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {description}
            </p>
            {typeof count === "number" ? (
              <p className="inline-flex rounded-full border border-white/52 bg-white/34 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm">
                {count} productos disponibles
              </p>
            ) : null}
          </div>
        </div>
        {children}
      </Container>
    </section>
  );
}
