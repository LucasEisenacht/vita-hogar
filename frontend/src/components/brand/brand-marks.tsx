import type { SVGProps } from "react";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SparkleMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-primary", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" />
      <path d="M18 16.5v3M16.5 18h3" />
    </svg>
  );
}

export function HeartMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-primary", className)}
      fill="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M12 20s-6.7-4.2-8.1-8.8C3 8.2 4.8 5.7 7.5 5.7c1.7 0 3.2 1 4.5 2.8 1.3-1.8 2.8-2.8 4.5-2.8 2.7 0 4.5 2.5 3.6 5.5C18.7 15.8 12 20 12 20Z" />
    </svg>
  );
}

export function InstagramIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-current", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect height="15" rx="4" width="15" x="4.5" y="4.5" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M16.6 7.6h.01" />
    </svg>
  );
}

export function WhatsAppIcon({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      className={cn("text-current", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M5.8 18.4A8 8 0 1 1 12 20a8.4 8.4 0 0 1-3.8-.9L4 20l1-4a8 8 0 0 1 .8-9.6" />
      <path d="M9.2 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.2.7l-.4.5c.7 1.3 1.7 2.3 3 3l.5-.4c.2-.2.5-.3.7-.2l1.6.7c.3.1.4.3.4.6v.5c0 .3 0 .5-.4.7-.5.3-1.2.5-1.9.4-3.2-.5-6.2-3.5-6.7-6.7-.1-.7.1-1.4.5-1.9Z" />
    </svg>
  );
}

export function HeartDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex w-full max-w-[220px] items-center justify-center gap-3 text-primary",
        className,
      )}
    >
      <span className="h-px flex-1 bg-current opacity-35" />
      <HeartMark className="h-4 w-4 shrink-0 opacity-80" />
      <span className="h-px flex-1 bg-current opacity-35" />
    </div>
  );
}
