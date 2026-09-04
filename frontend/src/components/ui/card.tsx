import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
};

type CardSectionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

type CardTextProps<TElement extends HTMLElement> = HTMLAttributes<TElement> & {
  children: ReactNode;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-border bg-surface shadow-[0_22px_58px_rgba(74,55,47,0.08)] transition-all duration-[250ms] ease-out",
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-[0_28px_68px_rgba(74,55,47,0.11)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn("space-y-3 p-5 pb-4 sm:p-6 sm:pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: CardTextProps<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-display text-2xl font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: CardTextProps<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-6 text-muted-foreground/85", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: CardSectionProps) {
  return (
    <div className={cn("p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props}>
      {children}
    </div>
  );
}
