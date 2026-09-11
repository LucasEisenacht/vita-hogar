import { EmptyState } from "@/components/shared/empty-state";

export function EmptyCart() {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        actionHref="/tienda"
        actionLabel="Explorar la tienda"
        message="Descubrí textiles, objetos y detalles pensados para acompañar cada ambiente."
        title="Tu carrito esta esperando"
      />
    </div>
  );
}
