import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "wt-primary-button-shine bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(207,142,168,0.22)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_18px_38px_rgba(207,142,168,0.28)]",
  secondary:
    "border border-border bg-surface text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.05)] hover:-translate-y-0.5 hover:border-primary hover:bg-surface-soft hover:text-primary-hover hover:shadow-[0_14px_30px_rgba(74,55,47,0.08)]",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-soft hover:text-primary-hover",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-10 w-10 p-0",
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function buttonStyles({
  className,
  size = "md",
  variant = "primary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-all duration-[250ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  className,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ className, size, variant })}
      type={type}
      {...props}
    />
  );
}
