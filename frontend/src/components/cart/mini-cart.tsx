"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { buttonStyles } from "@/components/ui/button";
import { FreeShippingProgress } from "@/components/cart/free-shipping-progress";
import { MiniCartItem } from "@/components/cart/mini-cart-item";
import { MiniCartRecommendations } from "@/components/cart/mini-cart-recommendations";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format-currency";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function EmptyCartMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-16 w-16 text-primary-hover"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 64 64"
    >
      <path d="M19 23h26l-2.5 25h-21L19 23Z" strokeLinejoin="round" />
      <path d="M25 23a7 7 0 0 1 14 0" strokeLinecap="round" />
      <path d="M24 35h16" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function MiniCart() {
  const {
    closeMiniCart,
    isMiniCartOpen,
    items,
    lastAddedLineId,
    getLineId,
    subtotal,
    totalItems,
  } = useCart();
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (!isMiniCartOpen) {
      return;
    }

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable =
        panelRef.current?.querySelector<HTMLElement>(focusableSelector);
      firstFocusable?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMiniCart();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [closeMiniCart, isMiniCartOpen]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      closeMiniCart();
    }
  }, [closeMiniCart, pathname]);

  if (!isMiniCartOpen) {
    return null;
  }

  const productText = totalItems === 1 ? "1 producto" : `${totalItems} productos`;
  const hasItems = items.length > 0;

  return (
    <div
      className="fixed inset-0 z-[110] bg-foreground/22 backdrop-blur-[8px] animate-[wtodocell-mini-cart-overlay_240ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeMiniCart();
        }
      }}
    >
      <aside
        aria-label="Mini carrito de compras"
        aria-modal="true"
        className="vita-mini-cart ml-auto flex h-dvh w-full max-w-[460px] flex-col overflow-hidden border-l border-border bg-surface shadow-[0_16px_36px_rgba(46,41,36,0.12)] animate-[wtodocell-mini-cart-panel_320ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none sm:w-[min(460px,calc(100vw-2rem))]"
        ref={panelRef}
        role="dialog"
      >
        <header className="shrink-0 border-b border-border px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Tu carrito
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {productText}
              </p>
            </div>
            <button
              aria-label="Cerrar mini carrito"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-border bg-surface text-foreground transition-colors duration-[220ms] hover:bg-white/72 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={closeMiniCart}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
          {lastAddedLineId ? (
            <p className="mt-4 inline-flex border border-primary/22 bg-background-alt px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primary-hover animate-[wtodocell-mini-cart-confirm_240ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none">
              Agregado al carrito
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {hasItems ? (
            <div className="space-y-5">
              <FreeShippingProgress subtotal={subtotal} />
              <div className="space-y-3">
                {items.map((item) => {
                  const lineId = getLineId(item);

                  return (
                    <MiniCartItem
                      isHighlighted={lineId === lastAddedLineId}
                      item={item}
                      key={lineId}
                      onNavigate={closeMiniCart}
                    />
                  );
                })}
              </div>
              <MiniCartRecommendations
                isOpen={isMiniCartOpen}
                items={items}
                onNavigate={closeMiniCart}
              />
            </div>
          ) : (
            <div className="flex min-h-[55vh] flex-col items-center justify-center border border-border bg-background px-6 text-center">
              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-secondary/50">
                <EmptyCartMark />
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground">
                Tu carrito esta vacio
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Explorá textiles, objetos y detalles elegidos para acompañar tu casa.
              </p>
              <Link
                className={buttonStyles({
                  className: "mt-6",
                  size: "lg",
                })}
                href="/tienda"
                onClick={closeMiniCart}
              >
                Explorar productos
              </Link>
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <span className="text-sm font-semibold text-muted-foreground">
              Subtotal
            </span>
            <span className="font-display text-2xl font-semibold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="grid gap-2.5">
            <Link
              className={buttonStyles({
                className: "w-full",
                size: "lg",
              })}
              href="/checkout/inicio"
              onClick={closeMiniCart}
            >
              Finalizar compra
            </Link>
            <Link
              className={buttonStyles({
                className: "w-full",
                size: "lg",
                variant: "secondary",
              })}
              href="/carrito"
              onClick={closeMiniCart}
            >
              Ver carrito
            </Link>
            <button
              className="mx-auto w-fit rounded-full px-4 py-2 text-sm font-semibold text-primary-hover transition-colors duration-[220ms] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={closeMiniCart}
              type="button"
            >
              Seguir comprando
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
