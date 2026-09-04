"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { experienceMotion, experienceOverlay } from "@/lib/experience/system";

type ExperienceOverlayProps = {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  onClose: () => void;
  panelClassName?: string;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function ExperienceOverlay({
  children,
  className = "",
  labelledBy,
  onClose,
  panelClassName = "",
}: ExperienceOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        onClose();
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
    };
  }, [onClose]);

  return (
    <div
      className={`${experienceMotion.overlayIn} fixed inset-0 z-[95] overflow-y-auto ${experienceOverlay.backdrop} ${className}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`${experienceMotion.panelIn} ${experienceOverlay.panel} ${panelClassName}`}
        ref={panelRef}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}
