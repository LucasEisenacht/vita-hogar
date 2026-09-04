"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import type { PublicProduct, PublicProductModelVariant } from "@/lib/catalog/types";
import {
  getProductPurchaseLimit,
  isInStockProductAvailable,
  isMadeToOrder,
} from "@/lib/catalog/commerce";
import {
  getProductColorHex,
  normalizeProductColorName,
} from "@/lib/catalog/product-colors";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

type AddToCartPanelProps = {
  onSelectedColorChange?: (colorName: string) => void;
  product: PublicProduct;
  selectedColor?: string;
};

export function AddToCartPanel({
  onSelectedColorChange,
  product,
  selectedColor: controlledSelectedColor,
}: AddToCartPanelProps) {
  const { addProduct } = useCart();
  const [internalSelectedColor, setInternalSelectedColor] = useState(
    product.colors[0]?.name,
  );
  const selectedColor = controlledSelectedColor ?? internalSelectedColor;
  const activeModelVariants = product.modelVariants.filter(
    (variant) => variant.isActive,
  );
  const hasModelVariants = activeModelVariants.length > 0;
  const firstAvailableVariant = activeModelVariants.find(
    (variant) => variant.stock > 0,
  );
  const usesColorModelVariants = activeModelVariants.some(
    (variant) => variant.colorKey,
  );
  const modelOptions = Array.from(
    new Map(
      activeModelVariants.map((variant) => [
        `${variant.brand}::${variant.model}`,
        {
          brand: variant.brand,
          key: `${variant.brand}::${variant.model}`,
          model: variant.model,
        },
      ]),
    ).values(),
  );
  const [selectedModelVariantId, setSelectedModelVariantId] = useState(
    firstAvailableVariant?.id,
  );
  const [selectedModelKey, setSelectedModelKey] = useState(
    firstAvailableVariant
      ? `${firstAvailableVariant.brand}::${firstAvailableVariant.model}`
      : modelOptions[0]?.key,
  );
  const [selectedCompatibility, setSelectedCompatibility] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const selectedModelVariant = usesColorModelVariants
    ? activeModelVariants.find((variant) => {
        return (
          `${variant.brand}::${variant.model}` === selectedModelKey &&
          variant.colorKey ===
            (selectedColor ? normalizeProductColorName(selectedColor) : "")
        );
      })
    : activeModelVariants.find((variant) => variant.id === selectedModelVariantId);
  const effectiveStock = hasModelVariants
    ? selectedModelVariant?.stock ?? 0
    : product.stock;
  const productForCart: PublicProduct = {
    ...product,
    stock: effectiveStock,
  };
  const purchaseLimit = getProductPurchaseLimit(productForCart);
  const isOutOfStock = hasModelVariants
    ? !selectedModelVariant || selectedModelVariant.stock <= 0
    : !isInStockProductAvailable(product);
  const compatibilityOptions = product.compatibility ?? [];
  const requiresCompatibility =
    !hasModelVariants && compatibilityOptions.length > 0;
  const displayQuantity = Math.min(
    Math.max(1, quantity),
    Math.max(1, purchaseLimit),
  );
  const canAdd = Boolean(
    !isOutOfStock &&
      (!hasModelVariants || selectedModelVariant) &&
      (!requiresCompatibility || selectedCompatibility),
  );

  const compatibilityMessage = (() => {
    if (!requiresCompatibility || selectedCompatibility) {
      return "";
    }

    return "Elegi una compatibilidad para agregar este producto.";
  })();

  const modelVariantMessage = (() => {
    if (!hasModelVariants) {
      return "";
    }

    if (!selectedModelVariant) {
      return usesColorModelVariants
        ? "Esta combinacion de modelo y color no esta disponible."
        : "Elegi tu modelo para agregar este producto.";
    }

    if (selectedModelVariant.stock <= 0) {
      return "Ese modelo esta sin stock.";
    }

    return "";
  })();

  function getModelVariantStockLabel(variant: PublicProductModelVariant) {
    if (!variant.isActive || variant.stock <= 0) {
      return "Sin stock";
    }

    return variant.stock <= 3 ? "Ultimas unidades" : "En stock";
  }

  function decreaseQuantity() {
    setQuantity(Math.max(1, displayQuantity - 1));
  }

  function increaseQuantity() {
    setQuantity(Math.min(purchaseLimit, displayQuantity + 1));
  }

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    if (!canAdd) {
      setMessage(
        modelVariantMessage ||
          compatibilityMessage ||
          "Este producto no se puede agregar por ahora.",
      );
      return;
    }

    const originRect = event.currentTarget.getBoundingClientRect();
    const quantityToAdd = Math.min(displayQuantity, purchaseLimit);

    addProduct({
      animationOrigin: {
        x: originRect.left + originRect.width / 2,
        y: originRect.top + originRect.height / 2,
      },
      product: productForCart,
      quantity: quantityToAdd,
      selectedModel: selectedModelVariant?.model,
      selectedModelBrand: selectedModelVariant?.brand,
      selectedColor,
      selectedCompatibility: selectedModelVariant
        ? `${selectedModelVariant.brand} ${selectedModelVariant.model}`
        : selectedCompatibility,
      variantId: selectedModelVariant?.id,
    });
    setMessage(
      `${quantityToAdd} unidad${quantityToAdd > 1 ? "es" : ""} agregada al carrito.`,
    );
  }

  function handleColorSelection(colorName: string) {
    setInternalSelectedColor(colorName);
    onSelectedColorChange?.(colorName);
  }

  function modelHasColor(modelKey: string, colorName?: string) {
    if (!usesColorModelVariants || !colorName) {
      return true;
    }

    const colorKey = normalizeProductColorName(colorName);

    return activeModelVariants.some(
      (variant) =>
        `${variant.brand}::${variant.model}` === modelKey &&
        variant.colorKey === colorKey,
    );
  }

  function colorHasModel(colorName: string) {
    if (!usesColorModelVariants || !selectedModelKey) {
      return true;
    }

    return modelHasColor(selectedModelKey, colorName);
  }

  return (
    <div className="space-y-5">
      {product.colors.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-foreground">
              Color
            </h2>
            {selectedColor ? (
              <p className="text-sm font-semibold text-muted-foreground">
                {selectedColor}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => {
              const isSelected = color.name === selectedColor;
              const isDisabled = !colorHasModel(color.name);

              return (
                <button
                  aria-label={`Color ${color.name}`}
                  aria-pressed={isSelected}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border bg-white/48 transition-all duration-[250ms] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isSelected
                      ? "border-primary shadow-[0_10px_24px_rgba(207,142,168,0.2)] ring-2 ring-ring/25"
                      : "border-white/62 hover:border-primary"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                  disabled={isDisabled}
                  key={color.name}
                  onClick={() => handleColorSelection(color.name)}
                  type="button"
                >
                  <span
                    className="h-8 w-8 rounded-full border border-white/80 shadow-[inset_0_0_0_1px_rgba(74,55,47,0.08)]"
                    style={{ backgroundColor: color.hex ?? getProductColorHex(color.name) }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasModelVariants ? (
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold text-foreground">
            Elegi tu modelo
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {(usesColorModelVariants ? modelOptions : activeModelVariants).map((option) => {
              const variant =
                "id" in option
                  ? option
                  : activeModelVariants.find(
                      (item) =>
                        `${item.brand}::${item.model}` === option.key &&
                        (!selectedColor ||
                          item.colorKey === normalizeProductColorName(selectedColor)),
                    );
              const optionKey = "id" in option ? option.id : option.key;
              const isSelected = usesColorModelVariants
                ? optionKey === selectedModelKey
                : optionKey === selectedModelVariantId;
              const isDisabled = usesColorModelVariants
                ? !modelHasColor(optionKey, selectedColor)
                : !variant || variant.stock <= 0 || !variant.isActive;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`inline-flex min-h-11 items-center justify-between gap-3 rounded-full border px-4 py-2.5 text-left text-sm transition-all duration-[250ms] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 ${
                    isSelected
                      ? "border-primary bg-secondary text-primary-hover shadow-[0_10px_22px_rgba(207,142,168,0.15)]"
                      : "border-white/62 bg-white/44 text-foreground hover:border-primary hover:bg-white/68 hover:text-primary-hover"
                  }`}
                  disabled={isDisabled}
                  key={optionKey}
                  onClick={() => {
                    if ("id" in option) {
                      setSelectedModelVariantId(option.id);
                    } else {
                      setSelectedModelKey(option.key);
                    }
                  }}
                  type="button"
                >
                  <span className="font-semibold">
                    {option.brand} {option.model}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {variant
                      ? getModelVariantStockLabel(variant)
                      : "No disponible"}
                  </span>
                </button>
              );
            })}
          </div>
          {modelVariantMessage ? (
            <p className="text-sm font-medium text-warning">
              {modelVariantMessage}
            </p>
          ) : null}
        </div>
      ) : requiresCompatibility ? (
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold text-foreground">
            Compatibilidad
          </h2>
          <div className="flex flex-wrap gap-2">
            {compatibilityOptions.map((item) => {
              const isSelected = item === selectedCompatibility;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-[250ms] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isSelected
                      ? "border-primary bg-secondary text-primary-hover"
                      : "border-white/62 bg-white/44 text-muted-foreground hover:border-primary hover:text-primary-hover"
                  }`}
                  key={item}
                  onClick={() => setSelectedCompatibility(item)}
                  type="button"
                >
                  {item}
                </button>
              );
            })}
          </div>
          {compatibilityMessage ? (
            <p className="text-sm font-medium text-warning">{compatibilityMessage}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Cantidad
        </h2>
        <div className="inline-flex items-center rounded-full border border-white/62 bg-white/46 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <button
            aria-label="Reducir cantidad"
            className="h-9 w-9 rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
            disabled={displayQuantity <= 1}
            onClick={decreaseQuantity}
            type="button"
          >
            -
          </button>
          <span className="w-10 text-center text-sm font-semibold">
            {displayQuantity}
          </span>
          <button
            aria-label="Aumentar cantidad"
            className="h-9 w-9 rounded-full text-muted-foreground transition-colors duration-[250ms] hover:bg-surface-soft hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
            disabled={displayQuantity >= purchaseLimit}
            onClick={increaseQuantity}
            type="button"
          >
            +
          </button>
        </div>
        {effectiveStock === 1 && !isMadeToOrder(product) ? (
          <p className="text-sm font-semibold text-warning">Ultima unidad</p>
        ) : null}
        {isMadeToOrder(product) ? (
          <p className="text-sm font-semibold text-primary-hover">
            Producto por encargo. Coordinamos tiempos por WhatsApp.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <Button
          className="h-14 w-full text-base"
          disabled={!canAdd}
          onClick={handleAddToCart}
          size="lg"
        >
          Agregar al carrito
        </Button>
        <a
          className="inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-primary-hover transition-colors duration-[250ms] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          href="#product-purchase-panel"
        >
          Comprar ahora
        </a>
      </div>

      <p
        aria-live="polite"
        className="min-h-6 text-sm font-semibold text-primary-hover"
      >
        {message}
      </p>
    </div>
  );
}
