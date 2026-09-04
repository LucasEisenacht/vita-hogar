import type { ReactNode } from "react";
import { HeartDivider, SparkleMark } from "@/components/brand/brand-marks";
import { StorefrontPageShell } from "@/components/layout/storefront-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

type AuthCardProps = {
  children: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function AuthCard({
  children,
  description,
  eyebrow = "W.todocell",
  title,
}: AuthCardProps) {
  return (
    <StorefrontPageShell intensity="low">
    <section className="py-12 text-foreground sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-2xl">
          <Card className="storefront-panel-strong relative overflow-hidden">
            <SparkleMark className="wt-sparkle-soft pointer-events-none absolute right-8 top-8 h-8 w-8 [animation-delay:1.4s]" />
            <CardContent className="space-y-8 p-6 sm:p-10">
              <div className="space-y-4">
                <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
                  {eyebrow}
                </p>
                <div className="space-y-3">
                  <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
                    {title}
                  </h1>
                  <p className="text-base leading-7 text-muted-foreground">
                    {description}
                  </p>
                </div>
                <HeartDivider className="max-w-[180px]" />
              </div>
              {children}
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
    </StorefrontPageShell>
  );
}
