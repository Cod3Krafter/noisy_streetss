"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, ShoppingBag } from "lucide-react";
import { useView } from "@/context/ViewContext";
import { useCart } from "@/context/CartContext";
import { primaryNav } from "@/lib/navigation";
import MoreDropdown from "./MoreDropdown";
import MobileMenu from "./MobileMenu";

export default function Nav() {
  const { view, setView } = useView();
  const { openCart, totalCount } = useCart();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 max-w-7xl mx-auto font-sans-ui min-w-0">
      <div className="bg-paper/95 backdrop-blur-md rounded-2xl border border-warm-gray/20 shadow-[0_8px_30px_rgba(26,26,26,0.06)] px-4 sm:px-6 py-2.5 flex items-center justify-between transition-editorial relative">
        <button
          type="button"
          onClick={() => setView("home")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-paper shadow-sm transform group-hover:rotate-6 transition-editorial">
            <span className="font-serif-display font-bold text-xl leading-none">
              N
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-serif-display font-bold text-base sm:text-[17px] tracking-tight text-ink leading-tight group-hover:text-accent transition-colors">
              Noisy Streetss
            </span>
            <span className="text-[9px] font-mono tracking-wider text-warm-gray font-semibold">
              LAGOS · INDEPENDENT PRESS
            </span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-0.5">
          {primaryNav.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <div className="relative" key={id}>
                <button
                  type="button"
                  onClick={() => setView(id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1 transition-editorial relative ${
                    active
                      ? "text-accent bg-accent/5"
                      : "text-ink hover:text-accent hover:bg-warm-gray/5"
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{label}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
                  {active && (
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              </div>
            );
          })}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1 transition-editorial relative ${
                moreOpen
                  ? "text-accent bg-accent/5"
                  : "text-ink hover:text-accent hover:bg-warm-gray/5"
              }`}
            >
              <span>More</span>
              <ChevronDown
                className={`w-3.5 h-3.5 opacity-50 transition-transform duration-300 ${
                  moreOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {moreOpen && <MoreDropdown />}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={openCart}
            className="px-3.5 py-1.5 rounded-xl border border-warm-gray/20 text-xs font-semibold flex items-center gap-2 hover:border-accent hover:text-accent transition-colors relative"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Cart</span>
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-paper text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {totalCount > 9 ? "9+" : totalCount}
              </span>
            )}
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            className="p-2 relative rounded-xl text-ink hover:text-accent"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            {totalCount > 0 && (
              <span className="absolute top-0 right-0 bg-accent text-paper text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {totalCount > 9 ? "9+" : totalCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-1.5 rounded-xl text-warm-gray hover:text-accent hover:bg-warm-gray/5 transition-editorial"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      </div>
    </nav>
  );
}
