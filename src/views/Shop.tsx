import ProductGrid from "@/components/ProductGrid";
import { merch } from "@/data/merch";

export default function Shop() {
  return (
    <main className="max-w-7xl mx-auto px-6 pt-36 pb-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-[10px] font-mono tracking-[0.3em] text-accent font-bold uppercase">
          Boutique Publication Store
        </span>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3">
          Physical things we make.
        </h1>
        <p className="font-serif-body text-warm-gray text-sm mt-4 leading-relaxed italic">
          Curated, high-fidelity books and tactical stationery. Strictly
          premium cellulose, no generic digital grids.
        </p>
      </div>
      <ProductGrid items={merch} />
    </main>
  );
}
