import Link from "next/link";
import type {
  AdminProductStatusFilter,
  AdminProductStockFilter,
} from "@/lib/admin/catalog/types";
import type {
  ProductAvailabilityType,
  ProductCondition,
  Category,
} from "@/types/database";
import { buttonStyles } from "@/components/ui/button";

type ProductAdminFiltersProps = {
  availability?: ProductAvailabilityType;
  categories: Array<Category>;
  categorySlug?: string;
  condition?: ProductCondition;
  query?: string;
  status?: AdminProductStatusFilter;
  stock?: AdminProductStockFilter;
};

const selectClassName =
  "h-11 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35";

export function ProductAdminFilters({
  availability,
  categories,
  categorySlug,
  condition,
  query,
  status,
  stock,
}: ProductAdminFiltersProps) {
  return (
    <form
      action="/admin/productos"
      className="grid gap-4 rounded-[28px] border border-border bg-surface p-4 shadow-[0_16px_40px_rgba(74,55,47,0.05)]"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(130px,1fr))]">
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Buscar
          <input
            className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/35"
            defaultValue={query ?? ""}
            name="q"
            placeholder="Nombre, slug, marca o modelo"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Categoria
          <select
            className={selectClassName}
            defaultValue={categorySlug ?? ""}
            name="categoria"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Condicion
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
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Disponibilidad
          <select
            className={selectClassName}
            defaultValue={availability ?? ""}
            name="disponibilidad"
          >
            <option value="">Todas</option>
            <option value="in_stock">En stock</option>
            <option value="made_to_order">Por encargo</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Estado
          <select
            className={selectClassName}
            defaultValue={status ?? ""}
            name="estado"
          >
            <option value="">Todos</option>
            <option value="published">Publicado</option>
            <option value="hidden">Oculto</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Stock
          <select
            className={selectClassName}
            defaultValue={stock ?? ""}
            name="stock"
          >
            <option value="">Todos</option>
            <option value="in_stock">Con stock</option>
            <option value="out_of_stock">Sin stock</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Link
          className={buttonStyles({
            className: "w-full sm:w-auto",
            size: "sm",
            variant: "secondary",
          })}
          href="/admin/productos"
        >
          Limpiar filtros
        </Link>
        <button
          className={buttonStyles({
            className: "w-full sm:w-auto",
            size: "sm",
            variant: "primary",
          })}
          type="submit"
        >
          Aplicar filtros
        </button>
      </div>
    </form>
  );
}
