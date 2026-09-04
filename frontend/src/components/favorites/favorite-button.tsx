"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { SVGProps } from "react";
import { toggleFavorite } from "@/lib/favorites/actions";
import { useExperience } from "@/components/experience/experience-provider";

type FavoriteButtonVariant = "icon" | "soft";

type FavoriteButtonProps = {
  className?: string;
  initialIsFavorite: boolean;
  productId: string;
  productSlug?: string;
  refreshOnChange?: boolean;
  variant?: FavoriteButtonVariant;
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function HeartIcon({
  isFilled,
  ...props
}: SVGProps<SVGSVGElement> & { isFilled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        d="M12 20.25s-7.25-4.42-8.67-9.28C2.28 7.38 4.48 4.5 7.56 4.5c1.8 0 3.29 1 4.44 2.42C13.15 5.5 14.64 4.5 16.44 4.5c3.08 0 5.28 2.88 4.23 6.47C19.25 15.83 12 20.25 12 20.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function getSafeNextPath(pathname: string, productSlug?: string) {
  const preferredPath = productSlug ? `/producto/${productSlug}` : pathname;

  if (!preferredPath.startsWith("/") || preferredPath.startsWith("//")) {
    return "/";
  }

  return preferredPath;
}

export function FavoriteButton({
  className,
  initialIsFavorite,
  productId,
  productSlug,
  refreshOnChange = false,
  variant = "icon",
}: FavoriteButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [message, setMessage] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { notify, updateWishlistCount } = useExperience();
  const nextPath = useMemo(
    () => getSafeNextPath(pathname, productSlug),
    [pathname, productSlug],
  );
  const authQuery = encodeURIComponent(nextPath);
  const label = isFavorite
    ? "Quitar de favoritos"
    : "Guardar en favoritos";

  function handleToggle() {
    setShowAuthPrompt(false);
    setMessage("");

    startTransition(async () => {
      const result = await toggleFavorite(productId);

      if (result.requiresAuth) {
        setShowAuthPrompt(true);
        setMessage(result.message);
        return;
      }

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setIsFavorite(result.isFavorite);
      setMessage(result.message);
      updateWishlistCount(result.isFavorite ? 1 : -1);
      notify(
        result.isFavorite ? "Agregado a Favoritos" : "Quitado de Favoritos",
        "success",
      );

      if (refreshOnChange) {
        router.refresh();
      }
    });
  }

  return (
    <div className={cn("relative inline-flex", variant === "soft" && "w-full")}>
      <button
        aria-label={label}
        aria-pressed={isFavorite}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-all duration-[250ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
          variant === "icon" &&
            "h-9 w-9 bg-surface/85 text-foreground hover:-translate-y-0.5 hover:bg-surface-soft hover:text-primary-hover hover:shadow-[0_12px_26px_rgba(74,55,47,0.1)]",
          variant === "soft" &&
            "h-11 w-full border border-border bg-surface px-5 text-sm text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.05)] hover:-translate-y-0.5 hover:border-primary hover:bg-surface-soft hover:text-primary-hover hover:shadow-[0_14px_30px_rgba(74,55,47,0.08)]",
          "wt-favorite-action",
          isFavorite && "text-primary-hover",
          isFavorite && "wt-favorite-action-active",
          className,
        )}
        disabled={isPending}
        onClick={handleToggle}
        type="button"
      >
        {isPending ? (
          <SpinnerIcon />
        ) : (
          <HeartIcon
            className={cn(
              "h-[18px] w-[18px] transition-transform duration-[250ms]",
              isFavorite && "scale-110 animate-[wtodocell-wishlist-pop_260ms_cubic-bezier(0.2,1.04,0.24,1)_both]",
            )}
            isFilled={isFavorite}
          />
        )}
        {variant === "soft" ? (
          <span>{isFavorite ? "Guardado" : "Guardar"}</span>
        ) : null}
      </button>

      <span className="sr-only" aria-live="polite">
        {message}
      </span>

      {showAuthPrompt ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[min(280px,calc(100vw-32px))] rounded-[24px] border border-border bg-background p-4 text-left shadow-[0_22px_55px_rgba(74,55,47,0.14)]">
          <p className="text-sm font-semibold text-foreground">
            Inici&aacute; sesi&oacute;n para guardar tus favoritos.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-[250ms] hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={`/ingresar?next=${authQuery}`}
              onClick={() => setShowAuthPrompt(false)}
            >
              Ingresar
            </Link>
            <Link
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors duration-[250ms] hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href={`/registro?next=${authQuery}`}
              onClick={() => setShowAuthPrompt(false)}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
