import type {
  Category,
  Product,
  ProductAvailabilityType,
  ProductCondition,
  ProductModelVariant,
  ProductSpecification,
} from "@/types/database";

export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  modelVariants?: Array<ProductModelVariant>;
  primaryImageUrl?: string;
};

export type ProductFormField =
  | "availabilityType"
  | "badge"
  | "batteryHealth"
  | "brand"
  | "categoryId"
  | "colors"
  | "compatibility"
  | "condition"
  | "cosmeticCondition"
  | "description"
  | "estimatedDeliveryText"
  | "form"
  | "includedAccessories"
  | "isActive"
  | "isFeatured"
  | "imageDeletion"
  | "model"
  | "modelVariants"
  | "name"
  | "previousPrice"
  | "price"
  | "shortDescription"
  | "slug"
  | "specifications"
  | "storageCapacity"
  | "stock"
  | "technicalDetails";

export type ProductFormState = {
  fieldErrors?: Partial<Record<ProductFormField, string>>;
  message?: string;
  status: "idle" | "error";
};

export type AdminProductStatusFilter = "hidden" | "published";

export type AdminProductStockFilter = "in_stock" | "out_of_stock";

export type AdminProductFilters = {
  availability?: ProductAvailabilityType;
  categorySlug?: string;
  condition?: ProductCondition;
  page: number;
  query?: string;
  status?: AdminProductStatusFilter;
  stock?: AdminProductStockFilter;
};

export type AdminProductListResult = {
  page: number;
  pageSize: number;
  products: Array<ProductWithCategory>;
  totalCount: number;
  totalPages: number;
};

export type ProductFormValues = {
  availability_type: ProductAvailabilityType;
  badge: string | null;
  battery_health: number | null;
  brand: string | null;
  category_id: string | null;
  colors: Array<string>;
  compatibility: Array<string>;
  condition: ProductCondition;
  cosmetic_condition: string | null;
  description: string | null;
  estimated_delivery_text: string | null;
  included_accessories: Array<string>;
  is_active: boolean;
  is_featured: boolean;
  model: string | null;
  name: string;
  previous_price: number | null;
  price: number;
  short_description: string | null;
  slug: string;
  specifications: ProductSpecification;
  stock: number;
  storage_capacity: string | null;
  technical_details: ProductSpecification;
  modelVariants: Array<ProductModelVariantFormValue>;
};

export type ProductModelVariantFormValue = {
  brand: string;
  color_key: string | null;
  color_name: string | null;
  id: string | null;
  is_active: boolean;
  model: string;
  stock: number;
};

export const initialProductFormState: ProductFormState = {
  status: "idle",
};

export type ProductDeleteState = {
  message?: string;
  status: "idle" | "error";
};

export const initialProductDeleteState: ProductDeleteState = {
  status: "idle",
};

export type ProductQuickEditField =
  | "availabilityType"
  | "form"
  | "isActive"
  | "price"
  | "stock";

export type ProductQuickEditState = {
  fieldErrors?: Partial<Record<ProductQuickEditField, string>>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialProductQuickEditState: ProductQuickEditState = {
  status: "idle",
};
