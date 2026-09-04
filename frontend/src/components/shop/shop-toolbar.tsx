"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  ProductAvailabilityFilter,
  ProductConditionFilter,
  ProductSort,
} from "@/lib/catalog/types";
import { Button, buttonStyles } from "@/components/ui/button";

type ShopToolbarProps = {
  actionPath: string;
  availability?: ProductAvailabilityFilter;
  categorySlug?: string;
  condition?: ProductConditionFilter;
  preserveCategoryQuery?: boolean;
  resultCount: number;
  sort: ProductSort;
};

type FilterControlsProps = {
  availability?: ProductAvailabilityFilter;
  condition?: ProductConditionFilter;
  sort: ProductSort;
};

const selectClassName =
  "h-[46px] w-full appearance-none rounded-full border border-white/54 bg-[rgba(255,250,248,0.52)] px-3.5 pr-8 text-[0.82rem] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] backdrop-blur-md transition-all duration-[240ms] hover:-translate-y-0.5 hover:border-primary/28 hover:bg-white/66 focus:outline-none focus:ring-4 focus:ring-ring/18 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:h-10";

const availabilityLabels: Record<ProductAvailabilityFilter, string> = {
  in_stock: "En stock",
  made_to_order: "Por encargo",
};

const conditionLabels: Record<ProductConditionFilter, string> = {
  new: "Nuevo",
  refurbished: "Reacondicionado",
  used: "Usado",
};

const sortLabels: Record<ProductSort, string> = {
  featured: "Destacados",
  name: "Nombre",
  newest: "Mas recientes",
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
};

function HiddenCategoryInput({
  categorySlug,
  preserveCategoryQuery,
}: Pick<ShopToolbarProps, "categorySlug" | "preserveCategoryQuery">) {
  return preserveCategoryQuery && categorySlug ? (
    <input name="categoria" type="hidden" value={categorySlug} />
  ) : null;
}

function FilterControls({
  availability,
  condition,
  sort,
}: FilterControlsProps) {
  return (
    <div className="grid gap-2.5 lg:flex lg:flex-wrap lg:items-end">
      <label className="grid min-w-[164px] gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-primary-hover/78">
        Disponibilidad
        <span className="relative">
          <select
            className={selectClassName}
            defaultValue={availability ?? ""}
            name="disponibilidad"
          >
            <option value="">Todas</option>
            <option value="in_stock">En stock</option>
            <option value="made_to_order">Por encargo</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-hover/80"
          >
            +
          </span>
        </span>
      </label>

      <label className="grid min-w-[164px] gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-primary-hover/78">
        Condicion
        <span className="relative">
          <select
            className={selectClassName}
            defaultValue={condition ?? ""}
            name="condicion"
          >
            <option value="">Todas</option>
            <option value="new">Nuevo</option>
            <option value="used">Usado</option>
            <option value="refurbished">Reacondicionado</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-hover/80"
          >
            +
          </span>
        </span>
      </label>

      <label className="grid min-w-[172px] gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-primary-hover/78">
        Ordenar
        <span className="relative">
          <select className={selectClassName} defaultValue={sort} name="orden">
            <option value="featured">Destacados</option>
            <option value="newest">Mas recientes</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="name">Nombre</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-hover/80"
          >
            +
          </span>
        </span>
      </label>
    </div>
  );
}

function ActiveFilters({ filters }: { filters: Array<string> }) {
  return filters.length > 0 ? (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0"
      aria-label="Filtros activos"
    >
      {filters.map((filter) => (
        <span
          className="shrink-0 rounded-full border border-primary/16 bg-white/34 px-2.5 py-1 text-[0.72rem] font-semibold text-primary-hover shadow-[0_8px_18px_rgba(207,142,168,0.045)] backdrop-blur-md"
          key={filter}
        >
          {filter}
        </span>
      ))}
    </div>
  ) : (
    <span className="block text-sm font-semibold text-muted-foreground/82">
      Sin filtros activos
    </span>
  );
}

export function ShopToolbar({
  actionPath,
  availability,
  categorySlug,
  condition,
  preserveCategoryQuery = false,
  resultCount,
  sort,
}: ShopToolbarProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilters = [
    availability ? availabilityLabels[availability] : null,
    condition ? conditionLabels[condition] : null,
    sort !== "featured" ? sortLabels[sort] : null,
  ].filter((filter): filter is string => Boolean(filter));

  useEffect(() => {
    if (!isFilterPanelOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsFilterPanelOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterPanelOpen]);

  return (
    <>
      <form
        action={actionPath}
        className="hidden scroll-mt-28 gap-4 rounded-[24px] border border-white/54 bg-[rgba(255,250,248,0.48)] p-3.5 shadow-[0_12px_34px_rgba(74,55,47,0.045)] backdrop-blur-[16px] lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      >
        <HiddenCategoryInput
          categorySlug={categorySlug}
          preserveCategoryQuery={preserveCategoryQuery}
        />
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex rounded-full border border-primary/16 bg-secondary/52 px-3 py-1 text-[0.82rem] font-bold text-primary-hover shadow-[0_8px_18px_rgba(207,142,168,0.05)]">
              {resultCount} productos
            </span>
            <ActiveFilters filters={activeFilters} />
          </div>
          <FilterControls
            availability={availability}
            condition={condition}
            sort={sort}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Button className="w-full sm:w-auto" size="sm" type="submit">
            Aplicar
          </Button>
          {activeFilters.length > 0 ? (
            <Link
              className={buttonStyles({
                className: "w-full sm:w-auto",
                size: "sm",
                variant: "secondary",
              })}
              href={actionPath}
            >
              Limpiar filtros
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-3.5 scroll-mt-28 rounded-[22px] border border-white/54 bg-[rgba(255,250,248,0.52)] p-4 shadow-[0_8px_22px_rgba(74,55,47,0.035)] backdrop-blur-[16px] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-primary/16 bg-secondary/52 px-3 py-1 text-[0.82rem] font-bold text-primary-hover">
            {resultCount} productos
          </span>
          <button
            aria-controls="catalog-mobile-filters"
            aria-expanded={isFilterPanelOpen}
            className={buttonStyles({
              className: "h-[42px] min-h-0 px-4 text-[0.82rem]",
              size: "sm",
              variant: "secondary",
            })}
            onClick={() => setIsFilterPanelOpen(true)}
            type="button"
          >
            Filtros
            {activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
          </button>
        </div>
        <div className="mt-2.5">
          <ActiveFilters filters={activeFilters} />
        </div>
        <form
          action={actionPath}
          className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
        >
          <HiddenCategoryInput
            categorySlug={categorySlug}
            preserveCategoryQuery={preserveCategoryQuery}
          />
          {availability ? (
            <input name="disponibilidad" type="hidden" value={availability} />
          ) : null}
          {condition ? (
            <input name="condicion" type="hidden" value={condition} />
          ) : null}
          <label className="grid min-w-0 gap-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-primary-hover/78">
            Ordenar
            <span className="relative">
              <select className={selectClassName} defaultValue={sort} name="orden">
                <option value="featured">Destacados</option>
                <option value="newest">Mas recientes</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre</option>
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-hover/80"
              >
                +
              </span>
            </span>
          </label>
          <Button
            className="h-[46px] min-h-0 whitespace-nowrap px-3.5 text-[0.82rem]"
            size="sm"
            type="submit"
          >
            Aplicar orden
          </Button>
        </form>
      </div>

      {isFilterPanelOpen ? (
        <div
          className="fixed inset-0 z-[90] bg-foreground/18 px-3 py-4 backdrop-blur-[2px] lg:hidden"
          id="catalog-mobile-filters"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsFilterPanelOpen(false);
            }
          }}
        >
          <section
            aria-label="Filtros de catalogo"
            aria-modal="true"
            className="ml-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-white/60 bg-[rgba(255,250,248,0.82)] shadow-[0_24px_72px_rgba(74,55,47,0.15)] backdrop-blur-[20px]"
            role="dialog"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/45 p-4">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-primary-hover">
                  Catalogo
                </p>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Filtros
                </h2>
              </div>
              <button
                aria-label="Cerrar filtros"
                className={buttonStyles({
                  className: "h-10 w-10",
                  size: "icon",
                  variant: "ghost",
                })}
                onClick={() => setIsFilterPanelOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                X
              </button>
            </div>

            <form action={actionPath} className="grid gap-4 overflow-y-auto p-4">
              <HiddenCategoryInput
                categorySlug={categorySlug}
                preserveCategoryQuery={preserveCategoryQuery}
              />
              <FilterControls
                availability={availability}
                condition={condition}
                sort={sort}
              />
              <div className="grid gap-2">
                <Button className="w-full" type="submit">
                  Aplicar filtros
                </Button>
                {activeFilters.length > 0 ? (
                  <Link
                    className={buttonStyles({
                      className: "w-full",
                      variant: "secondary",
                    })}
                    href={actionPath}
                  >
                    Limpiar filtros
                  </Link>
                ) : null}
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
