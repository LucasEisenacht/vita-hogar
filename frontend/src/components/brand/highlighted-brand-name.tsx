import type { HTMLAttributes } from "react";

type HighlightedBrandNameProps = HTMLAttributes<HTMLSpanElement>;

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function HighlightedBrandName({
  className,
  ...props
}: HighlightedBrandNameProps) {
  return (
    <span
      className={cn(
        "relative inline-block whitespace-nowrap bg-gradient-to-r from-[#b87990] via-primary-hover to-[#d99aae] bg-clip-text font-display font-semibold text-transparent [text-shadow:0_12px_28px_rgba(207,142,168,0.20)] after:absolute after:-bottom-1 after:left-1/2 after:h-2 after:w-[88%] after:-translate-x-1/2 after:rounded-full after:bg-primary/20 after:blur-[2px] after:content-[''] motion-safe:transition-all motion-safe:duration-[250ms] hover:motion-safe:-translate-y-0.5",
        className,
      )}
      {...props}
    >
      VITA HOGAR
    </span>
  );
}
