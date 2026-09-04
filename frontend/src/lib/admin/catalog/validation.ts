import type {
  ProductFormField,
  ProductModelVariantFormValue,
  ProductFormValues,
} from "@/lib/admin/catalog/types";
import type {
  ProductAvailabilityType,
  ProductCondition,
} from "@/types/database";
import { normalizeProductColorName } from "@/lib/catalog/product-colors";

type ProductValidationResult =
  | {
      data: ProductFormValues;
      fieldErrors?: never;
    }
  | {
      data?: never;
      fieldErrors: Partial<Record<ProductFormField, string>>;
    };

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";

  return text ? text : null;
}

function normalizeLimitedOptionalText(
  value: FormDataEntryValue | null,
  field: ProductFormField,
  label: string,
  fieldErrors: Partial<Record<ProductFormField, string>>,
  maxLength: number,
) {
  const normalizedValue = normalizeOptionalText(value);

  if (normalizedValue && normalizedValue.length > maxLength) {
    fieldErrors[field] = `${label} debe tener hasta ${maxLength} caracteres.`;
  }

  return normalizedValue;
}

function requireText(
  formData: FormData,
  field: ProductFormField,
  label: string,
  fieldErrors: Partial<Record<ProductFormField, string>>,
) {
  const value = normalizeOptionalText(formData.get(field));

  if (!value) {
    fieldErrors[field] = `${label} es obligatorio.`;
    return "";
  }

  return value;
}

function parseNonNegativeInteger(
  value: FormDataEntryValue | null,
  field: ProductFormField,
  label: string,
  fieldErrors: Partial<Record<ProductFormField, string>>,
  options: { isRequired: boolean },
) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    if (options.isRequired) {
      fieldErrors[field] = `${label} es obligatorio.`;
      return 0;
    }

    return null;
  }

  const numberValue = Number(text);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    fieldErrors[field] = `${label} debe ser un numero entero mayor o igual a 0.`;
    return 0;
  }

  return numberValue;
}

function parsePositiveInteger(
  value: FormDataEntryValue | null,
  field: ProductFormField,
  label: string,
  fieldErrors: Partial<Record<ProductFormField, string>>,
) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    fieldErrors[field] = `${label} es obligatorio.`;
    return null;
  }

  const numberValue = Number(text);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    fieldErrors[field] = `${label} debe ser mayor a 0.`;
    return null;
  }

  return numberValue;
}

function parseOptionalIntegerInRange(
  value: FormDataEntryValue | null,
  field: ProductFormField,
  label: string,
  fieldErrors: Partial<Record<ProductFormField, string>>,
  range: { max: number; min: number },
) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    return null;
  }

  const numberValue = Number(text);

  if (
    !Number.isInteger(numberValue) ||
    numberValue < range.min ||
    numberValue > range.max
  ) {
    fieldErrors[field] = `${label} debe estar entre ${range.min} y ${range.max}.`;
    return null;
  }

  return numberValue;
}

export function slugifyProductName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseCommaSeparatedList(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value : "";
  const seen = new Set<string>();
  const items: Array<string> = [];

  text.split(",").forEach((rawItem) => {
    const item = rawItem.trim();
    const key = item.toLowerCase();

    if (item && !seen.has(key)) {
      seen.add(key);
      items.push(item);
    }
  });

  return items;
}

export function parseSpecifications(formData: FormData) {
  const labels = formData.getAll("specificationLabel");
  const values = formData.getAll("specificationValue");
  const specifications: Record<string, string> = {};

  labels.forEach((labelValue, index) => {
    const label = typeof labelValue === "string" ? labelValue.trim() : "";
    const valueEntry = values[index];
    const value = typeof valueEntry === "string" ? valueEntry.trim() : "";

    if (
      label &&
      value &&
      !Object.prototype.hasOwnProperty.call(specifications, label)
    ) {
      specifications[label] = value;
    }
  });

  return specifications;
}

export function parseTechnicalDetails(formData: FormData) {
  const labels = formData.getAll("technicalDetailLabel");
  const values = formData.getAll("technicalDetailValue");
  const technicalDetails: Record<string, string> = {};

  labels.forEach((labelValue, index) => {
    const label = typeof labelValue === "string" ? labelValue.trim() : "";
    const valueEntry = values[index];
    const value = typeof valueEntry === "string" ? valueEntry.trim() : "";

    const normalizedLabel = label.slice(0, 80);

    if (
      normalizedLabel &&
      value &&
      !Object.prototype.hasOwnProperty.call(technicalDetails, normalizedLabel)
    ) {
      technicalDetails[normalizedLabel] = value.slice(0, 160);
    }
  });

  return technicalDetails;
}

function parseLineSeparatedList(
  value: FormDataEntryValue | null,
  field: ProductFormField,
  label: string,
  fieldErrors: Partial<Record<ProductFormField, string>>,
) {
  const text = typeof value === "string" ? value : "";
  const seen = new Set<string>();
  const items: Array<string> = [];

  text.split(/\r?\n/).forEach((rawItem) => {
    const item = rawItem.trim();
    const key = item.toLowerCase();

    if (!item || seen.has(key)) {
      return;
    }

    if (item.length > 120) {
      fieldErrors[field] = `${label} debe tener items de hasta 120 caracteres.`;
      return;
    }

    seen.add(key);
    items.push(item);
  });

  return items;
}

export function parseBooleanInput(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function getStringEntry(entries: Array<FormDataEntryValue>, index: number) {
  const entry = entries[index];

  return typeof entry === "string" ? entry.trim() : "";
}

function parseModelVariants(
  formData: FormData,
  fieldErrors: Partial<Record<ProductFormField, string>>,
  options: { requireColor: boolean },
) {
  const ids = formData.getAll("modelVariantId");
  const brands = formData.getAll("modelVariantBrand");
  const colorNames = formData.getAll("modelVariantColor");
  const models = formData.getAll("modelVariantModel");
  const stocks = formData.getAll("modelVariantStock");
  const activeValues = formData.getAll("modelVariantIsActive");
  const rowCount = Math.max(
    ids.length,
    brands.length,
    colorNames.length,
    models.length,
    stocks.length,
    activeValues.length,
  );
  const seenModels = new Set<string>();
  const variants: Array<ProductModelVariantFormValue> = [];

  for (let index = 0; index < rowCount; index += 1) {
    const id = getStringEntry(ids, index);
    const brand = getStringEntry(brands, index);
    const colorName = getStringEntry(colorNames, index);
    const model = getStringEntry(models, index);
    const stockText = getStringEntry(stocks, index);
    const isActive =
      activeValues[index] === undefined
        ? true
        : parseBooleanInput(activeValues[index]);
    const hasRowData = Boolean(id || brand || model || colorName || stockText);

    if (!hasRowData) {
      continue;
    }

    if (!brand) {
      fieldErrors.modelVariants = "La marca de cada modelo es obligatoria.";
    } else if (brand.length > 80) {
      fieldErrors.modelVariants = "La marca debe tener hasta 80 caracteres.";
    }

    if (!model) {
      fieldErrors.modelVariants = "El modelo de celular es obligatorio.";
    } else if (model.length > 120) {
      fieldErrors.modelVariants = "El modelo debe tener hasta 120 caracteres.";
    }

    if (options.requireColor && !colorName) {
      fieldErrors.modelVariants = "El color de cada combinacion es obligatorio.";
    } else if (colorName.length > 80) {
      fieldErrors.modelVariants = "El color debe tener hasta 80 caracteres.";
    }

    const stock = Number(stockText);

    if (!stockText || !Number.isInteger(stock) || stock < 0) {
      fieldErrors.modelVariants =
        "El stock de cada modelo debe ser un entero mayor o igual a 0.";
    }

    const colorKey = colorName ? normalizeProductColorName(colorName) : null;
    const duplicateKey = `${brand.toLowerCase()}::${model.toLowerCase()}::${colorKey ?? ""}`;

    if (brand && model && seenModels.has(duplicateKey)) {
      fieldErrors.modelVariants =
        "No repitas la misma combinacion de marca, modelo y color.";
    }

    seenModels.add(duplicateKey);

    variants.push({
      brand,
      color_key: colorKey,
      color_name: colorName || null,
      id: id || null,
      is_active: isActive,
      model,
      stock: Number.isInteger(stock) && stock >= 0 ? stock : 0,
    });
  }

  return variants;
}

function parseCondition(
  value: FormDataEntryValue | null,
  fieldErrors: Partial<Record<ProductFormField, string>>,
): ProductCondition {
  if (value === "new" || value === "used" || value === "refurbished") {
    return value;
  }

  fieldErrors.condition = "Selecciona una condicion valida.";
  return "new";
}

function parseAvailabilityType(
  value: FormDataEntryValue | null,
  fieldErrors: Partial<Record<ProductFormField, string>>,
): ProductAvailabilityType {
  if (value === "in_stock" || value === "made_to_order") {
    return value;
  }

  fieldErrors.availabilityType = "Selecciona una disponibilidad valida.";
  return "in_stock";
}

export function validateProductForm(formData: FormData): ProductValidationResult {
  const fieldErrors: Partial<Record<ProductFormField, string>> = {};
  const name = requireText(formData, "name", "Nombre", fieldErrors);
  const slug = slugifyProductName(
    requireText(formData, "slug", "Slug", fieldErrors),
  );
  const categoryId = normalizeOptionalText(formData.get("categoryId"));
  const categorySlug = normalizeOptionalText(formData.get("categorySlug"));
  const isActive = parseBooleanInput(formData.get("isActive"));
  const modelVariants = parseModelVariants(formData, fieldErrors, {
    requireColor: categorySlug === "fundas",
  });

  if (!categoryId) {
    fieldErrors.categoryId = "Selecciona una categoria.";
  }

  const priceValue = parsePositiveInteger(
    formData.get("price"),
    "price",
    "Precio",
    fieldErrors,
  );
  const previousPrice = parseNonNegativeInteger(
    formData.get("previousPrice"),
    "previousPrice",
    "Precio anterior",
    fieldErrors,
    { isRequired: false },
  );
  const stockInputValue = parseNonNegativeInteger(
    formData.get("stock"),
    "stock",
    "Stock",
    fieldErrors,
    { isRequired: true },
  );
  const stockValue =
    modelVariants.length > 0
      ? modelVariants.reduce((total, variant) => total + variant.stock, 0)
      : stockInputValue;
  const condition = parseCondition(formData.get("condition"), fieldErrors);
  const availabilityType = parseAvailabilityType(
    formData.get("availabilityType"),
    fieldErrors,
  );
  const batteryHealth = parseOptionalIntegerInRange(
    formData.get("batteryHealth"),
    "batteryHealth",
    "Bateria",
    fieldErrors,
    { max: 100, min: 1 },
  );
  const includedAccessories = parseLineSeparatedList(
    formData.get("includedAccessories"),
    "includedAccessories",
    "Accesorios incluidos",
    fieldErrors,
  );
  const brand = normalizeLimitedOptionalText(
    formData.get("brand"),
    "brand",
    "Marca",
    fieldErrors,
    80,
  );
  const cosmeticCondition = normalizeLimitedOptionalText(
    formData.get("cosmeticCondition"),
    "cosmeticCondition",
    "Estado cosmetico",
    fieldErrors,
    160,
  );
  const estimatedDeliveryText = normalizeLimitedOptionalText(
    formData.get("estimatedDeliveryText"),
    "estimatedDeliveryText",
    "Tiempo estimado",
    fieldErrors,
    180,
  );
  const model = normalizeLimitedOptionalText(
    formData.get("model"),
    "model",
    "Modelo",
    fieldErrors,
    120,
  );
  const storageCapacity = normalizeLimitedOptionalText(
    formData.get("storageCapacity"),
    "storageCapacity",
    "Capacidad",
    fieldErrors,
    40,
  );

  if (previousPrice !== null && priceValue !== null && previousPrice <= priceValue) {
    fieldErrors.previousPrice =
      "El precio anterior debe ser mayor que el precio actual.";
  }

  if (categorySlug === "fundas" && isActive && modelVariants.length === 0) {
    fieldErrors.modelVariants =
      "Agrega al menos un modelo disponible para una funda activa.";
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    priceValue === null ||
    stockValue === null
  ) {
    return { fieldErrors };
  }

  return {
    data: {
      availability_type: availabilityType,
      badge: normalizeOptionalText(formData.get("badge")),
      battery_health: batteryHealth,
      brand,
      category_id: categoryId,
      colors: parseCommaSeparatedList(formData.get("colors")),
      compatibility: parseCommaSeparatedList(formData.get("compatibility")),
      condition,
      cosmetic_condition: cosmeticCondition,
      description: normalizeOptionalText(formData.get("description")),
      estimated_delivery_text: estimatedDeliveryText,
      included_accessories: includedAccessories,
      is_active: isActive,
      is_featured: parseBooleanInput(formData.get("isFeatured")),
      model,
      name,
      previous_price: previousPrice,
      price: priceValue,
      short_description: normalizeOptionalText(formData.get("shortDescription")),
      slug,
      specifications: parseSpecifications(formData),
      stock: stockValue,
      storage_capacity: storageCapacity,
      technical_details: parseTechnicalDetails(formData),
      modelVariants,
    },
  };
}
