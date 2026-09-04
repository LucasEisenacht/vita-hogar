import type { PublicProduct } from "@/lib/catalog/types";
import { getConditionLabel } from "@/lib/catalog/commerce";
import { Card, CardContent } from "@/components/ui/card";

type ProductTechnicalDetailsProps = {
  product: PublicProduct;
};

type DetailItem = {
  label: string;
  value: string;
};

function formatDetailLabel(label: string) {
  return label
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function getTechnicalDetails(product: PublicProduct): Array<DetailItem> {
  return [
    product.brand ? { label: "Marca", value: product.brand } : null,
    product.model ? { label: "Modelo", value: product.model } : null,
    product.storageCapacity
      ? { label: "Almacenamiento", value: product.storageCapacity }
      : null,
    { label: "Condicion", value: getConditionLabel(product.condition) },
    product.batteryHealth
      ? { label: "Salud de bateria", value: `${product.batteryHealth}%` }
      : null,
    product.cosmeticCondition
      ? { label: "Estado estetico", value: product.cosmeticCondition }
      : null,
    ...Object.entries(product.technicalDetails).map(([label, value]) => ({
      label: formatDetailLabel(label),
      value,
    })),
  ].filter((item): item is DetailItem => item !== null);
}

export function hasProductTechnicalDetails(product: PublicProduct) {
  return (
    getTechnicalDetails(product).length > 0 ||
    product.includedAccessories.length > 0
  );
}

export function ProductTechnicalDetails({
  product,
}: ProductTechnicalDetailsProps) {
  const details = getTechnicalDetails(product);
  const hasAccessories = product.includedAccessories.length > 0;

  if (details.length === 0 && !hasAccessories) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-semibold text-foreground">
            Ficha tecnica
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Datos reales cargados para revisar el producto con calma.
          </p>
        </div>

        {details.length > 0 ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {details.map((detail) => (
              <div
                className="rounded-[22px] border border-border bg-surface-soft p-4"
                key={`${detail.label}-${detail.value}`}
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {detail.label}
                </dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-foreground">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {hasAccessories ? (
          <div className="space-y-3 rounded-[24px] border border-border bg-surface p-5">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Accesorios incluidos
            </h3>
            <ul className="flex flex-wrap gap-2">
              {product.includedAccessories.map((accessory) => (
                <li
                  className="rounded-full border border-border bg-surface-soft px-3 py-2 text-sm font-semibold text-muted-foreground"
                  key={accessory}
                >
                  {accessory}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
