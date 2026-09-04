import Link from "next/link";
import type { ReactNode } from "react";
import { SparkleMark } from "@/components/brand/brand-marks";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  message: ReactNode;
  title: ReactNode;
};

export function EmptyState({
  actionHref,
  actionLabel,
  children,
  message,
  title,
}: EmptyStateProps) {
  return (
    <Card className="storefront-panel relative overflow-hidden">
      <SparkleMark className="wt-sparkle-soft pointer-events-none absolute right-8 top-8 h-7 w-7 [animation-delay:1.6s]" />
      <span
        aria-hidden="true"
        className="wt-glow-dot bottom-9 left-10 h-3 w-3 [animation-delay:2.9s]"
      />
      <CardContent className="relative mx-auto max-w-xl space-y-5 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/60 bg-secondary/70 shadow-[0_16px_36px_rgba(207,142,168,0.12)] backdrop-blur-sm">
          <span className="h-5 w-5 rounded-full bg-primary/35 shadow-[0_0_24px_rgba(223,165,185,0.42)]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        {children}
        {actionHref && actionLabel ? (
          <Link
            className={buttonStyles({ size: "sm", variant: "primary" })}
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
