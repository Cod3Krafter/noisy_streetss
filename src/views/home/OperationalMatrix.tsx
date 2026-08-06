"use client";

import { Award, Sparkles, Play, ArrowRight, ArrowUpRight } from "lucide-react";
import { useView } from "@/context/ViewContext";
import { pillars } from "@/data/fourArms";
import type { ViewId } from "@/lib/navigation";

const icons = {
  advisory: Award,
  publishing: Sparkles,
  studio: null,
  podcast: Play,
} as const;

const arrowIcons: Record<string, typeof ArrowRight> = {
  advisory: ArrowUpRight,
  publishing: ArrowRight,
  studio: ArrowUpRight,
  podcast: ArrowRight,
};

export default function OperationalMatrix() {
  const { setView } = useView();

  return (
    <section className="bg-ink text-paper py-20 px-6 overflow-hidden relative">
      <div className="absolute right-[-24px] bottom-[-24px] font-serif-display text-[200px] leading-none text-white/3 pointer-events-none select-none font-bold">
        ARMS
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-6 mb-12 text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-mono tracking-[0.3em] text-accent font-bold uppercase">
            Operational Matrix
          </span>
          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2">
            The Four Arms of Noisy Streetss
          </h2>
          <p className="font-serif-body text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            We operate an integrated literary ecosystem of physical printing
            lines, corporate consulting, independent recording studios, and
            local audio streaming.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = icons[pillar.id];
            const ArrowIcon = arrowIcons[pillar.id];
            return (
              <div
                key={pillar.id}
                className={`${pillar.bg} rounded-3xl p-6 flex flex-col justify-between border border-white/5 shadow-md relative group h-[290px] hover:border-accent/40 transition-editorial`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold ${pillar.badgeClass}`}>
                      {pillar.badgeText}
                    </span>
                    {Icon ? (
                      <Icon className="w-5 h-5 text-tan opacity-80" aria-hidden="true" />
                    ) : (
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    )}
                  </div>
                  <h3 className="font-serif-display text-2xl font-bold text-white tracking-tight leading-none pt-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-white/90 leading-relaxed font-light">
                    {pillar.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView(pillar.id as ViewId)}
                  className="w-full mt-4 py-2 bg-black/20 hover:bg-paper hover:text-ink text-white rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 border border-white/10 hover:border-transparent group"
                >
                  <span>{pillar.ctaLabel}</span>
                  <ArrowIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
