"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BookOpen, Search, ArrowRight } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";
import { dispatches } from "@/data/dispatches";

const filters = ["All", "Publishing", "Cultural", "Design", "Excerpts"] as const;

export default function Blog() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");

  const featured = dispatches.find((d) => d.featured)!;

  const filtered = useMemo(() => {
    return dispatches.filter((d) => {
      const matchesFilter = filter === "All" || d.filterCategory === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || d.title.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.3em] text-accent font-bold uppercase bg-accent/10 px-3 py-1.5 rounded-full">
          <BookOpen className="w-3 h-3" aria-hidden="true" />
          Noisy Dispatches &amp; Journals
        </span>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-4">
          Original columns &amp; local studies.
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed mt-4">
          Read our regularly written published articles, critical African
          design studies, Shomolu pressroom realities, and experimental
          literature dispatches.
        </p>
      </div>

      {/* Featured */}
      <div className="mt-16 bg-ink rounded-3xl overflow-hidden grid md:grid-cols-2">
        <div className="relative aspect-4/3 md:aspect-auto">
          <span className="absolute top-3 left-3 z-10 bg-accent text-white text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded tracking-widest">
            Primary Spotlight Feature
          </span>
          <Image
            src={featured.image}
            alt={featured.title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-3 left-3 text-[9px] font-mono text-white/80 uppercase">
            {featured.kicker} • {featured.readTime}
          </span>
        </div>
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-white leading-tight">
            {featured.title}
          </h2>
          <p className="font-serif-body italic text-slate-300 text-sm mt-2 border-l-2 border-accent pl-3">
            {featured.subtitle}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mt-4 line-clamp-4">
            {featured.body}
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-5">
            <span>
              By <strong className="text-white">{featured.author}</strong>
            </span>
            <span>•</span>
            <span>
              Published: <strong className="text-white">{featured.publishedDate}</strong>
            </span>
          </div>
          <button
            type="button"
            className="mt-6 self-start px-6 py-3 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            Immerse in Reader
          </button>
        </div>
      </div>

      {/* Archive */}
      <div className="mt-20">
        <div className="flex justify-between items-end border-b border-warm-gray/20 pb-6 mb-6 flex-wrap gap-4">
          <div>
            <SectionEyebrow>The Archival Folio</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              All Editorial Dispatches
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border transition-editorial ${
                  filter === f
                    ? "bg-accent text-white border-accent"
                    : "bg-transparent text-ink border-warm-gray/25 hover:border-accent"
                }`}
              >
                {f}
              </button>
            ))}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-warm-gray/50 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dispatches..."
                className="pl-8 pr-3 py-1.5 rounded-full border border-warm-gray/25 bg-white text-[11px] font-sans-ui focus:outline-none focus:border-accent w-40"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-warm-gray/60 uppercase mb-6">
          <span>Category selection: {filter === "All" ? "All dispatches" : filter}</span>
          <span>Found Records: {filtered.length} Stories</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-warm-gray/15 rounded-3xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg transition-editorial"
            >
              <div className="aspect-16/10 w-full relative">
                <Image
                  src={d.image}
                  alt={d.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 bg-ink text-paper text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded">
                  {d.type}
                </span>
              </div>
              <div className="p-5 flex flex-col justify-between grow">
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono text-accent uppercase font-bold">
                    <span>{d.kicker}</span>
                    <span className="text-warm-gray/60 normal-case">{d.readTime}</span>
                  </div>
                  <h3 className="font-serif-display font-bold text-ink mt-2 group-hover:text-info transition-colors">
                    {d.title}
                  </h3>
                  <p className="font-serif-body italic text-xs text-warm-gray mt-1">{d.subtitle}</p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-warm-gray/10 text-[10px] font-mono">
                  <span className="text-warm-gray">By {d.author}</span>
                  <span className="text-accent font-bold flex items-center gap-1">
                    Read dispatch <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
