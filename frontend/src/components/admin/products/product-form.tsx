"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  DragEvent as ReactDragEvent,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import type { SpecificationRow } from "@/components/admin/products/specification-fields";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProductCategoryFormConfig,
} from "@/config/product-category-form-config";
import type { ProductImageWithUrl } from "@/lib/admin/catalog/images/types";
import {
  MAX_PRODUCT_IMAGE_COUNT,
  validateImageBatchPayloadSize,
  validateImageFile,
} from "@/lib/admin/catalog/images/validation";
import {
  initialProductFormState,
  type ProductFormField,
  type ProductFormState,
  type ProductWithCategory,
} from "@/lib/admin/catalog/types";
import { normalizeProductColorName } from "@/lib/catalog/product-colors";
import { slugifyProductName } from "@/lib/admin/catalog/validation";
import type {
  Category,
  Json,
  ProductAvailabilityType,
  ProductCondition,
} from "@/types/database";

type ProductFormProps = {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  categories: Array<Category>;
  existingImages?: Array<ProductImageWithUrl>;
  product?: ProductWithCategory;
  submitLabel: string;
};

type ProductStepId = "photos" | "info" | "price" | "compatibility" | "publish";

type ModelVariantRow = {
  brand: string;
  colorName: string;
  isActive: boolean;
  model: string;
  persistedId: string | null;
  rowId: string;
  stock: string;
};

type FieldErrors = Partial<Record<ProductFormField, string>>;

type LocalPhotoPreview = {
  file: File;
  id: string;
  key: string;
  name: string;
  url: string;
};

const steps: Array<{ id: ProductStepId; label: string; number: number }> = [
  { id: "photos", label: "Fotos", number: 1 },
  { id: "info", label: "Informacion", number: 2 },
  { id: "price", label: "Precio", number: 3 },
  { id: "compatibility", label: "Compatibilidad", number: 4 },
  { id: "publish", label: "Publicar", number: 5 },
];

const fieldStepMap: Partial<Record<ProductFormField, ProductStepId>> = {
  availabilityType: "price",
  badge: "publish",
  batteryHealth: "compatibility",
  brand: "info",
  categoryId: "info",
  colors: "compatibility",
  compatibility: "compatibility",
  condition: "info",
  cosmeticCondition: "compatibility",
  description: "info",
  estimatedDeliveryText: "compatibility",
  form: "publish",
  imageDeletion: "photos",
  isActive: "info",
  isFeatured: "publish",
  model: "compatibility",
  modelVariants: "compatibility",
  name: "info",
  previousPrice: "price",
  price: "price",
  stock: "price",
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function getStringRecord(value: Json): Record<string, string> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => {
      const [, entryValue] = entry;

      return typeof entryValue === "string";
    }),
  );
}

function getInitialSpecificationRows(
  product?: ProductWithCategory,
): Array<SpecificationRow> {
  if (!product) {
    return [];
  }

  return Object.entries(getStringRecord(product.specifications)).map(
    ([label, value], index) => ({
      id: `specification-${index + 1}`,
      label,
      value,
    }),
  );
}

function getInitialTechnicalDetailRows(
  product?: ProductWithCategory,
): Array<SpecificationRow> {
  if (!product) {
    return [];
  }

  return Object.entries(getStringRecord(product.technical_details)).map(
    ([label, value], index) => ({
      id: `technical-detail-${index + 1}`,
      label,
      value,
    }),
  );
}

function formatIncludedAccessories(product?: ProductWithCategory) {
  return product?.included_accessories.join("\n") ?? "";
}

function createModelVariantRowId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `model-variant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyModelVariantRow(): ModelVariantRow {
  return {
    brand: "",
    colorName: "",
    isActive: true,
    model: "",
    persistedId: null,
    rowId: createModelVariantRowId(),
    stock: "0",
  };
}

function getInitialModelVariantRows(
  product?: ProductWithCategory,
): Array<ModelVariantRow> {
  return (
    product?.modelVariants?.map((variant) => ({
      brand: variant.brand,
      colorName: variant.color_name ?? "",
      isActive: variant.is_active,
      model: variant.model,
      persistedId: variant.id,
      rowId: variant.id,
      stock: String(variant.stock),
    })) ?? []
  );
}

function getFallbackImageAltText(productName: string, index: number) {
  return `${productName} - imagen ${index + 1}`;
}

function createLocalPhotoPreview(file: File, index: number): LocalPhotoPreview {
  const key = `${file.name}-${file.lastModified}-${file.size}`;

  return {
    file,
    id: `${key}-${index}`,
    key,
    name: file.name,
    url: URL.createObjectURL(file),
  };
}

function getFieldErrorForStep(
  fieldErrors: FieldErrors,
  stepId: ProductStepId,
) {
  return Object.entries(fieldErrors).some(([fieldName]) => {
    return fieldStepMap[fieldName as ProductFormField] === stepId;
  });
}

function normalizeMoneyInput(value: string) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function parseInlineList(value: string) {
  const seen = new Set<string>();
  const items: Array<string> = [];

  value.split(",").forEach((rawItem) => {
    const item = rawItem.trim();
    const key = item.toLowerCase();

    if (item && !seen.has(key)) {
      seen.add(key);
      items.push(item);
    }
  });

  return items;
}

function getVariantCombinationKey(row: Pick<ModelVariantRow, "brand" | "model" | "colorName">) {
  return `${row.brand.trim().toLowerCase()}::${row.model.trim().toLowerCase()}::${normalizeProductColorName(row.colorName)}`;
}

function HiddenPreservedFields({
  product,
}: {
  product?: ProductWithCategory;
}) {
  const specificationRows = getInitialSpecificationRows(product);
  const technicalDetailRows = getInitialTechnicalDetailRows(product);

  return (
    <>
      <input
        name="shortDescription"
        readOnly
        type="hidden"
        value={product?.short_description ?? ""}
      />
      <input
        name="includedAccessories"
        readOnly
        type="hidden"
        value={formatIncludedAccessories(product)}
      />
      <input
        // Campo legacy de products.model: se preserva internamente para no borrar datos existentes.
        name="model"
        readOnly
        type="hidden"
        value={product?.model ?? ""}
      />
      <input
        name="storageCapacity"
        readOnly
        type="hidden"
        value={product?.storage_capacity ?? ""}
      />
      <input
        name="batteryHealth"
        readOnly
        type="hidden"
        value={product?.battery_health ?? ""}
      />
      <input
        name="cosmeticCondition"
        readOnly
        type="hidden"
        value={product?.cosmetic_condition ?? ""}
      />
      <input
        name="estimatedDeliveryText"
        readOnly
        type="hidden"
        value={product?.estimated_delivery_text ?? ""}
      />
      {specificationRows.map((row) => (
        <span aria-hidden="true" className="hidden" key={row.id}>
          <input name="specificationLabel" readOnly value={row.label} />
          <input name="specificationValue" readOnly value={row.value} />
        </span>
      ))}
      {technicalDetailRows.map((row) => (
        <span aria-hidden="true" className="hidden" key={row.id}>
          <input name="technicalDetailLabel" readOnly value={row.label} />
          <input name="technicalDetailValue" readOnly value={row.value} />
        </span>
      ))}
    </>
  );
}

function TextareaField({
  defaultValue,
  error,
  helperText,
  label,
  name,
  rows = 4,
}: {
  defaultValue?: string | null;
  error?: string;
  helperText?: string;
  label: string;
  name: string;
  rows?: number;
}) {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const helperId = helperText ? `${generatedId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-semibold text-foreground"
        htmlFor={generatedId}
      >
        {label}
      </label>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-32 w-full resize-y rounded-[22px] border border-border bg-surface px-4 py-3 text-sm font-normal leading-6 text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35",
          error && "border-destructive focus:border-destructive",
        )}
        defaultValue={defaultValue ?? ""}
        id={generatedId}
        name={name}
        rows={rows}
      />
      {error ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-muted-foreground" id={helperId}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  children,
  error,
  label,
  name,
  onChange,
  value,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;

  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-semibold text-foreground"
        htmlFor={generatedId}
      >
        {label}
      </label>
      <select
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-12 rounded-2xl border border-border bg-surface px-4 text-sm font-normal text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35",
          error && "border-destructive focus:border-destructive",
        )}
        id={generatedId}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      {error ? (
        <p className="text-sm font-medium text-destructive" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function WizardSteps({
  currentStep,
  highestVisitedStep,
  onSelectStep,
  stepErrors,
}: {
  currentStep: number;
  highestVisitedStep: number;
  onSelectStep: (stepIndex: number) => void;
  stepErrors: Partial<Record<ProductStepId, boolean>>;
}) {
  return (
    <nav aria-label="Progreso del producto" className="overflow-x-auto pb-1">
      <ol className="grid min-w-[680px] grid-cols-5 gap-3 md:min-w-0">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const isReachable = index <= highestVisitedStep;
          const hasError = stepErrors[step.id];

          return (
            <li key={step.id}>
              <button
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[22px] border px-3 py-3 text-left transition-all duration-[250ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive &&
                    "border-primary bg-secondary text-primary-hover shadow-[0_16px_34px_rgba(207,142,168,0.16)]",
                  isComplete &&
                    !isActive &&
                    "border-primary/25 bg-surface text-foreground",
                  !isActive &&
                    !isComplete &&
                    "border-border bg-surface-soft text-muted-foreground",
                  hasError && "border-destructive/45",
                )}
                disabled={!isReachable}
                onClick={() => onSelectStep(index)}
                type="button"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    isActive && "bg-primary text-primary-foreground",
                    isComplete && !isActive && "bg-primary/15 text-primary-hover",
                    !isActive && !isComplete && "bg-muted text-muted-foreground",
                    hasError && "bg-[#fff1f2] text-destructive",
                  )}
                >
                  {isComplete ? "✓" : step.number}
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {step.label}
                  </span>
                  <span className="block text-xs">
                    {hasError
                      ? "Revisar"
                      : isComplete
                        ? "Completo"
                        : isActive
                          ? "Actual"
                          : "Pendiente"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function WizardPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="space-y-7">
      <div className="max-w-3xl space-y-2">
        <h2 className="font-display text-3xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DraftSubmitButton({
  isEditing,
  onPrepareDraft,
}: {
  isEditing: boolean;
  onPrepareDraft: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={buttonStyles({
        className: "w-full sm:w-auto",
        size: "lg",
        variant: "secondary",
      })}
      disabled={pending}
      onClick={onPrepareDraft}
      type="submit"
    >
      {pending
        ? "Guardando"
        : isEditing
          ? "Guardar borrador"
          : "Guardar como borrador"}
    </button>
  );
}

function PublishSubmitButton({
  isEditing,
  onPreparePublish,
}: {
  isEditing: boolean;
  onPreparePublish: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={buttonStyles({
        className: "w-full sm:w-auto",
        size: "lg",
      })}
      disabled={pending}
      onClick={onPreparePublish}
      type="submit"
    >
      {pending
        ? "Publicando"
        : isEditing
          ? "Guardar cambios"
          : "Publicar producto"}
    </button>
  );
}

function SaveChangesButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={buttonStyles({
        className: "w-full sm:w-auto",
        size: "lg",
      })}
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando cambios" : "Guardar cambios"}
    </button>
  );
}

export function ProductForm({
  action,
  categories,
  existingImages = [],
  product,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialProductFormState);
  const isEditing = Boolean(product);
  const isWizardMode = !isEditing;
  const [currentStep, setCurrentStep] = useState(0);
  const [highestVisitedStep, setHighestVisitedStep] = useState(0);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugWasEdited] = useState(Boolean(product));
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    product?.category_id ?? "",
  );
  const [selectedCondition, setSelectedCondition] = useState<ProductCondition>(
    product?.condition ?? "new",
  );
  const [selectedAvailabilityType, setSelectedAvailabilityType] =
    useState<ProductAvailabilityType>(product?.availability_type ?? "in_stock");
  const [publicationState, setPublicationState] = useState(
    product?.is_active ? "published" : "draft",
  );
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [compatibilityText, setCompatibilityText] = useState(
    product?.compatibility.join(", ") ?? "",
  );
  const [colorsText, setColorsText] = useState(product?.colors.join(", ") ?? "");
  const [modelVariantRows, setModelVariantRows] = useState(
    getInitialModelVariantRows(product),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const localPhotoPreviewsRef = useRef<Array<LocalPhotoPreview>>([]);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [localPhotoError, setLocalPhotoError] = useState<string | null>(null);
  const [localPhotoPreviews, setLocalPhotoPreviews] = useState<
    Array<LocalPhotoPreview>
  >([]);
  const [primaryLocalPhotoKey, setPrimaryLocalPhotoKey] = useState("");
  const [stepErrors, setStepErrors] = useState<Partial<Record<ProductStepId, string>>>(
    {},
  );
  const isActiveInputRef = useRef<HTMLInputElement>(null);
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const selectedCategorySlug = selectedCategory?.slug ?? product?.category?.slug;
  const isCaseCategory = selectedCategorySlug === "fundas";
  const categoryConfig = getProductCategoryFormConfig(selectedCategorySlug);
  const fieldErrors = useMemo(() => state.fieldErrors ?? {}, [state.fieldErrors]);
  const usesModelVariantStock = isCaseCategory && modelVariantRows.length > 0;
  const modelVariantStockTotal = modelVariantRows.reduce((total, row) => {
    const stockValue = Number(row.stock);

    return row.isActive && Number.isInteger(stockValue) && stockValue >= 0
      ? total + stockValue
      : total;
  }, 0);
  const visibleStock = usesModelVariantStock
    ? modelVariantStockTotal
    : Number(stock) || 0;
  const priceValue = normalizeMoneyInput(price);
  const costValue = normalizeMoneyInput(cost);
  const profit =
    priceValue !== null && costValue !== null ? priceValue - costValue : null;
  const margin =
    profit !== null && priceValue !== null && priceValue > 0
      ? (profit / priceValue) * 100
      : null;
  const primaryImage =
    existingImages.find((image) => image.is_primary) ?? existingImages[0];
  const primaryLocalPhoto =
    localPhotoPreviews.find((preview) => preview.key === primaryLocalPhotoKey) ??
    localPhotoPreviews[0];
  const totalPhotoCount = existingImages.length + localPhotoPreviews.length;
  const selectedModelCount = new Set(
    modelVariantRows
      .filter((row) => row.brand.trim() && row.model.trim())
      .map((row) => `${row.brand.trim().toLowerCase()}::${row.model.trim().toLowerCase()}`),
  ).size;
  const selectedCombinationCount = modelVariantRows.filter(
    (row) => row.brand.trim() && row.model.trim() && row.colorName.trim(),
  ).length;
  const stepErrorsFromServer = useMemo(
    () =>
      Object.fromEntries(
        steps.map((step) => [
          step.id,
          getFieldErrorForStep(fieldErrors, step.id),
        ]),
      ) as Partial<Record<ProductStepId, boolean>>,
    [fieldErrors],
  );

  useEffect(() => {
    const preventFileDropNavigation = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
      }
    };

    window.addEventListener("dragover", preventFileDropNavigation);
    window.addEventListener("drop", preventFileDropNavigation);

    return () => {
      window.removeEventListener("dragover", preventFileDropNavigation);
      window.removeEventListener("drop", preventFileDropNavigation);
      localPhotoPreviewsRef.current.forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    };
  }, []);

  function handleNameChange(nextName: string) {
    setName(nextName);

    if (!slugWasEdited) {
      setSlug(slugifyProductName(nextName));
    }
  }

  function replaceLocalPhotoPreviews(nextPreviews: Array<LocalPhotoPreview>) {
    localPhotoPreviewsRef.current.forEach((preview) =>
      URL.revokeObjectURL(preview.url),
    );
    localPhotoPreviewsRef.current = nextPreviews;
    setLocalPhotoPreviews(nextPreviews);
    setPrimaryLocalPhotoKey((currentKey) => {
      if (nextPreviews.some((preview) => preview.key === currentKey)) {
        return currentKey;
      }

      return nextPreviews[0]?.key ?? "";
    });
    syncLocalPhotoInputFiles(nextPreviews);
  }

  function syncLocalPhotoInputFiles(nextPreviews: Array<LocalPhotoPreview>) {
    if (!fileInputRef.current || typeof DataTransfer === "undefined") {
      return;
    }

    const dataTransfer = new DataTransfer();
    nextPreviews.forEach((preview) => dataTransfer.items.add(preview.file));
    fileInputRef.current.files = dataTransfer.files;
  }

  function handleSelectedFiles(files: Array<File>) {
    const remainingCount = Math.max(
      MAX_PRODUCT_IMAGE_COUNT - existingImages.length,
      0,
    );
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const invalidFileMessage =
      files.length !== imageFiles.length
        ? "Solo podes seleccionar archivos de imagen."
        : imageFiles
            .map((file) => validateImageFile(file))
            .find((message) => message !== null) ??
          validateImageBatchPayloadSize(imageFiles);

    if (remainingCount === 0) {
      setLocalPhotoError("Este producto ya alcanzo el limite de imagenes.");
      replaceLocalPhotoPreviews([]);
      return;
    }

    if (invalidFileMessage) {
      setLocalPhotoError(invalidFileMessage);
      replaceLocalPhotoPreviews([]);
      return;
    }

    if (imageFiles.length > remainingCount) {
      setLocalPhotoError(
        `Podes agregar hasta ${remainingCount} ${
          remainingCount === 1 ? "imagen" : "imagenes"
        } mas.`,
      );
      replaceLocalPhotoPreviews([]);
      return;
    }

    setLocalPhotoError(null);
    replaceLocalPhotoPreviews(imageFiles.map(createLocalPhotoPreview));
  }

  function removeLocalPhotoPreview(previewId: string) {
    const previewToRemove = localPhotoPreviewsRef.current.find(
      (preview) => preview.id === previewId,
    );
    const nextPreviews = localPhotoPreviewsRef.current.filter(
      (preview) => preview.id !== previewId,
    );

    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove.url);
    }

    localPhotoPreviewsRef.current = nextPreviews;
    setLocalPhotoPreviews(nextPreviews);
    setPrimaryLocalPhotoKey((currentKey) => {
      if (nextPreviews.some((preview) => preview.key === currentKey)) {
        return currentKey;
      }

      return nextPreviews[0]?.key ?? "";
    });
    syncLocalPhotoInputFiles(nextPreviews);
  }

  function openPhotoSelector() {
    fileInputRef.current?.click();
  }

  function handlePhotoZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPhotoSelector();
    }
  }

  function handlePhotoDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsDraggingPhotos(true);
  }

  function handlePhotoDragOver(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  }

  function handlePhotoDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);

    if (dragDepthRef.current === 0) {
      setIsDraggingPhotos(false);
    }
  }

  function handlePhotoDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDraggingPhotos(false);
    handleSelectedFiles(Array.from(event.dataTransfer.files));
  }

  function handleCategoryChange(nextCategoryId: string) {
    const nextCategory = categories.find(
      (category) => category.id === nextCategoryId,
    );

    setSelectedCategoryId(nextCategoryId);

    if (nextCategory?.slug === "fundas" && modelVariantRows.length === 0) {
      setModelVariantRows([createEmptyModelVariantRow()]);
    }
  }

  function updateModelVariantRow(
    rowId: string,
    field: "brand" | "colorName" | "isActive" | "model" | "stock",
    value: boolean | string,
  ) {
    setModelVariantRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function removeModelVariantRow(rowId: string) {
    setModelVariantRows((currentRows) =>
      currentRows.filter((row) => row.rowId !== rowId),
    );
  }

  function generateModelColorCombinations() {
    const colors = parseInlineList(colorsText);
    const modelRows = modelVariantRows.filter(
      (row) => row.brand.trim() && row.model.trim(),
    );
    const sourceRows =
      modelRows.length > 0
        ? modelRows
        : parseInlineList(compatibilityText).map((model) => ({
            ...createEmptyModelVariantRow(),
            brand: product?.brand ?? "",
            model,
          }));
    const existingRowsByKey = new Map(
      modelVariantRows
        .filter((row) => row.brand.trim() && row.model.trim() && row.colorName.trim())
        .map((row) => [getVariantCombinationKey(row), row]),
    );
    const nextRows = [...modelVariantRows];

    sourceRows.forEach((modelRow) => {
      colors.forEach((colorName) => {
        const candidateRow = {
          ...modelRow,
          colorName,
        };
        const key = getVariantCombinationKey(candidateRow);

        if (existingRowsByKey.has(key)) {
          return;
        }

        nextRows.push({
          brand: modelRow.brand,
          colorName,
          isActive: true,
          model: modelRow.model,
          persistedId: null,
          rowId: createModelVariantRowId(),
          stock: "0",
        });
        existingRowsByKey.set(key, candidateRow);
      });
    });

    setModelVariantRows(nextRows);
  }

  function setSubmissionState(nextState: "draft" | "published") {
    setPublicationState(nextState);

    if (isActiveInputRef.current) {
      isActiveInputRef.current.value = nextState === "published" ? "true" : "";
    }
  }

  function validateCurrentStep() {
    const currentStepId = steps[currentStep]?.id;
    const nextErrors: Partial<Record<ProductStepId, string>> = {};

    if (currentStepId === "info") {
      if (!name.trim()) {
        nextErrors.info = "Completa el nombre del producto para continuar.";
      } else if (!selectedCategoryId) {
        nextErrors.info = "Selecciona una categoria para continuar.";
      }
    }

    if (currentStepId === "price") {
      if (priceValue === null || priceValue <= 0) {
        nextErrors.price = "El precio de venta debe ser mayor a 0.";
      } else if (!usesModelVariantStock) {
        const stockValue = Number(stock);

        if (!Number.isInteger(stockValue) || stockValue < 0) {
          nextErrors.price = "El stock debe ser un entero mayor o igual a 0.";
        }
      }
    }

    if (currentStepId === "compatibility" && isCaseCategory) {
      const hasIncompleteRow = modelVariantRows.some((row) => {
        return (
          row.brand.trim() ||
          row.model.trim() ||
          row.colorName.trim() ||
          row.stock.trim()
        ) && (!row.brand.trim() || !row.model.trim() || !row.colorName.trim());
      });

      if (hasIncompleteRow) {
        nextErrors.compatibility =
          "Completa marca, modelo y color en cada combinacion cargada.";
      }
    }

    setStepErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function goToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    setHighestVisitedStep((currentValue) => Math.max(currentValue, stepIndex));
  }

  function goNext() {
    if (!validateCurrentStep()) {
      return;
    }

    goToStep(Math.min(currentStep + 1, steps.length - 1));
  }

  return (
    <form action={formAction} className="mx-auto max-w-5xl space-y-8">
      <input
        name="categorySlug"
        readOnly
        type="hidden"
        value={selectedCategorySlug ?? ""}
      />
      <input name="slug" readOnly type="hidden" value={slug} />
      <input
        name="primaryImageKey"
        readOnly
        type="hidden"
        value={primaryLocalPhotoKey}
      />
      <input
        name="isActive"
        readOnly
        ref={isActiveInputRef}
        type="hidden"
        value={publicationState === "published" ? "true" : ""}
      />
      <HiddenPreservedFields product={product} />

      {isWizardMode ? (
        <WizardSteps
          currentStep={currentStep}
          highestVisitedStep={highestVisitedStep}
          onSelectStep={goToStep}
          stepErrors={stepErrorsFromServer}
        />
      ) : null}

      {fieldErrors.form ? (
        <div
          className="rounded-[24px] border border-destructive/25 bg-[#fff1f2] px-5 py-4 text-sm font-medium text-destructive"
          role="alert"
        >
          {fieldErrors.form}
        </div>
      ) : null}

      {stepErrors[steps[currentStep]?.id] ? (
        <div
          className="rounded-[24px] border border-destructive/25 bg-[#fff1f2] px-5 py-4 text-sm font-medium text-destructive"
          role="alert"
        >
          {stepErrors[steps[currentStep]?.id]}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-[32px] border border-border bg-surface p-5 shadow-[0_22px_60px_rgba(74,55,47,0.07)] sm:p-7 lg:p-9",
          !isWizardMode && "space-y-12",
        )}
      >
        <div className={isWizardMode && currentStep === 0 ? "block" : "hidden"}>
          <WizardPanel
            description={
              isEditing
                ? "Las imagenes guardadas se administran en la seccion real de imagenes del producto."
                : "Las fotos se suben automaticamente despues de crear el producto y quedan asociadas al catalogo real."
            }
            title="Fotos"
          >
            {!isEditing ? (
              <div
                aria-label="Seleccionar o arrastrar fotos del producto"
                className={cn(
                  "cursor-pointer rounded-[30px] border border-dashed px-5 py-9 text-center transition-all duration-[250ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8",
                  isDraggingPhotos
                    ? "border-primary bg-secondary shadow-[0_18px_42px_rgba(207,142,168,0.18)]"
                    : "border-primary/45 bg-secondary/50 hover:border-primary hover:bg-secondary/70",
                )}
                onClick={openPhotoSelector}
                onDragEnter={handlePhotoDragEnter}
                onDragLeave={handlePhotoDragLeave}
                onDragOver={handlePhotoDragOver}
                onDrop={handlePhotoDrop}
                onKeyDown={handlePhotoZoneKeyDown}
                role="button"
                tabIndex={0}
              >
                <input
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  multiple
                  name="images"
                  onChange={(event) => {
                    handleSelectedFiles(Array.from(event.target.files ?? []));
                  }}
                  ref={fileInputRef}
                  type="file"
                />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-surface text-primary-hover">
                  <svg
                    aria-hidden="true"
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect height="14" rx="3" strokeWidth="1.7" width="16" x="4" y="5" />
                    <path
                      d="m7 15 3-3 2.2 2.2 1.8-1.8 3 3M8 9.2h.01"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                </div>
                <p className="mt-5 font-display text-2xl font-semibold text-foreground">
                  {isDraggingPhotos
                    ? "Solta las fotos aca"
                    : "Arrastra las fotos del producto aca"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tambien podes seleccionarlas desde tu dispositivo.
                </p>
                <button
                  className={buttonStyles({
                    className: "mt-5",
                    size: "md",
                    variant: "secondary",
                  })}
                  onClick={(event) => {
                    event.stopPropagation();
                    openPhotoSelector();
                  }}
                  type="button"
                >
                  Seleccionar fotos
                </button>
                <p className="mx-auto mt-4 max-w-2xl rounded-[22px] bg-surface/80 px-5 py-3 text-sm leading-6 text-muted-foreground">
                  Al guardar, primero se crea el producto y despues se suben
                  estas imagenes con el ID real. La primera queda como principal.
                </p>
              </div>
            ) : (
              <div className="rounded-[28px] border border-primary/20 bg-secondary/45 px-5 py-5 text-sm leading-6 text-muted-foreground">
                Para sumar nuevas imagenes, ordenar miniaturas o marcar la
                principal, usa el gestor de imagenes que aparece debajo de este
                formulario. Desde aca solo podes marcar imagenes existentes para
                quitarlas al guardar.
              </div>
            )}

            {localPhotoError ? (
              <p
                aria-live="polite"
                className="rounded-[20px] border border-destructive/20 bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-destructive"
              >
                {localPhotoError}
              </p>
            ) : null}

            {localPhotoPreviews.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {localPhotoPreviews.map((preview, index) => (
                  <div
                    className="overflow-hidden rounded-[26px] border border-border bg-surface-soft"
                    key={preview.id}
                  >
                    <div className="relative aspect-square">
                      <Image
                        alt={`Vista previa ${index + 1}: ${preview.name}`}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 180px, 50vw"
                        src={preview.url}
                        unoptimized
                      />
                      {preview.key === primaryLocalPhotoKey ? (
                        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-primary-hover">
                          Principal
                        </span>
                      ) : null}
                      <button
                        aria-label={`Quitar imagen ${preview.name}`}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface/95 text-sm font-semibold text-foreground shadow-[0_10px_22px_rgba(74,55,47,0.14)] transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-destructive/35 hover:bg-[#fff1f2] hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
                        onClick={() => removeLocalPhotoPreview(preview.id)}
                        type="button"
                      >
                        X
                      </button>
                    </div>
                    <p className="truncate px-3 py-2 text-xs font-medium text-muted-foreground">
                      {preview.name}
                    </p>
                    <button
                      className="mx-3 mb-3 h-9 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-primary-hover transition-colors duration-[250ms] hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={preview.key === primaryLocalPhotoKey}
                      onClick={() => setPrimaryLocalPhotoKey(preview.key)}
                      type="button"
                    >
                      {preview.key === primaryLocalPhotoKey
                        ? "Imagen principal"
                        : "Usar como principal"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {existingImages.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {existingImages.map((image, index) => (
                  <label
                    className="group overflow-hidden rounded-[26px] border border-border bg-surface-soft"
                    key={image.id}
                  >
                    <div className="relative aspect-square bg-surface-soft">
                      {image.publicUrl ? (
                        <Image
                          alt={
                            image.alt_text ||
                            getFallbackImageAltText(product?.name ?? name, index)
                          }
                          className="object-cover"
                          fill
                          sizes="(min-width: 1024px) 180px, 50vw"
                          src={image.publicUrl}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                          Vista previa no disponible
                        </div>
                      )}
                      {image.is_primary ? (
                        <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-primary-hover">
                          Principal
                        </span>
                      ) : null}
                    </div>
                    <span className="flex items-start gap-3 p-4 text-sm font-semibold text-foreground">
                      <input
                        className="mt-1 h-4 w-4 rounded border-border accent-primary"
                        name="deleteImageIds"
                        type="checkbox"
                        value={image.id}
                      />
                      <span>
                        Quitar al guardar
                        <span className="block text-xs font-normal leading-5 text-muted-foreground">
                          Imagen #{index + 1}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
            {fieldErrors.imageDeletion ? (
              <p className="text-sm font-semibold text-destructive">
                {fieldErrors.imageDeletion}
              </p>
            ) : null}
          </WizardPanel>
        </div>

        <div className={isWizardMode ? (currentStep === 1 ? "block" : "hidden") : "block"}>
          <WizardPanel
            description="Carga solo la informacion esencial para identificar el producto."
            title="Informacion"
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                autoComplete="off"
                error={fieldErrors.name}
                label="Nombre del producto"
                maxLength={120}
                name="name"
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Funda Labubu rosa pastel"
                required
                value={name}
              />
              <SelectField
                error={fieldErrors.categoryId}
                label="Categoria"
                name="categoryId"
                onChange={handleCategoryChange}
                value={selectedCategoryId}
              >
                <option value="">Seleccionar categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                autoComplete="organization"
                error={fieldErrors.brand}
                label="Marca"
                name="brand"
                placeholder="Apple, Samsung, W.todocell"
                defaultValue={product?.brand ?? ""}
              />
              <SelectField
                error={fieldErrors.condition}
                label="Estado"
                name="condition"
                onChange={(value) =>
                  setSelectedCondition(value as ProductCondition)
                }
                value={selectedCondition}
              >
                <option value="new">Nuevo</option>
                <option value="used">Usado</option>
                <option value="refurbished">Reacondicionado</option>
              </SelectField>
            </div>

            <TextareaField
              defaultValue={product?.description}
              error={fieldErrors.description}
              helperText="Describe el estilo, materiales, compatibilidad general y detalles que ayuden a vender."
              label="Descripcion"
              name="description"
              rows={7}
            />

            <SelectField
              error={fieldErrors.isActive}
              label="Estado de publicacion"
              name="publicationState"
              onChange={(value) =>
                setSubmissionState(value === "published" ? "published" : "draft")
              }
              value={publicationState}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </SelectField>
          </WizardPanel>
        </div>

        <div className={isWizardMode ? (currentStep === 2 ? "block" : "hidden") : "block"}>
          <WizardPanel
            description="Define precio, ganancia estimada y stock sin tocar reglas de checkout."
            title="Precio"
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <Input
                helperText="No se muestra al cliente."
                label="Costo"
                min={0}
                name="adminCost"
                onChange={(event) => setCost(event.target.value)}
                placeholder="0"
                step={1}
                type="number"
                value={cost}
              />
              <Input
                error={fieldErrors.price}
                label="Precio de venta"
                min={0}
                name="price"
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0"
                required
                step={1}
                type="number"
                value={price}
              />
              <Input
                error={fieldErrors.previousPrice}
                label="Precio anterior"
                min={0}
                name="previousPrice"
                step={1}
                type="number"
                defaultValue={product?.previous_price ?? ""}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] border border-border bg-surface-soft p-5">
                <p className="text-sm text-muted-foreground">Ganancia estimada</p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  {profit === null
                    ? "Pendiente"
                    : formatAdminCurrency(profit)}
                </p>
                {profit === null ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Completa el costo para calcular la ganancia.
                  </p>
                ) : null}
              </div>
              <div className="rounded-[24px] border border-border bg-surface-soft p-5">
                <p className="text-sm text-muted-foreground">Margen estimado</p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  {margin === null ? "Pendiente" : `${margin.toFixed(1)}%`}
                </p>
              </div>
              <div className="rounded-[24px] border border-border bg-surface-soft p-5">
                <p className="text-sm text-muted-foreground">Moneda</p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  ARS
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <SelectField
                error={fieldErrors.availabilityType}
                label="Disponibilidad"
                name="availabilityType"
                onChange={(value) =>
                  setSelectedAvailabilityType(value as ProductAvailabilityType)
                }
                value={selectedAvailabilityType}
              >
                <option value="in_stock">Stock inmediato</option>
                <option value="made_to_order">Por encargo</option>
              </SelectField>
              <Input
                error={fieldErrors.stock}
                helperText={
                  usesModelVariantStock
                    ? "Se calcula automaticamente con los modelos disponibles."
                    : "Numero entero, sin negativos."
                }
                label="Stock"
                min={0}
                name="stock"
                onChange={(event) => setStock(event.target.value)}
                readOnly={usesModelVariantStock}
                required
                step={1}
                type="number"
                value={usesModelVariantStock ? modelVariantStockTotal : stock}
              />
            </div>
          </WizardPanel>
        </div>

        <div className={isWizardMode ? (currentStep === 3 ? "block" : "hidden") : "block"}>
          <WizardPanel
            description={categoryConfig.description}
            title="Compatibilidad"
          >
            {isCaseCategory ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-[24px] border border-primary/20 bg-secondary/45 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl font-semibold text-foreground">
                      Modelos disponibles
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedModelCount} modelos / {selectedCombinationCount} combinaciones.
                    </p>
                  </div>
                  <div className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-primary-hover">
                    Stock total: {modelVariantStockTotal} unidades
                  </div>
                </div>

                {fieldErrors.modelVariants ? (
                  <p className="rounded-[20px] border border-destructive/20 bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-destructive">
                    {fieldErrors.modelVariants}
                  </p>
                ) : null}

                <div className="rounded-[24px] border border-border bg-surface-soft p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Generar matriz modelo + color
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Usa los modelos cargados y los colores del campo Colores. Conserva el stock existente.
                      </p>
                    </div>
                    <Button
                      onClick={generateModelColorCombinations}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Generar combinaciones
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {modelVariantRows.map((row, index) => (
                    <div
                      className="grid gap-3 rounded-[24px] border border-border bg-surface-soft p-4 lg:grid-cols-[1fr_1fr_1fr_120px_120px_auto] lg:items-start"
                      key={row.rowId}
                    >
                      <input
                        name="modelVariantId"
                        readOnly
                        type="hidden"
                        value={row.persistedId ?? ""}
                      />
                      <select
                        className="h-12 rounded-2xl border border-border bg-surface px-4 text-sm font-normal text-foreground shadow-[0_10px_24px_rgba(74,55,47,0.04)] transition-all duration-[250ms] focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/35 lg:mt-7"
                        name="modelVariantIsActive"
                        onChange={(event) =>
                          updateModelVariantRow(
                            row.rowId,
                            "isActive",
                            event.target.value === "true",
                          )
                        }
                        value={row.isActive ? "true" : "false"}
                      >
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                      <Input
                        label="Marca"
                        name="modelVariantBrand"
                        onChange={(event) =>
                          updateModelVariantRow(
                            row.rowId,
                            "brand",
                            event.target.value,
                          )
                        }
                        placeholder="Apple, Samsung"
                        value={row.brand}
                      />
                      <Input
                        label="Modelo"
                        name="modelVariantModel"
                        onChange={(event) =>
                          updateModelVariantRow(
                            row.rowId,
                            "model",
                            event.target.value,
                          )
                        }
                        placeholder="iPhone 16 Pro"
                        value={row.model}
                      />
                      <Input
                        label="Color"
                        name="modelVariantColor"
                        onChange={(event) =>
                          updateModelVariantRow(
                            row.rowId,
                            "colorName",
                            event.target.value,
                          )
                        }
                        placeholder="Rosa"
                        value={row.colorName}
                      />
                      <Input
                        label="Stock"
                        min={0}
                        name="modelVariantStock"
                        onChange={(event) =>
                          updateModelVariantRow(
                            row.rowId,
                            "stock",
                            event.target.value,
                          )
                        }
                        step={1}
                        type="number"
                        value={row.stock}
                      />
                      <button
                        aria-label={`Quitar modelo ${
                          row.brand || row.model || index + 1
                        }`}
                        className="h-12 rounded-full border border-border px-4 text-sm font-semibold text-muted-foreground transition-all duration-[250ms] hover:-translate-y-0.5 hover:border-destructive/35 hover:bg-[#fff1f2] hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 lg:mt-7"
                        onClick={() => removeModelVariantRow(row.rowId)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() =>
                    setModelVariantRows((currentRows) => [
                      ...currentRows,
                      createEmptyModelVariantRow(),
                    ])
                  }
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  + Agregar modelo
                </Button>
              </div>
            ) : (
              <div className="rounded-[24px] border border-border bg-surface-soft p-5">
                <p className="font-display text-xl font-semibold text-foreground">
                  Este producto no requiere compatibilidad con modelos
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Si la categoria lo permite, podes cargar compatibilidades y
                  colores como informacion comercial adicional.
                </p>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                error={fieldErrors.compatibility}
                helperText="Separa cada compatibilidad con una coma."
                label="Compatibilidades"
                name="compatibility"
                onChange={(event) => setCompatibilityText(event.target.value)}
                placeholder="iPhone 16 Pro Max, iPhone 16 Pro"
                value={compatibilityText}
              />
              <Input
                error={fieldErrors.colors}
                helperText="Separa cada color con una coma."
                label="Colores"
                name="colors"
                onChange={(event) => setColorsText(event.target.value)}
                placeholder="Rosa soft, Crema, Blanco"
                value={colorsText}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                error={fieldErrors.badge}
                label="Badge"
                name="badge"
                placeholder="Nuevo, Oferta, Favorito"
                defaultValue={product?.badge ?? ""}
              />
              <label className="flex items-start gap-3 rounded-[22px] border border-border bg-surface-soft p-4 text-sm font-medium text-foreground">
                <input
                  className="mt-1 h-4 w-4 rounded border-border accent-primary"
                  defaultChecked={product?.is_featured ?? false}
                  name="isFeatured"
                  type="checkbox"
                />
                <span>
                  Producto destacado
                  <span className="block text-sm font-normal text-muted-foreground">
                    Preparado para secciones destacadas.
                  </span>
                </span>
              </label>
            </div>
          </WizardPanel>
        </div>

        <div className={isWizardMode && currentStep === 4 ? "block" : "hidden"}>
          <WizardPanel
            description="Revisa todo antes de guardar. Podes volver a cualquier paso sin perder datos."
            title="Publicar"
          >
            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <div className="overflow-hidden rounded-[28px] border border-border bg-surface-soft">
                <div className="relative aspect-square">
                  {primaryLocalPhoto ? (
                    <Image
                      alt={`Vista previa principal: ${primaryLocalPhoto.name}`}
                      className="object-cover"
                      fill
                      sizes="280px"
                      src={primaryLocalPhoto.url}
                      unoptimized
                    />
                  ) : primaryImage?.publicUrl ? (
                    <Image
                      alt={
                        primaryImage.alt_text ||
                        getFallbackImageAltText(product?.name ?? name, 0)
                      }
                      className="object-cover"
                      fill
                      sizes="280px"
                      src={primaryImage.publicUrl}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Sin imagen principal todavia
                    </div>
                  )}
                </div>
                <div className="p-4 text-sm text-muted-foreground">
                  {totalPhotoCount} fotos cargadas o listas para subir
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  ["Nombre", name || "Sin nombre"],
                  ["Categoria", selectedCategory?.name ?? "Sin categoria"],
                  ["Marca", "Se guarda desde el campo Marca"],
                  [
                    "Precio",
                    priceValue === null ? "Pendiente" : formatAdminCurrency(priceValue),
                  ],
                  [
                    "Costo",
                    costValue === null
                      ? "Completa el costo para calcular la ganancia"
                      : formatAdminCurrency(costValue),
                  ],
                  [
                    "Ganancia estimada",
                    profit === null ? "Pendiente" : formatAdminCurrency(profit),
                  ],
                  ["Stock", `${visibleStock} unidades`],
                  ["Modelos compatibles", String(selectedModelCount)],
                  [
                    "Estado final",
                    publicationState === "published" ? "Publicado" : "Borrador",
                  ],
                ].map(([label, value]) => (
                  <div
                    className="flex flex-col gap-1 rounded-[22px] border border-border bg-surface-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    key={label}
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {steps.slice(0, 4).map((step, index) => (
                <Button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  type="button"
                  variant="secondary"
                >
                  Editar {step.label.toLowerCase()}
                </Button>
              ))}
            </div>
          </WizardPanel>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 border-t border-border bg-background/90 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className={buttonStyles({
              className: "w-full sm:w-auto",
              size: "lg",
              variant: "ghost",
            })}
            href="/admin/productos"
          >
            Cancelar
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isWizardMode ? (
              <>
                <Button
                  className="w-full sm:w-auto"
                  disabled={currentStep === 0}
                  onClick={() => goToStep(Math.max(currentStep - 1, 0))}
                  size="lg"
                  type="button"
                  variant="secondary"
                >
                  Atras
                </Button>
                <DraftSubmitButton
                  isEditing={isEditing}
                  onPrepareDraft={() => setSubmissionState("draft")}
                />
                {currentStep < steps.length - 1 ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={goNext}
                    size="lg"
                    type="button"
                  >
                    Continuar
                  </Button>
                ) : (
                  <PublishSubmitButton
                    isEditing={isEditing}
                    onPreparePublish={() => setSubmissionState("published")}
                  />
                )}
              </>
            ) : (
              <SaveChangesButton />
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
