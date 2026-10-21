"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useView } from "@/context/ViewContext";
import { heroArms } from "@/data/fourArms";
import heroImage from "@/images/hero-lagos-press.png";

const ARM_INTERVAL = 6000;

export default function Hero() {
  const { setView } = useView();
  const [activeArm, setActiveArm] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveArm((prev) => (prev + 1) % heroArms.length);
    }, ARM_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const arm = heroArms[activeArm];

  return (
    <div className="relative w-full h-screen min-h-162.5 flex items-center justify-center overflow-hidden bg-ink-600">
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage}
          alt="Lagos print shop workspace"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 select-none pointer-events-none brightness-[0.45] contrast-[1.1] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-ink-100/30 to-ink-100/90" />
        <div className="absolute inset-0 bg-linear-to-t from-paper via-ink-100/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-ink-100/80 via-transparent to-transparent opacity-90" />
      </div>

      <div className="absolute top-24 left-6 sm:left-12 opacity-30 select-none z-10 pointer-events-none hidden sm:block">
        <div className="text-[10px] font-mono tracking-[0.3em] text-paper uppercase">
          Lagos · Shomolu Offset Presswork
        </div>
      </div>
      <div className="absolute top-24 right-6 sm:right-12 opacity-30 select-none z-10 pointer-events-none hidden sm:block">
        <div className="text-[10px] font-mono tracking-[0.3em] text-paper">
          [ VOL. V — 2026 ]
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center h-full pt-16">
        <div className="text-accent font-serif-display text-4xl mb-4 select-none opacity-80">
          §
        </div>

        <div className="h-44 sm:h-52 md:h-64 flex flex-col justify-center items-center select-none">
          <div
            key={activeArm}
            className="flex flex-col items-center space-y-3 animate-arm-fade-in"
          >
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase text-slate-300">
              {arm.eyebrow}
            </span>
            <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-paper leading-[1.05] max-w-4xl">
              {arm.title}
            </h1>
            <p className="font-serif-body text-sm sm:text-base md:text-lg text-slate-300/90 leading-relaxed max-w-2xl pt-2 font-light">
              {arm.subtitle}
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 my-6 sm:my-8">
          {heroArms.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveArm(i)}
              aria-label={`Show arm ${i + 1}`}
              className="group relative p-1 focus:outline-none"
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeArm ? "w-8 bg-accent" : "w-2 bg-slate-500/40 group-hover:bg-slate-300"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-2 z-10">
          <button
            type="button"
            onClick={() => setView("publishing")}
            className="group px-8 py-3.5 sm:px-10 sm:py-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest bg-accent text-paper hover:bg-paper hover:text-ink transition-all duration-300 flex items-center gap-2.5 shadow-[0_4px_20px_rgba(212,56,13,0.25)] border border-transparent hover:border-warm-gray/30"
          >
            <span>Discover Our Work</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" })}
          className="absolute bottom-10 cursor-pointer text-slate-400 hover:text-accent transition-colors flex flex-col items-center gap-1.5 select-none"
        >
          <span className="text-[9px] font-mono tracking-[0.25em] uppercase">Scroll to leaf</span>
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
