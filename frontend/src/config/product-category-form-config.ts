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
  void categorySlug;
  return defaultProductCategoryFormConfig;
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
