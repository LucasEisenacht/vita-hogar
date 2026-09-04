"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SVGProps } from "react";
import { buttonStyles } from "@/components/ui/button";
import { SearchDialog } from "@/components/search/search-dialog";
import { useCart } from "@/context/cart-context";

type CatalogSearchProps = {
  className?: string;
  onOpen?: () => void;
};

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

export function CatalogSearch({ className, onOpen }: CatalogSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { closeMiniCart } = useCart();

  const openSearch = useCallback(() => {
    closeMiniCart();
    onOpen?.();
    setIsOpen(true);
  }, [closeMiniCart, onOpen]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = typeof event.key === "string" ? event.key.toLowerCase() : "";
      const isSearchShortcut =
        key === "k" && (event.ctrlKey || event.metaKey);

      if (isSearchShortcut) {
        event.preventDefault();
        openSearch();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Buscar productos"
        className={buttonStyles({
          className,
          size: "icon",
          variant: "ghost",
        })}
        onClick={openSearch}
        ref={triggerRef}
        type="button"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
      <SearchDialog isOpen={isOpen} onClose={closeSearch} />
    </>
  );
}
