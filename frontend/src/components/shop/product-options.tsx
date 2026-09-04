import type { PublicProduct } from "@/lib/catalog/types";
import { getProductColorHex } from "@/lib/catalog/product-colors";

type ProductOptionsProps = {
  product: PublicProduct;
};

export function ProductOptions({ product }: ProductOptionsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Color
        </h2>
        <div className="flex flex-wrap gap-3">
          {product.colors.map((color) => (
            <button
              aria-label={`Color ${color.name}`}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-[250ms] hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              key={color.name}
              type="button"
            >
              <span
                className="h-5 w-5 rounded-full border border-border shadow-[inset_0_0_0_1px_rgba(74,55,47,0.08)]"
                style={{ backgroundColor: color.hex ?? getProductColorHex(color.name) }}
              />
              {color.name}
            </button>
          ))}
        </div>
      </div>

      {product.compatibility ? (
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold text-foreground">
            Compatibilidad
          </h2>
          <div className="flex flex-wrap gap-2">
            {product.compatibility.map((item) => (
              <button
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-[250ms] hover:border-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Cantidad
        </h2>
        <div className="inline-flex items-center rounded-full border border-border bg-surface p-1">
          <button
            aria-label="Reducir cantidad"
            className="h-9 w-9 rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            -
          </button>
          <span className="w-10 text-center text-sm font-semibold">1</span>
          <button
            aria-label="Aumentar cantidad"
            className="h-9 w-9 rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
