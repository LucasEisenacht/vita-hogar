"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Input({
  className,
  disabled,
  error,
  helperText,
  id,
  label,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      {label ? (
        <label
          className="text-sm font-semibold text-foreground"
          htmlFor={inputId}
        >
          {label}
        </label>
      ) : null}
      <input
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] ease-out placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70",
          error && "border-destructive focus:border-destructive",
          className,
        )}
        disabled={disabled}
        id={inputId}
        {...props}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-muted-foreground" id={helperId}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
