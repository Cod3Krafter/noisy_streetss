"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useView } from "@/context/ViewContext";
import SectionEyebrow from "@/components/SectionEyebrow";
import { books } from "@/data/books";

const formatNaira = (n: number) => "₦" + n.toLocaleString("en-NG") + " NGN";

export default function PublishingTeaser() {
  const { setView } = useView();

  return (
    <section className="px-6 max-w-7xl mx-auto">
      <div className="border-b border-warm-gray/20 pb-4 mb-10 flex justify-between items-end">
        <div>
          <SectionEyebrow>Cellulose Ledger</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
            Latest from Publishing &amp; Submissions
          </h2>
        </div>
        <span className="text-xs font-mono text-accent font-bold uppercase hidden sm:block">
          Heirloom Leaflets
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {books.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => setView("publishing")}
              className="text-left bg-white/50 border border-warm-gray/10 rounded-2xl p-4 flex flex-col justify-between hover:border-info/30 hover:bg-white transition-editorial cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="aspect-4/5 w-full rounded-xl overflow-hidden shadow-sm relative border bg-paper">
                  <Image
                    src={book.image}
                    alt={book.title}
                    fill
                    sizes="(min-width: 768px) 20vw, 50vw"
                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                  {book.isNewRelease && (
                    <span className="absolute top-2 left-2 bg-accent text-paper font-mono text-[7px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded animate-pulse">
                      New Releases
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[8px] font-mono text-accent uppercase font-bold tracking-wider">
                    {book.category}
                  </span>
                  <h4 className="font-serif-display text-sm font-semibold text-ink leading-tight line-clamp-1 group-hover:text-info">
                    {book.title}
                  </h4>
                  <p className="text-[10px] font-serif-body italic text-warm-gray">
                    by {book.author}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-warm-gray/5 mt-3 flex justify-between items-center text-[10px] font-mono">
                <span className="text-warm-gray font-medium">{formatNaira(book.priceNGN)}</span>
                <span className="text-info flex items-center gap-0.5">
                  <span>Examine</span>
                  <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-4 bg-ink text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-accent/5 rounded-bl-full pointer-events-none select-none" />
          <div className="space-y-4">
            <span className="inline-block bg-accent text-white font-mono text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Call for Manuscripts
            </span>
            <h3 className="font-serif-display text-2xl font-bold tracking-tight text-white leading-tight">
              Vol. VI: Maritime Archives &amp; Coastal Poetics
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-serif-body font-light">
              We seek unpublished longform fiction, scientific-literary
              hybrids, and poems tracking Lagos shoreline structures, Lagoon
              sand mining, or the historical memories of sandbars.
            </p>
            <ul className="text-[10px] font-mono text-slate-300 space-y-1.5 pt-2">
              {["Word Limit: 4,000 max", "Deadline: August 30, 2026", "Submission Fee: None"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-accent rounded-full inline-block" />
                    <span>{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setView("publishing")}
            className="w-full mt-6 py-2.5 rounded-xl bg-accent hover:bg-white hover:text-black font-semibold text-white uppercase font-mono text-[10px] tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 shadow"
          >
            <span>Submit Manuscript</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
