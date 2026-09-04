import type { SVGProps } from "react";

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function LoadingSpinner({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "h-4 w-4 animate-spin text-current motion-reduce:animate-none",
        className,
      )}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        className="opacity-80"
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}
