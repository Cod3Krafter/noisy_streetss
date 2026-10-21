"use client";

import { useState, type FormEvent } from "react";
import { Mail, Music, ArrowRight } from "lucide-react";
import { useView } from "@/context/ViewContext";
import { footerOperationalArms } from "@/lib/navigation";
import { InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/icons/social";

const legalItems = [
  "Privacy Policy",
  "Cookie Policy",
  "Terms & Conditions",
  "E-Commerce Terms",
];

const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon, hover: "hover:border-pink-500/35 hover:bg-pink-500/5 hover:text-pink-400" },
  { label: "X / Twitter", href: "https://twitter.com", icon: TwitterIcon, hover: "hover:border-sky-500/35 hover:bg-sky-500/5 hover:text-sky-400" },
  { label: "YouTube", href: "https://youtube.com", icon: YoutubeIcon, hover: "hover:border-red-500/35 hover:bg-red-500/5 hover:text-red-400" },
  { label: "Spotify Broadcast", href: "https://spotify.com", icon: Music, hover: "hover:border-emerald-500/35 hover:bg-emerald-500/5 hover:text-emerald-400" },
];

export default function Footer() {
  const { setView } = useView();
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
    <footer className="bg-ink-300 border-t-2 border-accent/40 pt-16 pb-12 text-paper font-sans-ui mt-auto relative z-20 min-w-0 w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/10 text-left">
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-serif-display font-medium text-lg tracking-wide text-white">
                  Noisy Streetss
                </span>
                <span className="text-[8px] font-mono tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  COOPERATIVE
                </span>
              </div>
              <p className="text-slate-400 font-serif-body italic text-xs leading-relaxed max-w-sm">
                &quot;Offsetting independent literature, corporate publishing
                consulting, and creative acoustic recordings directly from
                our Lagos workspace. Est. 2024.&quot;
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <span className="block text-[9px] font-mono tracking-widest text-accent uppercase font-bold">
                OPERATIONAL HEAVY DESK
              </span>
              <a
                href="mailto:contact@noisystreetss.com"
                className="font-mono text-xs text-white hover:text-accent transition-all bg-white/5 px-3 py-2 rounded-xl inline-flex items-center gap-2 border border-white/5 hover:border-accent/20"
              >
                <Mail className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                <span>contact@noisystreetss.com</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <span className="block text-[9px] font-mono tracking-widest text-slate-500 uppercase font-bold">
              The Operational Arms
            </span>
            <ul className="space-y-2.5 text-xs text-left">
              {footerOperationalArms.map(({ id, label, dotClassName }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setView(id)}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group cursor-pointer text-left"
                  >
                    <span className={`w-1 h-1 rounded-full opacity-60 ${dotClassName}`} />
                    <span>{label}</span>
                    <ArrowRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <span className="block text-[9px] font-mono tracking-widest text-accent uppercase font-bold text-left">
              CIRCLES OF CORRESPONDENCE
            </span>
            <p className="text-slate-400 text-xs leading-relaxed font-serif-body text-left">
              Step inside the dispatch logs. Receive our bi-weekly physical
              ledger notifications and limited print releases.
            </p>
            <form className="space-y-2 mt-2" onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <input
                  required
                  placeholder="address@domain.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-mono"
                />
                <button
                  type="submit"
                  className="bg-accent hover:bg-white hover:text-black font-semibold text-white px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{status === "done" ? "Joined" : "Join"}</span>
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
              <span className="block text-[8px] text-slate-500 font-mono italic text-left">
                No commercial spam. Strictly sovereign correspondence.
              </span>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-10 text-xs items-center">
          <div className="md:col-span-4 flex items-center gap-4">
            <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase font-bold">
              SOCIALS
            </span>
            <div className="flex gap-3">
              {socials.map(({ label, href, icon: Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  className={`w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 transition-all cursor-pointer ${hover}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-5 flex flex-wrap gap-x-4 gap-y-2 items-center justify-start md:justify-center">
            {legalItems.map((label, i) => (
              <span key={label} className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors text-[10px] font-mono hover:underline uppercase cursor-pointer"
                >
                  {label}
                </button>
                {i < legalItems.length - 1 && (
                  <span className="text-slate-600 font-mono text-[9px]">•</span>
                )}
              </span>
            ))}
          </div>
          <div className="md:col-span-3 text-left md:text-right text-[10px] text-slate-500 font-mono">
            <span>© 2024–2026 Noisy Streetss. All physical leaves reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
