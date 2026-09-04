import Link from "next/link";
import type { CatalogEditorialChip } from "@/config/catalog-editorial";

type CategoryChipsProps = {
  activeHref?: string;
  chips: Array<CatalogEditorialChip>;
};

export function CategoryChips({ activeHref, chips }: CategoryChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Accesos rapidos de catalogo" className="-mx-5 px-5 sm:-mx-4 sm:px-4">
      <div className="flex scroll-px-5 gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2 sm:overflow-visible">
        {chips.map((chip) => {
          const isActive = activeHref === chip.href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex h-[42px] min-h-0 shrink-0 items-center rounded-full border px-3.5 text-xs font-semibold transition-all duration-[240ms] last:mr-5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-auto sm:min-h-9 sm:px-3.5 sm:text-sm sm:last:mr-0 ${
                isActive
                  ? "border-primary/34 bg-secondary/68 text-primary-hover shadow-[0_8px_18px_rgba(207,142,168,0.05)] sm:shadow-none"
                  : "border-white/46 bg-white/26 text-muted-foreground backdrop-blur-sm hover:border-primary/35 hover:bg-white/48 hover:text-primary-hover"
              }`}
              href={chip.href}
              key={`${chip.href}-${chip.label}`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
