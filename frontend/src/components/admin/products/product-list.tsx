import Link from "next/link";
import Image from "next/image";
import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAvailabilityLabel,
  getConditionLabel,
} from "@/lib/catalog/commerce";
import type { ProductWithCategory } from "@/lib/admin/catalog/types";
import { formatCurrency } from "@/lib/format-currency";

type ProductListProps = {
  products: Array<ProductWithCategory>;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ProductActions({ product }: { product: ProductWithCategory }) {
  return (
    <div className="flex min-w-[190px] items-center gap-2">
      <Link
        className={buttonStyles({
          className: "h-9 px-4 text-sm",
          size: "sm",
          variant: "secondary",
        })}
        href={`/admin/productos/${product.id}/editar`}
      >
        Editar
      </Link>
      <Link
        className={buttonStyles({
          className: "h-9 px-4 text-sm",
          size: "sm",
          variant: "secondary",
        })}
        href={`/producto/${product.slug}`}
      >
        Ver producto
      </Link>
    </div>
  );
}

function ProductThumbnail({ product }: { product: ProductWithCategory }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-border bg-surface-soft">
      {product.primaryImageUrl ? (
        <Image
          alt={`Miniatura de ${product.name}`}
          className="object-cover"
          fill
          sizes="64px"
          src={product.primaryImageUrl}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
          Sin foto
        </div>
      )}
    </div>
  );
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <Card className="overflow-hidden bg-surface/95">
        <CardContent className="space-y-5 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-secondary text-primary-hover">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="m12 4 7 3.8v8.4L12 20l-7-3.8V7.8L12 4Z"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
              <path
                d="m5.4 8 6.6 3.5L18.6 8M12 11.5V20"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Todav&iacute;a no cargaste productos.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Crea el primer producto real para empezar a ordenar el cat&aacute;logo
              administrativo.
            </p>
          </div>
          <Link
            className={buttonStyles({ size: "lg", variant: "primary" })}
            href="/admin/productos/nuevo"
          >
            Crear primer producto
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="hidden rounded-[30px] border border-border bg-surface shadow-[0_22px_58px_rgba(74,55,47,0.08)] lg:block">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid grid-cols-[minmax(260px,1.5fr)_110px_115px_120px_105px_80px_120px_220px] gap-3 border-b border-border bg-surface-soft px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span>Producto</span>
              <span>Categor&iacute;a</span>
              <span>Condici&oacute;n</span>
              <span>Disponibilidad</span>
              <span>Precio</span>
              <span>Stock</span>
              <span>Estado</span>
              <span className="sticky right-0 z-10 border-l border-border bg-surface-soft pl-4">
                Acciones
              </span>
            </div>
            <div className="divide-y divide-border">
              {products.map((product) => (
                <article
                  className="grid grid-cols-[minmax(260px,1.5fr)_110px_115px_120px_105px_80px_120px_220px] items-center gap-3 px-5 py-3"
                  key={product.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductThumbnail product={product} />
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-semibold text-foreground">
                        {product.name}
                      </h2>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {product.slug}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Actualizado {formatUpdatedAt(product.updated_at)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.category?.name ?? <>Sin categor&iacute;a</>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getConditionLabel(product.condition)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getAvailabilityLabel(product.availability_type)}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.stock}
                  </span>
                  <div className="grid gap-1.5">
                    <ProductStatusBadge isActive={product.is_active} />
                    {product.is_featured ? (
                      <Badge variant="new">Destacado</Badge>
                    ) : null}
                  </div>
                  <div className="sticky right-0 z-10 border-l border-border bg-surface py-2 pl-4">
                    <ProductActions product={product} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {products.map((product) => (
          <Card className="overflow-hidden bg-surface/95" key={product.id}>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <ProductThumbnail product={product} />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {product.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {product.category?.name ?? <>Sin categor&iacute;a</>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ProductStatusBadge isActive={product.is_active} />
                  {product.is_featured ? (
                    <Badge variant="new">Destacado</Badge>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-surface-soft p-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Condicion</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {getConditionLabel(product.condition)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disponibilidad</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {getAvailabilityLabel(product.availability_type)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Precio</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {product.stock}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Actualizado</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatUpdatedAt(product.updated_at)}
                  </p>
                </div>
              </div>
              <ProductActions product={product} />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
