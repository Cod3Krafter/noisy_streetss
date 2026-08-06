"use client";

import { useEffect } from "react";
import { useView } from "@/context/ViewContext";
import { useCart } from "@/context/CartContext";
import {
  primaryNav,
  moreNavGroups,
  moreNavExtra,
  type ViewId,
} from "@/lib/navigation";

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const { view, setView } = useView();
  const { openCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const go = (id: ViewId) => {
    setView(id);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
        aria-hidden="true"
      />
      <div className="absolute top-full left-4 right-4 mt-2 z-50 bg-paper-bright rounded-2xl border border-warm-gray/15 shadow-[0_20px_50px_rgba(26,26,26,0.15)] p-4 max-h-[70vh] overflow-y-auto lg:hidden">
        <ul className="flex flex-col">
          {primaryNav.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => go(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold transition-editorial ${
                  view === id
                    ? "text-accent bg-accent/5"
                    : "text-ink hover:bg-warm-gray/5"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                openCart();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-ink hover:bg-warm-gray/5 transition-editorial"
            >
              <span>Cart</span>
            </button>
          </li>
        </ul>

        <div className="my-3 border-t border-warm-gray/15" />

        {moreNavGroups.map((group) => (
          <div key={group.heading} className="mb-3">
            <span className="block px-3 mb-1 text-[9px] font-mono tracking-widest text-warm-gray uppercase font-bold">
              {group.heading}
            </span>
            <ul className="flex flex-col">
              {group.items.map(({ id, label }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => go(id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-editorial ${
                      view === id
                        ? "text-accent bg-accent/5"
                        : "text-ink hover:bg-warm-gray/5"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex items-center gap-2 px-3">
          {moreNavExtra.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-accent hover:bg-accent/5 transition-editorial"
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
