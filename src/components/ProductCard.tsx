"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import type { MerchItem } from "@/data/merch";

const formatNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

export default function ProductCard({
  item,
  detailed = false,
}: {
  item: MerchItem;
  detailed?: boolean;
}) {
  const { addItem } = useCart();

  const handleAdd = () =>
    addItem({
      id: item.id,
      title: item.title,
      subtitle: item.author ?? item.category,
      priceNGN: item.priceNGN,
      priceUSDLabel: item.priceUSDLabel,
      img: item.image,
    });

  return (
    <div className="bg-white border border-warm-gray/15 rounded-3xl p-4 flex flex-col justify-between group transition-editorial hover:shadow-lg">
      <div className="space-y-4">
        <div className="aspect-4/5 w-full rounded-2xl overflow-hidden relative border bg-slate-100 shadow-inner">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-103"
          />
          <span className="absolute top-2 left-2 bg-ink text-paper text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded shadow">
            {item.category}
          </span>
        </div>
        <div className="space-y-1.5 text-left">
          {item.author && (
            <span className="block text-[8px] font-mono tracking-wider text-accent uppercase font-bold">
              {detailed ? `Author: ${item.author}` : item.author}
            </span>
          )}
          <h3 className="font-serif-display font-semibold text-sm text-ink line-clamp-1 leading-tight group-hover:text-info transition-colors">
            {item.title}
          </h3>
          <p className="text-[10px] text-warm-gray font-sans-ui line-clamp-2 leading-relaxed">
            {item.description}
          </p>
          {detailed && (item.pages || item.genre) && (
            <div className="flex gap-2 items-center text-[9px] font-mono text-warm-gray/70 pt-0.5">
              {item.pages && <span>{item.pages} pages</span>}
              {item.pages && item.genre && <span>•</span>}
              {item.genre && <span>{item.genre}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="pt-3 border-t border-warm-gray/10 mt-4 flex items-center justify-between">
        <div>
          <span className="block font-mono font-bold text-xs text-ink">
            {formatNaira(item.priceNGN)}
          </span>
          <span className="block text-[8px] text-slate-400 font-mono italic">
            or {item.priceUSDLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="px-3.5 py-2 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider bg-accent hover:bg-info text-white transition-all duration-300 shadow-sm"
        >
          {detailed ? "Add to Cart" : "Add"}
        </button>
      </div>
    </div>
  );
}
