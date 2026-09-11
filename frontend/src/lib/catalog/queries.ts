import { createClient } from "@/lib/supabase/server";
import { isSupabaseDemoMode } from "@/lib/supabase/env";
import { demoCatalogCategories, demoCatalogProducts } from "@/lib/catalog/demo-catalog";
import { normalizeCategory, normalizeProduct } from "@/lib/catalog/normalize";
import { getCatalogCategoryRouteSlugs } from "@/config/catalog-category-routing";
import {
  isSearchableCatalogQuery,
  sanitizeCatalogSearchQuery,
} from "@/lib/catalog/search";
import type {
  CatalogProductFilters,
  PublicCategory,
  PublicProduct,
  ProductAvailabilityFilter,
  ProductConditionFilter,
  ProductSort,
} from "@/lib/catalog/types";
import type {
  Category,
  Product,
  ProductImage,
  ProductModelVariant,
} from "@/types/database";

const catalogErrorMessage =
  "No pudimos cargar el catalogo. Intenta nuevamente en unos minutos.";
const searchErrorMessage =
  "No pudimos realizar la busqueda. Intenta nuevamente.";
const searchCandidateLimit = 12;
const technicalDetailsSearchScanLimit = 200;

function escapeLikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sortProducts(
  products: Array<PublicProduct>,
  sort: ProductSort = "featured",
) {
  const sortedProducts = [...products];

  if (sort === "price-asc") {
    return sortedProducts.sort((first, second) => first.price - second.price);
  }

  if (sort === "price-desc") {
    return sortedProducts.sort((first, second) => second.price - first.price);
  }

  if (sort === "newest") {
    return sortedProducts.sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
    );
  }

  if (sort === "name") {
    return sortedProducts.sort((first, second) =>
      first.name.localeCompare(second.name, "es"),
    );
  }

  return sortedProducts.sort((first, second) => {
    if (first.featured !== second.featured) {
      return first.featured ? -1 : 1;
    }

    return (
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
    );
  });
}

function filterProducts(
  products: Array<PublicProduct>,
  filters: Pick<CatalogProductFilters, "availability" | "condition">,
) {
  return products.filter((product) => {
    if (filters.availability === "in_stock") {
      return product.availabilityType === "in_stock" && product.stock > 0;
    }

    if (
      filters.availability === "made_to_order" &&
      product.availabilityType !== "made_to_order"
    ) {
      return false;
    }

    if (filters.condition && product.condition !== filters.condition) {
      return false;
    }

    return true;
  });
}

async function getActiveCategoryRows() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(catalogErrorMessage);
  }

  return data ?? [];
}

async function getProductImagesByProductId(productIds: Array<string>) {
  if (productIds.length === 0) {
    return new Map<string, Array<ProductImage>>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(catalogErrorMessage);
  }

  const imagesByProductId = new Map<string, Array<ProductImage>>();

  (data ?? []).forEach((image) => {
    const images = imagesByProductId.get(image.product_id) ?? [];
    images.push(image);
    imagesByProductId.set(image.product_id, images);
  });

  return imagesByProductId;
}

async function getProductModelVariantsByProductId(productIds: Array<string>) {
  if (productIds.length === 0) {
    return new Map<string, Array<ProductModelVariant>>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_model_variants")
    .select("*")
    .in("product_id", productIds)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });

  if (error) {
    throw new Error(catalogErrorMessage);
  }

  const variantsByProductId = new Map<string, Array<ProductModelVariant>>();

  (data ?? []).forEach((variant) => {
    const variants = variantsByProductId.get(variant.product_id) ?? [];
    variants.push(variant);
    variantsByProductId.set(variant.product_id, variants);
  });

  return variantsByProductId;
}

async function getActiveProductRows(categoryIds?: Array<string>) {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").eq("is_active", true);

  if (categoryIds && categoryIds.length > 0) {
    query = query.in("category_id", categoryIds);
  }

  const { data, error } = await query.order("updated_at", {
    ascending: false,
  });

  if (error) {
    throw new Error(catalogErrorMessage);
  }

  return data ?? [];
}

function normalizeProductsFromRows({
  categories,
  imagesByProductId,
  modelVariantsByProductId,
  products,
}: {
  categories: Array<Category>;
  imagesByProductId: Map<string, Array<ProductImage>>;
  modelVariantsByProductId: Map<string, Array<ProductModelVariant>>;
  products: Array<Product>;
}) {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return products
    .map((product) => {
      const category = product.category_id
        ? categoriesById.get(product.category_id)
        : undefined;

      if (!category) {
        return null;
      }

      return normalizeProduct({
        category,
        images: imagesByProductId.get(product.id) ?? [],
        modelVariants: modelVariantsByProductId.get(product.id) ?? [],
        product,
      });
    })
    .filter((product): product is PublicProduct => product !== null);
}

function scoreSearchProduct(product: PublicProduct, query: string) {
  const normalizedQuery = normalizeComparableText(query);
  let score = product.featured ? 2 : 0;

  if (normalizeComparableText(product.name).startsWith(normalizedQuery)) {
    score += 120;
  } else if (normalizeComparableText(product.name).includes(normalizedQuery)) {
    score += 100;
  }

  if (normalizeComparableText(product.slug).includes(normalizedQuery)) {
    score += 80;
  }

  if (normalizeComparableText(product.categoryLabel).includes(normalizedQuery)) {
    score += 65;
  }

  if (
    product.compatibility?.some((item) =>
      normalizeComparableText(item).includes(normalizedQuery),
    )
  ) {
    score += 45;
  }

  if (
    product.colors.some((color) =>
      normalizeComparableText(color.name).includes(normalizedQuery),
    )
  ) {
    score += 35;
  }

  if (
    product.badge &&
    normalizeComparableText(product.badge).includes(normalizedQuery)
  ) {
    score += 30;
  }

  if (
    [product.brand, product.model, product.storageCapacity, product.cosmeticCondition]
      .filter((value): value is string => Boolean(value))
      .some((value) => normalizeComparableText(value).includes(normalizedQuery))
  ) {
    score += 55;
  }

  if (
    Object.entries(product.technicalDetails).some(([key, value]) =>
      normalizeComparableText(`${key} ${value}`).includes(normalizedQuery),
    )
  ) {
    score += 40;
  }

  if (
    normalizeComparableText(product.shortDescription).includes(normalizedQuery)
  ) {
    score += 20;
  }

  if (normalizeComparableText(product.description).includes(normalizedQuery)) {
    score += 10;
  }

  return score;
}

function sortSearchProducts(products: Array<PublicProduct>, query: string) {
  return [...products].sort((firstProduct, secondProduct) => {
    const scoreDifference =
      scoreSearchProduct(secondProduct, query) -
      scoreSearchProduct(firstProduct, query);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return (
      new Date(secondProduct.updatedAt).getTime() -
      new Date(firstProduct.updatedAt).getTime()
    );
  });
}

async function addSearchCandidates({
  field,
  pattern,
  productsById,
}: {
  field:
    | "badge"
    | "brand"
    | "cosmetic_condition"
    | "description"
    | "model"
    | "name"
    | "short_description"
    | "slug"
    | "storage_capacity";
  pattern: string;
  productsById: Map<string, Product>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .ilike(field, pattern)
    .limit(searchCandidateLimit);

  if (error) {
    throw new Error(searchErrorMessage);
  }

  (data ?? []).forEach((product) => {
    productsById.set(product.id, product);
  });
}

async function addTechnicalDetailsSearchCandidates({
  productsById,
  query,
}: {
  productsById: Map<string, Product>;
  query: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(technicalDetailsSearchScanLimit);

  if (error) {
    throw new Error(searchErrorMessage);
  }

  const normalizedQuery = normalizeComparableText(query);

  (data ?? []).forEach((product) => {
    const technicalDetails = product.technical_details;

    if (
      technicalDetails &&
      !Array.isArray(technicalDetails) &&
      typeof technicalDetails === "object" &&
      Object.entries(technicalDetails).some(([key, value]) => {
        if (typeof value !== "string") {
          return false;
        }

        return normalizeComparableText(`${key} ${value}`).includes(
          normalizedQuery,
        );
      })
    ) {
      productsById.set(product.id, product);
    }
  });
}

async function addArraySearchCandidates({
  field,
  productsById,
  values,
}: {
  field: "colors" | "compatibility";
  productsById: Map<string, Product>;
  values: Array<string>;
}) {
  const supabase = await createClient();

  for (const value of values) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .contains(field, [value])
      .limit(searchCandidateLimit);

    if (error) {
      throw new Error(searchErrorMessage);
    }

    (data ?? []).forEach((product) => {
      productsById.set(product.id, product);
    });
  }
}

async function addCategorySearchCandidates({
  categoryIds,
  productsById,
}: {
  categoryIds: Array<string>;
  productsById: Map<string, Product>;
}) {
  if (categoryIds.length === 0) {
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .in("category_id", categoryIds)
    .limit(searchCandidateLimit);

  if (error) {
    throw new Error(searchErrorMessage);
  }

  (data ?? []).forEach((product) => {
    productsById.set(product.id, product);
  });
}

export async function getPublicCategories(): Promise<Array<PublicCategory>> {
  if (isSupabaseDemoMode()) {
    return demoCatalogCategories;
  }

  const categories = await getActiveCategoryRows();

  return categories.map(normalizeCategory);
}

export async function getPublicProducts(
  options: CatalogProductFilters = {},
): Promise<Array<PublicProduct>> {
  if (isSupabaseDemoMode()) {
    const categoryProducts = options.categorySlug
      ? demoCatalogProducts.filter((product) => product.category === options.categorySlug)
      : demoCatalogProducts;
    const sortedProducts = sortProducts(filterProducts(categoryProducts, options), options.sort);
    return typeof options.limit === "number" ? sortedProducts.slice(0, options.limit) : sortedProducts;
  }

  const categories = await getActiveCategoryRows();
  const selectedCategorySlugs = options.categorySlug
    ? getCatalogCategoryRouteSlugs(options.categorySlug)
    : [];
  const selectedCategories = selectedCategorySlugs.length
    ? categories.filter((category) => selectedCategorySlugs.includes(category.slug))
    : [];

  if (options.categorySlug && selectedCategories.length === 0) {
    return [];
  }

  const products = await getActiveProductRows(
    selectedCategories.length
      ? selectedCategories.map((category) => category.id)
      : undefined,
  );
  const imagesByProductId = await getProductImagesByProductId(
    products.map((product) => product.id),
  );
  const modelVariantsByProductId = await getProductModelVariantsByProductId(
    products.map((product) => product.id),
  );
  const normalizedProducts = normalizeProductsFromRows({
    categories,
    imagesByProductId,
    modelVariantsByProductId,
    products,
  });
  const filteredProducts = filterProducts(normalizedProducts, options);
  const sortedProducts = sortProducts(filteredProducts, options.sort);

  return typeof options.limit === "number"
    ? sortedProducts.slice(0, options.limit)
    : sortedProducts;
}

export async function getFeaturedProducts(limit = 6) {
  const products = await getPublicProducts({ sort: "featured" });
  const featuredProducts = products.filter((product) => product.featured);

  return (featuredProducts.length > 0 ? featuredProducts : products).slice(
    0,
    limit,
  );
}

export async function getPublicProductsByCategory(
  categorySlug: string,
  filters: Omit<CatalogProductFilters, "categorySlug"> = {},
) {
  return getPublicProducts({ ...filters, categorySlug });
}

export async function getPublicProductsByIds(productIds: Array<string>) {
  const uniqueProductIds = Array.from(new Set(productIds));

  if (uniqueProductIds.length === 0) {
    return [];
  }

  const categories = await getActiveCategoryRows();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .in("id", uniqueProductIds);

  if (error) {
    throw new Error(catalogErrorMessage);
  }

  const products = data ?? [];
  const imagesByProductId = await getProductImagesByProductId(
    products.map((product) => product.id),
  );
  const modelVariantsByProductId = await getProductModelVariantsByProductId(
    products.map((product) => product.id),
  );
  const productsById = new Map(
    normalizeProductsFromRows({
      categories,
      imagesByProductId,
      modelVariantsByProductId,
      products,
    }).map((product) => [product.id, product]),
  );

  return uniqueProductIds
    .map((productId) => productsById.get(productId))
    .filter((product): product is PublicProduct => product !== undefined);
}

export async function getPublicCategoryBySlug(categorySlug: string) {
  const categories = await getActiveCategoryRows();
  const category = categories.find((item) => item.slug === categorySlug);

  return category ? normalizeCategory(category) : null;
}

export async function getPublicProductBySlug(productSlug: string) {
  const products = await getPublicProducts();

  return products.find((product) => product.slug === productSlug) ?? null;
}

export async function getRelatedProducts(product: PublicProduct, limit = 3) {
  const products = await getPublicProducts({ sort: "featured" });
  const candidates = products.filter(
    (item) => item.id !== product.id && Boolean(item.primaryImage?.url),
  );
  const sortByAvailability = (items: Array<PublicProduct>) =>
    [...items].sort((firstProduct, secondProduct) => {
      const firstAvailable =
        firstProduct.availabilityType === "made_to_order" ||
        firstProduct.stock > 0;
      const secondAvailable =
        secondProduct.availabilityType === "made_to_order" ||
        secondProduct.stock > 0;

      if (firstAvailable !== secondAvailable) {
        return firstAvailable ? -1 : 1;
      }

      return (
        new Date(secondProduct.updatedAt).getTime() -
        new Date(firstProduct.updatedAt).getTime()
      );
    });
  const sameCategoryProducts = sortByAvailability(
    candidates.filter((item) => item.category === product.category),
  );
  const fallbackProducts = sortByAvailability(
    candidates.filter((item) => item.category !== product.category),
  );

  return [...sameCategoryProducts, ...fallbackProducts].slice(0, limit);
}

export function normalizeProductSort(value?: string): ProductSort {
  if (
    value === "featured" ||
    value === "name" ||
    value === "newest" ||
    value === "price-asc" ||
    value === "price-desc"
  ) {
    return value;
  }

  return "featured";
}

export function normalizeProductAvailabilityFilter(
  value?: string,
): ProductAvailabilityFilter | undefined {
  if (value === "in_stock" || value === "made_to_order") {
    return value;
  }

  return undefined;
}

export function normalizeProductConditionFilter(
  value?: string,
): ProductConditionFilter | undefined {
  if (value === "new" || value === "used" || value === "refurbished") {
    return value;
  }

  return undefined;
}

export async function searchPublicProducts(query: string, limit = 6) {
  const sanitizedQuery = sanitizeCatalogSearchQuery(query);
  const resultLimit = Math.min(Math.max(limit, 0), searchCandidateLimit);

  if (!isSearchableCatalogQuery(sanitizedQuery)) {
    return [];
  }

  if (isSupabaseDemoMode()) {
    const normalizedQuery = normalizeComparableText(sanitizedQuery);
    return sortSearchProducts(demoCatalogProducts, sanitizedQuery)
      .filter((product) => normalizeComparableText(`${product.name} ${product.categoryLabel} ${product.shortDescription}`).includes(normalizedQuery))
      .slice(0, resultLimit);
  }
  const categories = await getActiveCategoryRows();
  const normalizedQuery = normalizeComparableText(sanitizedQuery);
  const matchingCategoryIds = categories
    .filter((category) =>
      normalizeComparableText(category.name).includes(normalizedQuery),
    )
    .map((category) => category.id);
  const productsById = new Map<string, Product>();
  const pattern = `%${escapeLikePattern(sanitizedQuery)}%`;
  const searchableFields: Array<
    | "badge"
    | "brand"
    | "cosmetic_condition"
    | "description"
    | "model"
    | "name"
    | "short_description"
    | "slug"
    | "storage_capacity"
  > = [
    "name",
    "slug",
    "short_description",
    "description",
    "badge",
    "brand",
    "model",
    "storage_capacity",
    "cosmetic_condition",
  ];
  const arraySearchValues = Array.from(
    new Set([
      sanitizedQuery,
      ...sanitizedQuery
        .split(" ")
        .map((value) => value.trim())
        .filter((value) => value.length >= 2),
    ]),
  ).slice(0, 5);

  await Promise.all([
    ...searchableFields.map((field) =>
      addSearchCandidates({ field, pattern, productsById }),
    ),
    addArraySearchCandidates({
      field: "compatibility",
      productsById,
      values: arraySearchValues,
    }),
    addArraySearchCandidates({
      field: "colors",
      productsById,
      values: arraySearchValues,
    }),
    addCategorySearchCandidates({
      categoryIds: matchingCategoryIds,
      productsById,
    }),
    addTechnicalDetailsSearchCandidates({
      productsById,
      query: sanitizedQuery,
    }),
  ]);

  const products = Array.from(productsById.values());
  const imagesByProductId = await getProductImagesByProductId(
    products.map((product) => product.id),
  );
  const modelVariantsByProductId = await getProductModelVariantsByProductId(
    products.map((product) => product.id),
  );
  const normalizedProducts = normalizeProductsFromRows({
    categories,
    imagesByProductId,
    modelVariantsByProductId,
    products,
  });

  return sortSearchProducts(normalizedProducts, sanitizedQuery).slice(
    0,
    resultLimit,
  );
}
