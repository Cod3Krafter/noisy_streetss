"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === "submitting") return;
    setStatus("submitting");
    setTimeout(() => {
      setStatus("done");
      setEmail("");
    }, 700);
  };

  return (
    <section className="bg-ink border-t border-b border-warm-gray/30 text-paper py-20 px-6 font-sans-ui">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="text-center">
          <span className="inline-block text-accent font-serif-display text-4xl mb-2">
            §
          </span>
          <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Noisy Streetss Circle of Correspondence
          </h2>
          <p className="font-serif-body text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto mt-4 font-light">
            We send twice-monthly printed dispatches and private manuscript
            reports straight to dedicated circles. No commercial pitches.
            Strictly refined letters.
          </p>
        </div>
        <div className="max-w-md mx-auto pt-4 relative">
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
            <input
              required
              placeholder="Enter your refined literary email..."
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent placeholder-slate-400 font-sans-ui shadow-inner"
            />
            <button
              type="submit"
              className="group px-6 py-3.5 rounded-xl bg-accent hover:bg-paper hover:text-ink text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap shadow"
            >
              <span>{status === "done" ? "Enlisted" : "Mailing list Enlist"}</span>
              <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
