"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { HomeContentHero } from "@/lib/home-content/types";

type HeroSectionProps = {
  content: HomeContentHero;
};

type HeroSlide = {
  accentClassName: string;
  description: string;
  eyebrow: string;
  imageAlt: string;
  imageSrc: string;
  mobileObjectPosition: string;
  objectPosition: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
  title: string;
};

const slideDurationMs = 8000;
const heroImageSizes = "100vw";

const heroBenefits = [
  "Envios a todo el pais",
  "Compra segura",
  "Atencion personalizada",
];

const heroSlides: Array<HeroSlide> = [
  {
    accentClassName: "bg-[#d8b98a] text-[#4a372f] hover:bg-[#caa679]",
    description:
      "Celulares y accesorios elegidos para acompanarte todos los dias.",
    eyebrow: "CELULARES",
    imageAlt: "Celulares y accesorios W.todocell en una composicion editorial.",
    imageSrc: "/images/hero/hero-celulares.webp",
    mobileObjectPosition: "62% 50%",
    objectPosition: "center",
    primaryAction: {
      href: "/tienda/celulares",
      label: "Ver celulares",
    },
    secondaryAction: {
      href: "/tienda/accesorios",
      label: "Ver accesorios",
    },
    title: "Tecnologia que combina con vos",
  },
  {
    accentClassName: "bg-[#bca7dc] text-white hover:bg-[#a990d0]",
    description:
      "Consolas y accesorios para llevar tu experiencia al siguiente nivel.",
    eyebrow: "GAMING",
    imageAlt: "Productos gaming y consola en una composicion premium.",
    imageSrc: "/images/hero/hero-gaming.webp",
    mobileObjectPosition: "64% 50%",
    objectPosition: "center",
    primaryAction: {
      href: "/tienda/consolas",
      label: "Ver gaming",
    },
    secondaryAction: {
      href: "/tienda",
      label: "Explorar productos",
    },
    title: "Gaming, pero con estilo",
  },
  {
    accentClassName: "bg-[#d9a0af] text-white hover:bg-[#ca8d9f]",
    description:
      "Elegi combinaciones practicas y ahorra en tus accesorios favoritos.",
    eyebrow: "COMBOS",
    imageAlt: "Combo editorial W.todocell con accesorios seleccionados.",
    imageSrc: "/images/hero/hero-combos.webp",
    mobileObjectPosition: "62% 50%",
    objectPosition: "center",
    primaryAction: {
      href: "/tienda/combos",
      label: "Ver combos",
    },
    secondaryAction: {
      href: "/tienda",
      label: "Ver tienda",
    },
    title: "Todo lo que necesitas, en un solo combo",
  },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function HeroSection({ content }: HeroSectionProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSlide = heroSlides[activeSlideIndex] ?? heroSlides[0];
  const shouldAutoRotate =
    content.isActive && !prefersReducedMotion && isDocumentVisible;

  const indicatorLabel = useMemo(
    () => `Slide ${activeSlideIndex + 1} de ${heroSlides.length}`,
    [activeSlideIndex],
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!shouldAutoRotate) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveSlideIndex((currentIndex) =>
        currentIndex === heroSlides.length - 1 ? 0 : currentIndex + 1,
      );
    }, slideDurationMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldAutoRotate, timerResetKey]);

  if (!content.isActive) {
    return null;
  }

  function showSlide(nextIndex: number) {
    setActiveSlideIndex(nextIndex);
    setTimerResetKey((currentKey) => currentKey + 1);
  }

  return (
    <section
      aria-label="Promociones principales de W.todocell"
      className="relative isolate mb-2 overflow-hidden bg-[#fff3f1] text-foreground"
    >
      <div className="absolute inset-0 hidden overflow-hidden md:block">
        {heroSlides.map((slide, index) => {
          const isActive = index === activeSlideIndex;

          return (
            <div
              aria-hidden="true"
              className={`absolute inset-0 transition-opacity ease-out motion-reduce:transition-none ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              key={slide.imageSrc}
              style={{
                transitionDuration: prefersReducedMotion ? "1ms" : "1000ms",
              }}
            >
              <Image
                alt=""
                className="object-cover"
                fill
                priority={index === 0}
                quality={95}
                sizes={heroImageSizes}
                src={slide.imageSrc}
                style={{ objectPosition: slide.objectPosition }}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 top-0 h-[40%] bg-[linear-gradient(180deg,rgba(255,243,241,0.96)_0%,rgba(255,243,241,0.68)_60%,rgba(255,243,241,0)_100%)] md:hidden" />
      <div className="absolute inset-y-0 left-0 hidden w-[min(36rem,38vw)] bg-[linear-gradient(90deg,rgba(255,243,241,0.95)_0%,rgba(255,243,241,0.68)_44%,rgba(255,243,241,0.08)_78%,rgba(255,243,241,0)_100%)] md:block" />
      <div className="absolute bottom-0 left-0 hidden h-24 w-[min(36rem,38vw)] bg-[linear-gradient(180deg,rgba(255,243,241,0)_0%,rgba(255,243,241,0.18)_70%,rgba(255,243,241,0.58)_100%)] md:block" />

      <Container className="relative max-w-[1460px]">
        <div className="flex flex-col justify-start pb-5 pt-20 md:min-h-[min(620px,calc(100vh-96px))] md:justify-center md:pb-8 md:pl-4 md:pt-14 lg:min-h-[min(680px,calc(100vh-86px))] lg:pl-6">
          <div className="min-h-[20rem] max-w-[520px] space-y-5 transition-opacity duration-[900ms] motion-reduce:transition-none md:min-h-0">
            <p className="inline-flex rounded-full bg-white/34 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary-hover md:px-4 md:text-xs md:tracking-[0.18em]">
              {activeSlide.eyebrow}
            </p>
            <div className="space-y-5">
              <h1 className="max-w-[11ch] font-display text-[2rem] font-semibold leading-[1.06] text-foreground min-[390px]:text-[2.25rem] md:max-w-[10ch] md:text-[3.35rem] md:leading-[1.04] lg:text-[4.2rem]">
                {activeSlide.title}
              </h1>
              <p className="max-w-[30rem] text-[0.95rem] leading-6 text-muted-foreground md:text-base md:leading-7">
                {activeSlide.description}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 min-[390px]:flex-row md:flex-row">
              <Link
                className={buttonStyles({
                  className: `w-full min-[390px]:w-auto md:w-auto ${activeSlide.accentClassName}`,
                  size: "md",
                })}
                href={activeSlide.primaryAction.href}
              >
                {activeSlide.primaryAction.label}
              </Link>
              <Link
                className={buttonStyles({
                  className:
                    "w-full border-white/54 bg-white/44 min-[390px]:w-auto md:w-auto",
                  size: "md",
                  variant: "secondary",
                })}
                href={activeSlide.secondaryAction.href}
              >
                {activeSlide.secondaryAction.label}
              </Link>
            </div>
          </div>

          <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden md:hidden">
            {heroSlides.map((slide, index) => {
              const isActive = index === activeSlideIndex;

              return (
                <div
                  aria-hidden={!isActive}
                  className={`absolute inset-0 transition-opacity ease-out motion-reduce:transition-none ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                  key={slide.imageSrc}
                  style={{
                    transitionDuration: prefersReducedMotion ? "1ms" : "1000ms",
                  }}
                >
                  <Image
                    alt={isActive ? slide.imageAlt : ""}
                    className="object-contain"
                    fill
                    priority={index === 0}
                    quality={95}
                    sizes={heroImageSizes}
                    src={slide.imageSrc}
                    style={{ objectPosition: slide.mobileObjectPosition }}
                  />
                </div>
              );
            })}
          </div>

          <ul
            className="mt-5 grid grid-cols-1 gap-2 min-[390px]:grid-cols-3 md:mt-6 md:max-w-[640px] md:grid-cols-3"
            aria-label="Beneficios"
          >
            {heroBenefits.map((benefit) => (
              <li
                className="rounded-full bg-white/30 px-3 py-1.5 text-center text-[0.72rem] font-semibold text-muted-foreground md:px-3.5 md:py-2 md:text-xs"
                key={benefit}
              >
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-3 pb-1 md:mt-10 md:gap-2 md:pt-0">
            <span className="sr-only">{indicatorLabel}</span>
            {heroSlides.map((slide, index) => {
              const isActive = index === activeSlideIndex;

              return (
                <button
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Mostrar hero ${index + 1}: ${slide.eyebrow}`}
                  className={`h-3 rounded-full transition-all duration-[350ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none md:h-2.5 ${
                    isActive
                      ? "w-12 bg-primary-hover"
                      : "w-3 bg-white/60 hover:bg-white md:w-2.5"
                  }`}
                  key={slide.eyebrow}
                  onClick={() => showSlide(index)}
                  type="button"
                />
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
