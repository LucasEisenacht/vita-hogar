import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Product,
  ProductImage,
  ProductModelVariant,
} from "@/types/database";
import type {
  AdminProductFilters,
  AdminProductListResult,
  AdminProductStatusFilter,
  AdminProductStockFilter,
  ProductWithCategory,
} from "@/lib/admin/catalog/types";

const adminProductsPageSize = 20;
const productImagesBucket = "product-images";

function getProductImagePublicUrl(storagePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/${productImagesBucket}/${storagePath}`
    : "";
}

function attachCategories(
  products: Array<Product>,
  categories: Array<Pick<Category, "id" | "name" | "slug">>,
  images: Array<ProductImage> = [],
  modelVariants: Array<ProductModelVariant> = [],
): Array<ProductWithCategory> {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const primaryImageByProductId = new Map<string, ProductImage>();
  const modelVariantsByProductId = new Map<string, Array<ProductModelVariant>>();

  images
    .sort((firstImage, secondImage) => {
      if (firstImage.is_primary !== secondImage.is_primary) {
        return firstImage.is_primary ? -1 : 1;
      }

      return firstImage.sort_order - secondImage.sort_order;
    })
    .forEach((image) => {
      if (!primaryImageByProductId.has(image.product_id)) {
        primaryImageByProductId.set(image.product_id, image);
      }
    });

  modelVariants
    .sort((firstVariant, secondVariant) => {
      const brandComparison = firstVariant.brand.localeCompare(
        secondVariant.brand,
        "es",
      );

      if (brandComparison !== 0) {
        return brandComparison;
      }

      return firstVariant.model.localeCompare(secondVariant.model, "es");
    })
    .forEach((variant) => {
      const variants = modelVariantsByProductId.get(variant.product_id) ?? [];

      variants.push(variant);
      modelVariantsByProductId.set(variant.product_id, variants);
    });

  return products.map((product) => ({
    ...product,
    category: product.category_id
      ? categoriesById.get(product.category_id) ?? null
      : null,
    primaryImageUrl: primaryImageByProductId.get(product.id)?.storage_path
      ? getProductImagePublicUrl(
          primaryImageByProductId.get(product.id)?.storage_path ?? "",
        )
      : undefined,
    modelVariants: modelVariantsByProductId.get(product.id) ?? [],
  }));
}

export function normalizeAdminProductPage(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number(rawValue);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function normalizeAdminProductStatusFilter(
  value?: string | string[],
): AdminProductStatusFilter | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "published" || rawValue === "hidden") {
    return rawValue;
  }

  return undefined;
}

export function normalizeAdminProductStockFilter(
  value?: string | string[],
): AdminProductStockFilter | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "in_stock" || rawValue === "out_of_stock") {
    return rawValue;
  }

  return undefined;
}

export function normalizeAdminProductTextFilter(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim();

  return normalizedValue ? normalizedValue.slice(0, 80) : undefined;
}

export async function getAdminProducts(
  filters: AdminProductFilters = { page: 1 },
): Promise<AdminProductListResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id,name,slug");

  if (categoriesError) {
    throw new Error("No pudimos cargar las categorias.");
  }

  const selectedCategoryId = filters.categorySlug
    ? (categories ?? []).find((category) => category.slug === filters.categorySlug)
        ?.id
    : undefined;
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false });

  if (selectedCategoryId) {
    query = query.eq("category_id", selectedCategoryId);
  }

  if (filters.categorySlug && !selectedCategoryId) {
    return {
      page: 1,
      pageSize: adminProductsPageSize,
      products: [],
      totalCount: 0,
      totalPages: 1,
    };
  }

  if (filters.availability) {
    query = query.eq("availability_type", filters.availability);
  }

  if (filters.condition) {
    query = query.eq("condition", filters.condition);
  }

  if (filters.status === "published") {
    query = query.eq("is_active", true);
  }

  if (filters.status === "hidden") {
    query = query.eq("is_active", false);
  }

  if (filters.stock === "in_stock") {
    query = query.gt("stock", 0);
  }

  if (filters.stock === "out_of_stock") {
    query = query.eq("stock", 0);
  }

  if (filters.query) {
    const escapedQuery = filters.query.replace(/[%_]/g, "\\$&");
    query = query.or(
      `name.ilike.%${escapedQuery}%,slug.ilike.%${escapedQuery}%,brand.ilike.%${escapedQuery}%,model.ilike.%${escapedQuery}%`,
    );
  }

  const from = (filters.page - 1) * adminProductsPageSize;
  const to = from + adminProductsPageSize - 1;
  const { count, data: products, error: productsError } = await query.range(
    from,
    to,
  );

  if (productsError) {
    throw new Error("No pudimos cargar los productos.");
  }

  const productIds = (products ?? []).map((product) => product.id);
  const { data: images, error: imagesError } =
    productIds.length > 0
      ? await supabase
          .from("product_images")
          .select("*")
          .in("product_id", productIds)
          .order("is_primary", { ascending: false })
          .order("sort_order", { ascending: true })
      : { data: [], error: null };

  if (imagesError) {
    throw new Error("No pudimos cargar las imagenes de productos.");
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / adminProductsPageSize), 1);

  return {
    page: Math.min(filters.page, totalPages),
    pageSize: adminProductsPageSize,
    products: attachCategories(products ?? [], categories ?? [], images ?? []),
    totalCount,
    totalPages,
  };
}

export async function getAdminProductById(
  productId: string,
): Promise<ProductWithCategory | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos cargar el producto.");
  }

  if (!product) {
    return null;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,slug");

  const { data: modelVariants, error: modelVariantsError } = await supabase
    .from("product_model_variants")
    .select("*")
    .eq("product_id", product.id)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });

  if (modelVariantsError) {
    throw new Error("No pudimos cargar los modelos disponibles.");
  }

  return attachCategories(
    [product],
    categories ?? [],
    [],
    modelVariants ?? [],
  )[0] ?? null;
}

export async function getActiveCategories(): Promise<Array<Category>> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No pudimos cargar las categorias.");
  }

  return data ?? [];
}
