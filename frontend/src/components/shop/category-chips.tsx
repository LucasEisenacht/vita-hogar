import Link from "next/link";
import type { CatalogEditorialChip } from "@/config/catalog-editorial";

type CategoryChipsProps = { activeHref?: string; chips: Array<CatalogEditorialChip> };

export function CategoryChips({ activeHref, chips }: CategoryChipsProps) {
  if (chips.length === 0) return null;
  return <nav aria-label="Accesos rápidos de catálogo" className="vita-category-chips"><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">{chips.map((chip) => { const isActive = activeHref === chip.href; return <Link aria-current={isActive ? "page" : undefined} className={`shrink-0 border px-3 py-2 text-sm font-semibold transition-colors ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary"}`} href={chip.href} key={`${chip.href}-${chip.label}`}>{chip.label}</Link>; })}</div></nav>;
}