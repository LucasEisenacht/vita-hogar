"use client";

import { CartProvider } from "@/context/cart-context";
import { MiniCart } from "@/components/cart/mini-cart";
import { ExperienceProvider } from "@/components/experience/experience-provider";
import { ENABLE_MINI_CART } from "@/config/mini-cart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ExperienceProvider>{children}</ExperienceProvider>
      {ENABLE_MINI_CART ? <MiniCart /> : null}
    </CartProvider>
  );
}
