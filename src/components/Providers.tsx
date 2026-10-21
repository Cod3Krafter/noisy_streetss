"use client";

import { CartProvider } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartSidebar />
    </CartProvider>
  );
}
