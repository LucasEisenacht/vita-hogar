import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleCategoryActive } from "@/lib/admin/categories/actions";
import type { AdminCategory } from "@/lib/admin/categories/types";

export function CategoryList({
  categories,
}: {
  categories: Array<AdminCategory>;
}) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 p-7 text-center sm:p-10">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Todavia no hay categorias
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Crea la primera categoria real para poder cargar productos.
          </p>
          <Link
            className={buttonStyles({ size: "md", variant: "primary" })}
            href="/admin/categorias/nueva"
          >
            Crear categoria
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4">
      {categories.map((category) => (
        <Card className="bg-surface/95" key={category.id}>
          <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center sm:p-6">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={category.is_active ? "stock" : "neutral"}>
                  {category.is_active ? "Activa" : "Inactiva"}
                </Badge>
                <Badge variant="neutral">Orden {category.sort_order}</Badge>
                <Badge variant="neutral">
                  {category.productCount} {category.productCount === 1 ? "producto" : "productos"}
                </Badge>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {category.name}
                </h2>
                <p className="mt-1 break-all text-sm font-semibold text-primary-hover">
                  /tienda/{category.slug}
                </p>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {category.description || "Sin descripcion."}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Link
                className={buttonStyles({
                  className: "w-full sm:w-auto",
                  size: "sm",
                  variant: "secondary",
                })}
                href={`/admin/categorias/${category.id}/editar`}
              >
                Editar
              </Link>
              <form action={toggleCategoryActive.bind(null, category.id)}>
                <input
                  name="isActive"
                  type="hidden"
                  value={category.is_active ? "false" : "true"}
                />
                <button
                  className={buttonStyles({
                    className: "w-full sm:w-auto",
                    size: "sm",
                    variant: "secondary",
                  })}
                  type="submit"
                >
                  {category.is_active ? "Desactivar" : "Activar"}
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
