import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

type ProductPaginationProps = {
  basePath?: string;
  page: number;
  params: URLSearchParams;
  totalCount: number;
  totalPages: number;
};

function getPageHref({
  basePath,
  page,
  params,
}: {
  basePath: string;
  page: number;
  params: URLSearchParams;
}) {
  const nextParams = new URLSearchParams(params);

  if (page <= 1) {
    nextParams.delete("pagina");
  } else {
    nextParams.set("pagina", String(page));
  }

  const queryString = nextParams.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function ProductPagination({
  basePath = "/admin/productos",
  page,
  params,
  totalCount,
  totalPages,
}: ProductPaginationProps) {
  if (totalPages <= 1) {
    return (
      <p className="text-sm font-medium text-muted-foreground">
        {totalCount} productos encontrados.
      </p>
    );
  }

  return (
    <nav
      aria-label="Paginacion de productos"
      className="flex flex-col gap-3 rounded-[24px] border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm font-medium text-muted-foreground">
        Pagina {page} de {totalPages} / {totalCount} productos
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          aria-disabled={page <= 1}
          className={buttonStyles({
            className: page <= 1 ? "pointer-events-none opacity-45" : "",
            size: "sm",
            variant: "secondary",
          })}
          href={getPageHref({ basePath, page: page - 1, params })}
        >
          Anterior
        </Link>
        <Link
          aria-disabled={page >= totalPages}
          className={buttonStyles({
            className: page >= totalPages ? "pointer-events-none opacity-45" : "",
            size: "sm",
            variant: "secondary",
          })}
          href={getPageHref({ basePath, page: page + 1, params })}
        >
          Siguiente
        </Link>
      </div>
    </nav>
  );
}
