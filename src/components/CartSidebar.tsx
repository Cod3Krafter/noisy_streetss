"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import NairaCard from "@/icons/naira-card";

const formatNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + item.priceNGN * item.quantity, 0);

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      <aside
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-96 max-w-[100vw] bg-paper-bright shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-warm-gray/15">
          <h2 className="font-serif-display text-2xl font-semibold text-ink tracking-tight italic">
            Your Cart
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="text-warm-gray hover:text-ink transition-colors active:scale-95"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingBag className="w-12 h-12 text-warm-gray/30" aria-hidden="true" />
              <p className="font-sans-ui text-sm text-warm-gray">
                Your cart is empty.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 items-start">
                  <div className="relative w-16 h-20 rounded overflow-hidden bg-paper-muted shrink-0">
                    <Image
                      src={item.img}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif-display text-base font-medium text-ink leading-snug">
                      {item.title}
                    </p>
                    <p className="font-sans-ui text-xs text-warm-gray mb-2">
                      {item.subtitle}
                    </p>
                    <span className="flex items-center gap-1">
                      <NairaCard />
                      <p className="font-sans-ui text-sm font-bold text-ink">
                        {formatNaira(item.priceNGN)}
                      </p>
                      {item.priceUSDLabel && (
                        <span className="font-sans-ui text-xs text-warm-gray">
                          / {item.priceUSDLabel}
                        </span>
                      )}
                    </span>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-6 h-6 flex items-center justify-center border border-warm-gray/30 rounded text-ink hover:border-accent transition-colors"
                      >
                        <Minus className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <span className="font-sans-ui text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-6 h-6 flex items-center justify-center border border-warm-gray/30 rounded text-ink hover:border-accent transition-colors"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.title}`}
                    className="text-warm-gray/60 hover:text-accent transition-colors shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-warm-gray/15 px-6 py-5 flex flex-col gap-4">
            <div className="flex justify-between items-center font-sans-ui text-sm">
              <span className="text-warm-gray">Subtotal</span>
              <span className="font-bold text-ink">{formatNaira(subtotal)}</span>
            </div>
            <button className="w-full bg-accent text-white font-sans-ui text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-accent-hover transition-colors active:scale-[0.98]">
              Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
