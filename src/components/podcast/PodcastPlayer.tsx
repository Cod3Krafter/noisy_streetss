"use client";

import { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";

const TOTAL_SECONDS = 48 * 60;
const START_SECONDS = 14 * 60 + 26;
const BAR_COUNT = 15;

const formatMMSS = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function PodcastPlayer({
  title = "Noisy Originals Season 2",
}: {
  title?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(START_SECONDS);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= TOTAL_SECONDS - 1) {
          setIsPlaying(false);
          return TOTAL_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  const progress = (elapsed / TOTAL_SECONDS) * 100;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[8px] font-mono tracking-widest text-accent block font-bold">
            STREAM STATION AUDIO
          </span>
          <span className="font-serif-display font-medium text-xs text-white">
            {title}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10">
          HD Sound
        </span>
      </div>

      <div className="flex items-end justify-center gap-1.5 h-10 px-4">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full bg-accent transition-all duration-300 ${
              isPlaying ? "animate-pulse" : ""
            }`}
            style={{
              height: isPlaying ? `${10 + ((i * 37) % 30)}px` : "10px",
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/5">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          title="Toggle Simulated Broadcast Stream"
          className="w-11 h-11 rounded-full bg-accent text-white hover:bg-white hover:text-black flex items-center justify-center shadow-md transition-all shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
          )}
        </button>
        <div className="grow space-y-1">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="absolute left-0 top-0 h-full bg-accent transition-all duration-1000 linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-400">
            <span>{formatMMSS(elapsed)}</span>
            <span>{formatMMSS(TOTAL_SECONDS)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
