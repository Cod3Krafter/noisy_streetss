"use client";

import { ArrowRight } from "lucide-react";
import { useView } from "@/context/ViewContext";
import SectionEyebrow from "@/components/SectionEyebrow";
import ProductCard from "@/components/ProductCard";
import { merch } from "@/data/merch";

export default function ShopTeaser() {
  const { setView } = useView();

  return (
    <section className="px-6 max-w-7xl mx-auto">
      <div className="border-b border-warm-gray/20 pb-4 mb-10 flex justify-between items-end">
        <div>
          <SectionEyebrow>Boutique Goods</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
            Featured Publications &amp; Merch
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setView("shop")}
          className="text-xs font-bold uppercase tracking-wider font-mono text-accent hover:text-info flex items-center gap-1 transition-colors"
        >
          <span>Visit Full Store</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {merch.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
