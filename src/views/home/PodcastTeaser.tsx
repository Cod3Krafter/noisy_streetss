import { Clock } from "lucide-react";
import PodcastPlayer from "@/components/podcast/PodcastPlayer";

export default function PodcastTeaser() {
  return (
    <section className="px-6 max-w-7xl mx-auto">
      <div className="bg-ink-600 text-paper rounded-3xl p-6 sm:p-10 border border-warm-gray/30 relative shadow-xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl pointer-events-none select-none rounded-full" />
        <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-accent tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LISTEN NOW</span>
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
              Laying Ink in Shomolu: The Lagos Printers
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans-ui max-w-lg">
              We sit down in Noisy Studio with Silas, an operator of vintage
              Heidelberg presses, to talk about mechanical repair blocks,
              linseed inks, and the survival of traditional presswork in
              Surulere.
            </p>
            <div className="flex flex-wrap gap-4 items-center text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                48 mins duration
              </span>
              <span>•</span>
              <span>Release: May 16, 2026</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <PodcastPlayer />
          </div>
        </div>
      </div>
    </section>
  );
}
