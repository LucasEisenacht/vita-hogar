import type {
  ProductAvailabilityType,
  ProductCondition,
} from "@/types/database";

export type PublicCategory = {
  description: string;
  id: string;
  name: string;
  slug: string;
};

export type PublicProductColor = {
  hex?: string;
  name: string;
};

export type PublicProductImage = {
  alt: string;
  colorName?: string;
  height: number | null;
  id: string;
  isPrimary: boolean;
  sortOrder: number;
  url: string;
  width: number | null;
};

export type PublicProductSpecification = {
  label: string;
  value: string;
};

export type PublicProductModelVariant = {
  brand: string;
  colorKey?: string;
  colorName?: string;
  id: string;
  isActive: boolean;
  model: string;
  stock: number;
};

export type PublicProduct = {
  availabilityType: ProductAvailabilityType;
  badge?: string;
  batteryHealth?: number;
  brand?: string;
  category: string;
  categoryLabel: string;
  colors: Array<PublicProductColor>;
  compatibility?: Array<string>;
  condition: ProductCondition;
  cosmeticCondition?: string;
  description: string;
  estimatedDeliveryText?: string;
  featured: boolean;
  id: string;
  images: Array<PublicProductImage>;
  includedAccessories: Array<string>;
  model?: string;
  modelVariants: Array<PublicProductModelVariant>;
  name: string;
  previousPrice?: number;
  price: number;
  primaryImage?: PublicProductImage;
  shortDescription: string;
  slug: string;
  specifications: Array<PublicProductSpecification>;
  stock: number;
  storageCapacity?: string;
  technicalDetails: Record<string, string>;
  updatedAt: string;
};

export type ProductSort =
  | "featured"
  | "name"
  | "newest"
  | "price-asc"
  | "price-desc";

export type ProductAvailabilityFilter = ProductAvailabilityType;

export type ProductConditionFilter = ProductCondition;

export type CatalogProductFilters = {
  availability?: ProductAvailabilityFilter;
  categorySlug?: string;
  condition?: ProductConditionFilter;
  limit?: number;
  sort?: ProductSort;
};

export type CatalogSearchApiResponse =
  | {
      categories: Array<PublicCategory>;
      favoriteProductIds: Array<string>;
      products: Array<PublicProduct>;
      query: string;
      status: "success";
    }
  | {
      categories: Array<PublicCategory>;
      favoriteProductIds: Array<string>;
      message: string;
      products: Array<PublicProduct>;
      query: string;
      status: "error";
    };

export type CatalogLoadResult<TData> =
  | {
      data: TData;
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };
