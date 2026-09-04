"use client";

import type { ChangeEventHandler, SVGProps } from "react";

type SearchFieldProps = {
  className?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onClear?: () => void;
  placeholder?: string;
  value: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="11" cy="11" r="6.25" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

export function SearchField({
  className,
  onChange,
  onClear,
  placeholder = "Buscar",
  value,
}: SearchFieldProps) {
  const canClear = value.length > 0 && Boolean(onClear);

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label="Buscar en la tienda"
        className="h-12 w-full rounded-2xl border border-border bg-surface py-3 pl-12 pr-12 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] ease-out placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70"
        onChange={onChange}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {canClear ? (
        <button
          aria-label="Limpiar busqueda"
          className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={onClear}
          type="button"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
