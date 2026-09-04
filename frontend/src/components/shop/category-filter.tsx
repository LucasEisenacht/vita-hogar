import Link from "next/link";
import type { NavigationCategory } from "@/config/catalog-navigation";
import { getCatalogCategoryHref } from "@/lib/catalog/routes";
import type { ProductSort } from "@/lib/catalog/types";

type CategoryFilterProps = {
  activeCategory?: string;
  categories: Array<NavigationCategory>;
  sort?: ProductSort;
};

function getCategoryHref(categorySlug?: string, sort?: ProductSort) {
  const params = new URLSearchParams();

  if (sort && sort !== "featured") {
    params.set("orden", sort);
  }

  const queryString = params.toString();

  const basePath = getCatalogCategoryHref(categorySlug);

  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function CategoryFilter({
  activeCategory,
  categories,
  sort,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(74,55,47,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
          activeCategory
            ? "border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary-hover"
            : "border-primary bg-secondary text-primary-hover"
        }`}
        href={getCategoryHref(undefined, sort)}
      >
        Todo
      </Link>
      {categories.map((category) => {
        const isActive = activeCategory === category.slug;

        return (
          <Link
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(74,55,47,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
              isActive
                ? "border-primary bg-secondary text-primary-hover"
                : "border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary-hover"
            }`}
            href={getCategoryHref(category.slug, sort)}
            key={category.slug}
          >
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
