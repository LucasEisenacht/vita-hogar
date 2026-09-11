"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ENABLE_MINI_CART } from "@/config/mini-cart";
import { getProductPurchaseLimit } from "@/lib/catalog/commerce";
import type { PublicProduct, PublicProductImage } from "@/lib/catalog/types";
import type {
  ProductAvailabilityType,
  ProductCondition,
} from "@/types/database";

const CART_STORAGE_KEY = "wtodocell-cart";
const CART_STORAGE_VERSION = 2;

export type CartItem = {
  availabilityType: ProductAvailabilityType;
  condition?: ProductCondition;
  estimatedDeliveryText?: string;
  image?: CartItemImage;
  name: string;
  price: number;
  productId: string;
  quantity: number;
  selectedModel?: string;
  selectedModelBrand?: string;
  selectedColor?: string;
  selectedCompatibility?: string;
  slug: string;
  stock: number;
  variantId?: string;
};

export type CartItemImage = {
  accent?: string;
  alt: string;
  id: string;
  tone?: string;
  url?: string;
};

export type AddCartItemInput = {
  animationOrigin?: CartAnimationPoint;
  product: PublicProduct;
  quantity: number;
  selectedModel?: string;
  selectedModelBrand?: string;
  selectedColor?: string;
  selectedCompatibility?: string;
  variantId?: string;
};

type CartAnimationPoint = {
  x: number;
  y: number;
};

type CartAnimationState = {
  from: CartAnimationPoint;
  id: number;
  image?: CartItemImage;
  name: string;
  to: CartAnimationPoint;
};

type CartContextValue = {
  addProduct: (input: AddCartItemInput) => void;
  clearCart: () => void;
  closeMiniCart: () => void;
  getLineId: (
    item: Pick<
      CartItem,
      "productId" | "selectedColor" | "selectedCompatibility" | "variantId"
    >,
  ) => string;
  isMiniCartOpen: boolean;
  items: CartItem[];
  lastAddedLineId?: string;
  openMiniCart: () => void;
  removeProduct: (lineId: string) => void;
  subtotal: number;
  totalItems: number;
  updateQuantity: (lineId: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function getCartTargetPoint(): CartAnimationPoint {
  const cartTarget = document.querySelector<HTMLAnchorElement>('a[href="/carrito"]');
  const targetRect = cartTarget?.getBoundingClientRect();

  if (targetRect) {
    return {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };
  }

  return {
    x: window.innerWidth - 36,
    y: 36,
  };
}

function getLineId({
  productId,
  selectedColor,
  selectedCompatibility,
  variantId,
}: Pick<CartItem, "productId" | "selectedColor" | "selectedCompatibility" | "variantId">) {
  return [
    normalizeIdentityPart(productId, "sin-producto"),
    normalizeIdentityPart(variantId, "sin-variante"),
    normalizeIdentityPart(selectedColor, "sin-color"),
    normalizeIdentityPart(selectedCompatibility, "sin-compatibilidad"),
  ].join("::");
}

function normalizeOptionalCartText(value: string | undefined) {
  const normalizedValue = value?.replace(/\s+/g, " ").trim();

  return normalizedValue || undefined;
}

function normalizeIdentityPart(value: string | undefined, fallback: string) {
  return normalizeOptionalCartText(value)?.toLowerCase() ?? fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCartImageUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/");
}

function isProductImage(value: unknown): value is CartItemImage {
  if (!isRecord(value)) {
    return false;
  }

  const hasCoreImageData =
    typeof value.alt === "string" && typeof value.id === "string";
  const hasPublicImage =
    typeof value.url === "string" || value.url === undefined;
  const hasLegacyPlaceholder =
    (typeof value.accent === "string" || value.accent === undefined) &&
    (typeof value.tone === "string" || value.tone === undefined);

  return hasCoreImageData && hasPublicImage && hasLegacyPlaceholder;
}

function isProductAvailabilityType(
  value: unknown,
): value is ProductAvailabilityType {
  return value === "in_stock" || value === "made_to_order";
}

function isProductCondition(value: unknown): value is ProductCondition {
  return value === "new" || value === "used" || value === "refurbished";
}

function isCartItem(value: unknown): value is CartItem {
  return (
    isRecord(value) &&
    (value.availabilityType === undefined ||
      isProductAvailabilityType(value.availabilityType)) &&
    (value.condition === undefined || isProductCondition(value.condition)) &&
    (typeof value.estimatedDeliveryText === "string" ||
      value.estimatedDeliveryText === undefined) &&
    (value.image === undefined || isProductImage(value.image)) &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    typeof value.productId === "string" &&
    typeof value.quantity === "number" &&
    typeof value.slug === "string" &&
    typeof value.stock === "number" &&
    (typeof value.selectedModel === "string" || value.selectedModel === undefined) &&
    (typeof value.selectedModelBrand === "string" ||
      value.selectedModelBrand === undefined) &&
    (typeof value.selectedColor === "string" || value.selectedColor === undefined) &&
    (typeof value.selectedCompatibility === "string" ||
      value.selectedCompatibility === undefined) &&
    (typeof value.variantId === "string" || value.variantId === undefined)
  );
}

function getCartItemImage(product: PublicProduct): CartItemImage | undefined {
  const image: PublicProductImage | undefined = product.primaryImage;

  if (!image?.url || !isSafeCartImageUrl(image.url)) {
    return undefined;
  }

  return {
    alt: image.alt,
    id: image.id,
    url: image.url,
  };
}

function getCartItemQuantityLimit(
  item: Pick<CartItem, "availabilityType" | "stock">,
) {
  return item.availabilityType === "made_to_order" ? 10 : Math.max(1, item.stock);
}

function CartFlyToTargetAnimation({
  animation,
  onComplete,
}: {
  animation: CartAnimationState;
  onComplete: () => void;
}) {
  const animationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = animationRef.current;

    if (!element) {
      onComplete();
      return;
    }

    const distanceX = animation.to.x - animation.from.x;
    const distanceY = animation.to.y - animation.from.y;
    let arrivalSparkTimeoutId: number | undefined;
    const flyAnimation = element.animate(
      [
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1)",
        },
        {
          offset: 0.56,
          opacity: 0.92,
          transform: `translate3d(${distanceX * 0.56}px, ${
            distanceY * 0.36 - 42
          }px, 0) scale(0.76)`,
        },
        {
          opacity: 0.12,
          transform: `translate3d(${distanceX}px, ${distanceY}px, 0) scale(0.34)`,
        },
      ],
      {
        duration: 420,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      },
    );
    const popTimeoutId = window.setTimeout(() => {
      const cartTarget = document.querySelector<HTMLElement>('a[href="/carrito"]');

      cartTarget?.classList.add("wt-cart-arrival-spark");
      cartTarget?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.08)" },
          { transform: "scale(1)" },
        ],
        {
          duration: 230,
          easing: "cubic-bezier(0.2, 1.04, 0.24, 1)",
        },
      );
      arrivalSparkTimeoutId = window.setTimeout(() => {
        cartTarget?.classList.remove("wt-cart-arrival-spark");
      }, 540);
    }, 300);

    void flyAnimation.finished.then(onComplete, onComplete);

    return () => {
      window.clearTimeout(popTimeoutId);
      if (arrivalSparkTimeoutId) {
        window.clearTimeout(arrivalSparkTimeoutId);
      }
      flyAnimation.cancel();
    };
  }, [animation, onComplete]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[120] h-16 w-16 overflow-hidden rounded-[20px] border border-white/72 bg-white/78 shadow-[0_18px_42px_rgba(74,55,47,0.16)]"
      ref={animationRef}
      style={{
        left: animation.from.x - 32,
        top: animation.from.y - 32,
      }}
    >
      {animation.image?.url ? (
        <Image
          alt=""
          className="object-cover"
          fill
          sizes="64px"
          src={animation.image.url}
        />
      ) : (
        <div className="h-full w-full bg-background-alt" />
      )}
    </div>
  );
}

function readStoredCart() {
  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(rawCart);
    const storedItems =
      isRecord(parsedCart) &&
      parsedCart.version === CART_STORAGE_VERSION &&
      Array.isArray(parsedCart.items)
        ? parsedCart.items
        : parsedCart;

    if (!Array.isArray(storedItems)) {
      return [];
    }

    return storedItems
      .filter(isCartItem)
      .map((item) => {
        const availabilityType = item.availabilityType ?? "in_stock";
        const normalizedItem: CartItem = {
          ...item,
          availabilityType,
          image: item.image
            ? {
                ...item.image,
                url: isSafeCartImageUrl(item.image.url)
                  ? item.image.url
                  : undefined,
              }
            : undefined,
        };

        return {
          ...normalizedItem,
          quantity: Math.min(
            Math.max(1, Math.floor(item.quantity)),
            getCartItemQuantityLimit(normalizedItem),
          ),
        };
      })
      .filter(
        (item) => item.availabilityType === "made_to_order" || item.stock > 0,
      );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [cartAnimation, setCartAnimation] = useState<CartAnimationState>();
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [lastAddedLineId, setLastAddedLineId] = useState<string>();
  const [shouldOpenMiniCartAfterAnimation, setShouldOpenMiniCartAfterAnimation] =
    useState(false);
  const lastAddedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      setItems(readStoredCart());
      setHasHydrated(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        items,
        version: CART_STORAGE_VERSION,
      }),
    );
  }, [hasHydrated, items]);

  useEffect(() => {
    return () => {
      if (lastAddedTimeoutRef.current) {
        window.clearTimeout(lastAddedTimeoutRef.current);
      }
    };
  }, []);

  const openMiniCart = useCallback(() => {
    if (ENABLE_MINI_CART) {
      setIsMiniCartOpen(true);
    }
  }, []);

  const closeMiniCart = useCallback(() => {
    setIsMiniCartOpen(false);
  }, []);

  const markLastAddedLine = useCallback((lineId: string) => {
    setLastAddedLineId(lineId);

    if (lastAddedTimeoutRef.current) {
      window.clearTimeout(lastAddedTimeoutRef.current);
    }

    lastAddedTimeoutRef.current = window.setTimeout(() => {
      setLastAddedLineId(undefined);
      lastAddedTimeoutRef.current = null;
    }, 1800);
  }, []);

  const triggerCartAnimation = useCallback(
    (product: PublicProduct, animationOrigin?: CartAnimationPoint) => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        return false;
      }

      setCartAnimation({
        from:
          animationOrigin ??
          {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          },
        id: Date.now(),
        image: getCartItemImage(product),
        name: product.name,
        to: getCartTargetPoint(),
      });
      return true;
    },
    [],
  );

  const addProduct = useCallback((input: AddCartItemInput) => {
    const stock = Math.max(0, input.product.stock);
    const quantityLimit = getProductPurchaseLimit(input.product);

    if (quantityLimit === 0) {
      return;
    }

    const quantity = Math.min(
      Math.max(1, Math.floor(input.quantity)),
      quantityLimit,
    );

    const itemToAdd: CartItem = {
      availabilityType: input.product.availabilityType,
      condition: input.product.condition,
      estimatedDeliveryText: input.product.estimatedDeliveryText,
      image: getCartItemImage(input.product),
      name: input.product.name,
      price: input.product.price,
      productId: input.product.id,
      quantity,
      selectedModel: normalizeOptionalCartText(input.selectedModel),
      selectedModelBrand: normalizeOptionalCartText(input.selectedModelBrand),
      selectedColor: normalizeOptionalCartText(input.selectedColor),
      selectedCompatibility: normalizeOptionalCartText(input.selectedCompatibility),
      slug: input.product.slug,
      stock,
      variantId: normalizeOptionalCartText(input.variantId),
    };
    const lineId = getLineId(itemToAdd);
    const didStartAnimation = triggerCartAnimation(
      input.product,
      input.animationOrigin,
    );

    markLastAddedLine(lineId);

    if (ENABLE_MINI_CART) {
      if (didStartAnimation) {
        setShouldOpenMiniCartAfterAnimation(true);
      } else {
        window.setTimeout(() => setIsMiniCartOpen(true), 80);
      }
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => getLineId(item) === lineId);

      if (!existingItem) {
        return [...currentItems, itemToAdd];
      }

      return currentItems.map((item) =>
        getLineId(item) === lineId
          ? {
              ...item,
              quantity: Math.min(
                getCartItemQuantityLimit(item),
                item.quantity + quantity,
              ),
            }
          : item,
      );
    });
  }, [markLastAddedLine, triggerCartAnimation]);

  const removeProduct = useCallback((lineId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => getLineId(item) !== lineId),
    );
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          getLineId(item) === lineId
            ? {
                ...item,
                quantity: Math.min(
                  Math.max(1, Math.floor(quantity)),
                  getCartItemQuantityLimit(item),
                ),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      addProduct,
      clearCart,
      closeMiniCart,
      getLineId,
      isMiniCartOpen,
      items,
      lastAddedLineId,
      openMiniCart,
      removeProduct,
      subtotal,
      totalItems,
      updateQuantity,
    }),
    [
      addProduct,
      clearCart,
      closeMiniCart,
      isMiniCartOpen,
      items,
      lastAddedLineId,
      openMiniCart,
      removeProduct,
      subtotal,
      totalItems,
      updateQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {cartAnimation ? (
        <CartFlyToTargetAnimation
          animation={cartAnimation}
          key={cartAnimation.id}
          onComplete={() => {
            setCartAnimation(undefined);

            if (shouldOpenMiniCartAfterAnimation && ENABLE_MINI_CART) {
              setIsMiniCartOpen(true);
              setShouldOpenMiniCartAfterAnimation(false);
            }
          }}
        />
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
