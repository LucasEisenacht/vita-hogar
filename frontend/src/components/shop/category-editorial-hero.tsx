import Image from "next/image";
import Link from "next/link";
import { SparkleMark } from "@/components/brand/brand-marks";
import { CategoryChips } from "@/components/shop/category-chips";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { CatalogEditorialExperience } from "@/config/catalog-editorial";

type CategoryEditorialHeroProps = {
  activeChipHref?: string;
  experience: CatalogEditorialExperience;
};

const accentDotClassNames: Record<CatalogEditorialExperience["accent"], string> = {
  blush: "bg-primary/35",
  champagne: "bg-[#d8b98a]/45",
  cream: "bg-[#f0d9b7]/50",
  lavender: "bg-[#cbb7ea]/55",
  rose: "bg-primary/40",
};

const desktopImagePositionClassNames: Record<string, string> = {
  accesorios: "object-[center_48%]",
  celulares: "object-[center_42%]",
  combos: "object-[center_46%]",
  consolas: "object-[center_48%]",
  fundas: "object-center",
  "pop-socket": "object-center",
  tienda: "object-[center_52%]",
};

const mobileImagePositionClassNames: Record<string, string> = {
  accesorios: "object-[center_52%]",
  celulares: "object-[center_48%]",
  combos: "object-[center_52%]",
  consolas: "object-[center_55%]",
  fundas: "object-[center_52%]",
  "pop-socket": "object-[center_52%]",
  tienda: "object-[center_52%]",
};

const benefits = [
  "Envios a todo el pais",
  "Compra protegida",
  "Productos seleccionados",
] as const;

function BenefitIcon({ index }: { index: number }) {
  if (index === 1) {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 3.75 19 6v5.5c0 4.6-2.85 7.55-7 8.75-4.15-1.2-7-4.15-7-8.75V6l7-2.25Z"
          strokeLinejoin="round"
        />
        <path d="m8.75 12 2 2 4.75-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        viewBox="0 0 24 24"
      >
        <path
          d="m12 4.75 1.6 4.3 4.45.2-3.45 2.75 1.15 4.5L12 14.05 8.25 16.5l1.15-4.5-3.45-2.75 4.45-.2L12 4.75Z"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      <path d="M4.75 15.5h9.5V7.75h-9.5v7.75Z" strokeLinejoin="round" />
      <path d="M14.25 10.25h2.9l2.1 2.65v2.6h-5" strokeLinejoin="round" />
      <path d="M7.5 18.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM16.5 18.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />
    </svg>
  );
}

export function CategoryEditorialHero({
  activeChipHref,
  experience,
}: CategoryEditorialHeroProps) {
  return (
    <section className="bg-transparent pb-0 pt-2.5 sm:pt-6 lg:pt-7">
      <Container className="max-w-[1320px] space-y-2.5 sm:space-y-4">
        <nav
          aria-label="Breadcrumb"
          className="hidden px-1 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-[#8d7b78] sm:block md:text-[0.7rem]"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                className="transition-colors duration-[220ms] hover:text-primary-hover/85"
                href="/"
              >
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              {experience.key === "tienda" ? (
                <span aria-current="page" className="font-semibold text-foreground">
                  Tienda
                </span>
              ) : (
                <Link
                  className="transition-colors duration-[220ms] hover:text-primary-hover/85"
                  href="/tienda"
                >
                  Tienda
                </Link>
              )}
            </li>
            {experience.key !== "tienda" ? (
              <>
                <li aria-hidden="true">/</li>
                <li
                  aria-current="page"
                  className="font-semibold text-foreground"
                >
                  {experience.breadcrumbLabel}
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <div
          className={`storefront-panel relative isolate overflow-hidden rounded-[26px] border-white/54 p-0 shadow-[0_16px_46px_rgba(74,55,47,0.07)] sm:min-h-[284px] sm:rounded-[32px] sm:px-6 sm:py-6 lg:min-h-[372px] lg:px-9 lg:py-8 ${experience.backgroundClassName}`}
        >
          <div className="relative h-[190px] w-full overflow-hidden rounded-t-[26px] sm:hidden">
            {experience.image ? (
              <Image
                alt={experience.image.alt}
                className={`h-full w-full object-cover ${
                  mobileImagePositionClassNames[experience.key] ??
                  "object-[center_52%]"
                }`}
                fill
                priority={experience.key === "tienda"}
                quality={95}
                sizes="100vw"
                src={experience.image.src}
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(135deg,rgba(255,245,249,0.96),rgba(248,222,232,0.9))]" />
            )}
          </div>

          {experience.image ? (
            <Image
              alt={experience.image.alt}
              className={`absolute inset-0 z-0 hidden h-full w-full object-cover sm:block ${
                desktopImagePositionClassNames[experience.key] ?? "object-center"
              }`}
              fill
              priority={experience.key === "tienda"}
              quality={95}
              sizes="(min-width: 1280px) 1320px, 100vw"
              src={experience.image.src}
            />
          ) : null}
          <div className="absolute inset-0 z-10 hidden bg-[radial-gradient(ellipse_at_24%_48%,rgba(255,250,248,0.82)_0%,rgba(255,246,244,0.56)_27%,rgba(251,225,235,0.14)_50%,rgba(255,250,248,0)_74%),linear-gradient(90deg,rgba(255,250,248,0.46)_0%,rgba(255,250,248,0.22)_30%,rgba(255,250,248,0.05)_58%,rgba(255,250,248,0)_82%)] sm:block" />
          <div className="absolute inset-0 z-10 hidden bg-[linear-gradient(180deg,rgba(255,250,248,0.2)_0%,rgba(255,250,248,0)_44%,rgba(252,232,239,0.18)_100%)] sm:block" />
          <SparkleMark className="pointer-events-none absolute right-6 top-6 z-20 hidden h-5 w-5 text-primary-hover opacity-30 sm:block sm:right-8 sm:top-8 sm:h-6 sm:w-6" />
          <span
            aria-hidden="true"
            className={`absolute -bottom-20 -left-16 z-20 hidden h-60 w-60 rounded-full blur-3xl sm:block ${accentDotClassNames[experience.accent]}`}
          />
          <div className="relative z-20 flex flex-col px-5 py-[18px] max-sm:bg-[linear-gradient(180deg,rgba(255,247,249,0.98),rgba(255,238,244,0.96))] sm:min-h-[232px] sm:max-w-[620px] sm:justify-center sm:gap-4 sm:bg-transparent sm:p-0 lg:min-h-[308px]">
            <div className="animate-[wtodocell-page-enter_420ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none sm:space-y-3.5">
              <span className="mb-2.5 inline-flex h-[30px] w-fit items-center rounded-full border border-primary/20 bg-white/52 px-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-hover shadow-[0_8px_18px_rgba(207,142,168,0.06)] backdrop-blur-md sm:mb-0 sm:h-auto sm:px-2.5 sm:py-1 sm:text-[0.7rem] sm:tracking-[0.2em]">
                {experience.eyebrow}
              </span>
              <div className="sm:space-y-3">
                <h1 className="m-0 w-full font-display text-[clamp(30px,8.5vw,36px)] font-semibold leading-[0.98] tracking-[-0.035em] text-[#2f2529] sm:text-[2.65rem] sm:leading-[1.01] sm:tracking-normal sm:text-foreground lg:text-[3.55rem]">
                  {experience.title}
                </h1>
                <p className="mt-2.5 text-[15px] leading-[1.45] text-[#6a555d] sm:mt-0 sm:max-w-lg sm:text-[0.95rem] sm:leading-7 sm:text-[#5f4f55]">
                  {experience.description}
                </p>
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:mt-0 sm:gap-2.5">
                <Link
                  className={buttonStyles({
                    className: "h-11 min-h-0 px-[18px] text-sm sm:min-h-11 sm:px-4 sm:text-[0.82rem]",
                    size: "sm",
                    variant: "primary",
                  })}
                  href="#catalog-products"
                >
                  Ver productos
                </Link>
                <Link
                  className={buttonStyles({
                    className: "h-11 min-h-0 px-[18px] text-sm sm:min-h-11 sm:px-4 sm:text-[0.82rem]",
                    size: "sm",
                    variant: "secondary",
                  })}
                  href={experience.featuredLink?.href ?? activeChipHref ?? "/tienda"}
                >
                  Explorar coleccion
                </Link>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-0 sm:max-w-xl sm:grid-cols-3 sm:gap-2">
              {benefits.map((benefit, index) => (
                <div
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-[14px] border border-primary/14 bg-primary/8 px-2.5 py-1.5 text-[11px] font-semibold text-[#715f65] [&_svg]:h-3 [&_svg]:w-3 sm:min-h-8 sm:rounded-[18px] sm:border-white/28 sm:bg-white/12 sm:text-[0.7rem] sm:backdrop-blur-sm sm:[&_svg]:h-3.5 sm:[&_svg]:w-3.5 ${
                    index === 2 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                  key={benefit}
                >
                  <span className="text-primary-hover/55">
                    <BenefitIcon index={index} />
                  </span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <CategoryChips activeHref={activeChipHref} chips={experience.chips} />
          <div className="h-4 bg-[linear-gradient(180deg,rgba(255,250,248,0),rgba(255,241,246,0.42)_54%,rgba(255,250,248,0))] sm:h-20" />
        </div>
      </Container>
    </section>
  );
}
