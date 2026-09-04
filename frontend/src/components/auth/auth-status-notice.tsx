"use client";

import { useEffect } from "react";

type AuthStatusNoticeProps = {
  text: string;
  title: string;
  variant?: "error" | "success";
};

export function AuthStatusNotice({
  text,
  title,
  variant = "success",
}: AuthStatusNoticeProps) {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("email-confirmado");
    currentUrl.searchParams.delete("error");

    window.history.replaceState(
      window.history.state,
      "",
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
  }, []);

  const isError = variant === "error";

  return (
    <div
      aria-live="polite"
      className={`rounded-[24px] border p-4 text-sm leading-6 ${
        isError
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-primary/24 bg-secondary/56 text-primary-hover"
      }`}
      role="status"
    >
      <p className="font-display text-base font-semibold text-foreground">
        {title}
      </p>
      <p className="mt-1 text-muted-foreground">{text}</p>
    </div>
  );
}
