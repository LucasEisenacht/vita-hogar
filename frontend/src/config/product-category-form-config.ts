export type ProductCategoryFormField =
  | "accessories"
  | "batteryHealth"
  | "brand"
  | "colors"
  | "compatibility"
  | "cosmeticCondition"
  | "estimatedDeliveryText"
  | "model"
  | "storageCapacity"
  | "technicalDetails";

type ProductCategoryFormConfig = {
  description: string;
  fields: Array<ProductCategoryFormField>;
  title: string;
};

const sharedCommerceFields: Array<ProductCategoryFormField> = [
  "brand",
  "model",
  "estimatedDeliveryText",
];

const productCategoryFormConfigBySlug: Record<
  string,
  ProductCategoryFormConfig
> = {
  accesorios: {
    description:
      "Campos pensados para accesorios sin mostrar datos propios de celulares usados.",
    fields: [
      ...sharedCommerceFields,
      "accessories",
      "colors",
      "technicalDetails",
    ],
    title: "Caracteristicas para accesorios",
  },
  celulares: {
    description:
      "Campos utiles para celulares nuevos, usados o reacondicionados.",
    fields: [
      ...sharedCommerceFields,
      "storageCapacity",
      "batteryHealth",
      "cosmeticCondition",
      "accessories",
      "colors",
      "technicalDetails",
    ],
    title: "Caracteristicas para celulares",
  },
  combos: {
    description:
      "Un combo se carga como producto comun, usando descripcion, accesorios o detalles.",
    fields: ["estimatedDeliveryText", "accessories", "technicalDetails"],
    title: "Contenido del combo",
  },
  consolas: {
    description:
      "Campos flexibles para consolas sin crear plataformas rigidas.",
    fields: [
      ...sharedCommerceFields,
      "storageCapacity",
      "accessories",
      "technicalDetails",
    ],
    title: "Caracteristicas para consolas",
  },
  fundas: {
    description:
      "Campos enfocados en compatibilidad, precio, stock e imagenes.",
    fields: [
      "brand",
      "model",
      "compatibility",
      "colors",
      "estimatedDeliveryText",
    ],
    title: "Caracteristicas para fundas",
  },
};

const defaultProductCategoryFormConfig: ProductCategoryFormConfig = {
  description:
    "Campos generales para productos sin una configuracion especifica.",
  fields: [
    ...sharedCommerceFields,
    "storageCapacity",
    "accessories",
    "colors",
    "compatibility",
    "technicalDetails",
  ],
  title: "Caracteristicas del producto",
};

export function getProductCategoryFormConfig(categorySlug?: string | null) {
  return categorySlug
    ? productCategoryFormConfigBySlug[categorySlug] ??
        defaultProductCategoryFormConfig
    : defaultProductCategoryFormConfig;
}

export function shouldShowProductCategoryField({
  categorySlug,
  field,
}: {
  categorySlug?: string | null;
  field: ProductCategoryFormField;
}) {
  return getProductCategoryFormConfig(categorySlug).fields.includes(field);
}
