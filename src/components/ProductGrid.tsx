"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import type { MerchItem } from "@/data/merch";

const filters = ["All", "Books", "Stationery"] as const;
type Filter = (typeof filters)[number];

export default function ProductGrid({ items }: { items: MerchItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const visible = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition-editorial border ${
                filter === f
                  ? "bg-ink text-paper border-ink"
                  : "bg-transparent text-ink border-warm-gray/25 hover:border-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-accent font-semibold uppercase tracking-wider">
          NGN &amp; USD Diaspora pricing displayed
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {visible.map((item) => (
          <ProductCard key={item.id} item={item} detailed />
        ))}
      </div>
    </>
  );
}
