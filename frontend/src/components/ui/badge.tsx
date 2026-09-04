import type { HTMLAttributes } from "react";

export type BadgeVariant = "default" | "new" | "sale" | "stock" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-secondary text-primary-hover",
  new: "bg-surface text-primary-hover shadow-[0_10px_24px_rgba(74,55,47,0.08)]",
  sale: "bg-[#f7e7df] text-[#9a6555]",
  stock: "bg-[#edf5ef] text-[#5f8469]",
  neutral: "bg-muted text-muted-foreground",
};

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
