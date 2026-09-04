import { EmptyState } from "@/components/shared/empty-state";

export function EmptyCart() {
  return (
    <div className="mx-auto max-w-2xl">
      <EmptyState
        actionHref="/tienda"
        actionLabel="Explorar la tienda"
        message="Descubri accesorios, celulares y tecnologia elegidos para acompanarte todos los dias."
        title="Tu carrito esta esperando"
      />
    </div>
  );
}
