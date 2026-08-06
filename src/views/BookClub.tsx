"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, User, MessageSquare } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";

type Comment = {
  name: string;
  date: string;
  body: string;
};

const initialComments: Comment[] = [
  {
    name: "Silas Adeniji",
    date: "May 18, 2026",
    body: "\"Daramola's mapping of lagoons feels like an urgent architectural manifesto. We are literally concrete-capping our maritime history. Can't wait for the June meetup!\"",
  },
  {
    name: "Sola Shomolu",
    date: "May 20, 2026",
    body: "\"Is there a particular adire dress code for the Lagos rave this year? I'm preparing a custom dyed cotton block!\"",
  },
];

export default function BookClub() {
  const [comments, setComments] = useState(initialComments);
  const [handle, setHandle] = useState("");
  const [reflection, setReflection] = useState("");
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpDone, setRsvpDone] = useState(false);

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || !reflection.trim()) return;
    setComments((c) => [
      { name: handle, date: "Just now", body: `"${reflection}"` },
      ...c,
    ]);
    setHandle("");
    setReflection("");
  };

  const submitRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !rsvpEmail.trim()) return;
    setRsvpDone(true);
  };

  return (
    <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <SectionEyebrow>Community &amp; Lit Readings</SectionEyebrow>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3">
          Noisy Book Club
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed mt-4">
          Our monthly literary sanctuary. Welcoming boisterous readers who
          believe ideas should trigger long discussions.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-14">
        <div className="bg-white border border-warm-gray/15 rounded-3xl p-6 sm:p-8">
          <span className="text-[10px] font-mono text-accent uppercase font-bold">
            — Active Meetup Details
          </span>
          <div className="mt-3">
            <span className="text-xs text-warm-gray">Current Volume Read:</span>
            <h2 className="font-serif-display text-2xl font-bold text-ink mt-1">
              &quot;The Cartographer of Sandbars&quot;
            </h2>
            <p className="text-xs font-serif-body italic text-warm-gray mt-1">by writer Modupe Daramola</p>
          </div>
          <p className="text-sm text-warm-gray leading-relaxed mt-4">
            Our current focus evaluates the redemption of disappearing
            coastal communities in Lagos through active geographical
            mapping, following Modupe Daramola&apos;s recent first edition.
            We are looking forward to exploring sandbars, real estate
            dredging lines, and our maritime lore.
          </p>
          <div className="mt-5 pt-5 border-t border-warm-gray/10 space-y-2.5 text-xs text-ink">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" aria-hidden="true" />
              Friday, June 05, 2026
              <Clock className="w-4 h-4 text-accent ml-4" aria-hidden="true" />
              6:30 PM WAT
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" aria-hidden="true" />
              Noisy Studio, 14 Shonibare Estate, Marylebone/Lagos Compound
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-accent" aria-hidden="true" />
              Curated by: <strong className="text-ink">Benedict Onwudinjo</strong>
            </div>
          </div>
          <div className="mt-5 bg-accent/10 border-l-4 border-accent rounded-r-xl px-4 py-3">
            <p className="text-xs text-ink">
              <strong>Discussion Theme:</strong> Redemption of disappearing
              communities through active architectural maps.
            </p>
          </div>
        </div>

        <div className="bg-ink rounded-3xl p-6 sm:p-8 text-white">
          <span className="text-[10px] font-mono text-accent uppercase font-bold">Secure Your Spot</span>
          <h3 className="font-serif-display text-2xl font-bold text-white mt-1">Attend the Exchange</h3>
          <p className="text-sm text-slate-300 leading-relaxed mt-3">
            We have limited slots for our Surulere courtyard session. Live
            streaming access code is provided to diaspora RSVP registries as
            fallback.
          </p>
          {rsvpDone ? (
            <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-4 text-sm text-emerald-300">
              You&apos;re on the registry, {rsvpName}. Check your inbox for confirmation details.
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submitRsvp}>
              <label className="block">
                <span className="block text-[9px] font-mono text-white/60 uppercase font-bold mb-1">
                  Your Name *
                </span>
                <input
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="e.g. Kola Kemi"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="block text-[9px] font-mono text-white/60 uppercase font-bold mb-1">
                  Email Address *
                </span>
                <input
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  placeholder="kola@domain.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="block text-[9px] font-mono text-white/60 uppercase font-bold mb-1">
                  Attendance Mode
                </span>
                <select className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white focus:outline-none focus:border-accent">
                  <option>Attending live at Surulere Compound</option>
                  <option>Attending via digital diaspora feed</option>
                </select>
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Register RSVP Slot
              </button>
              <p className="text-center text-[9px] font-mono text-white/40 uppercase">
                — Noisy Streetss Community Registry —
              </p>
            </form>
          )}
        </div>
      </div>

      <section className="mt-14 bg-paper-muted rounded-3xl p-6 sm:p-10">
        <h2 className="font-serif-display text-2xl font-bold text-ink flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" aria-hidden="true" />
          Courtyard Conversation Board
        </h2>
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border border-warm-gray/15 rounded-2xl p-6">
            <h4 className="font-serif-display font-bold text-ink mb-4">Drop a Discussion Point</h4>
            <form className="space-y-4" onSubmit={submitComment}>
              <label className="block">
                <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold mb-1">
                  Your Name / Handle *
                </span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. Tari Bonny"
                  className="w-full px-3 py-2.5 rounded-xl border border-warm-gray/25 text-xs focus:outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold mb-1">
                  Comment / Reflection *
                </span>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Share a question about 'The Cartographer of Sandbars' or discuss paper arts themes..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-warm-gray/25 text-xs focus:outline-none focus:border-accent resize-none"
                />
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-ink hover:bg-accent text-white font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Publish Discussion Point
              </button>
            </form>
          </div>
          <div className="space-y-4">
            {comments.map((c, i) => (
              <div key={i} className="bg-white border border-warm-gray/15 rounded-2xl p-5">
                <div className="flex justify-between items-center border-b border-warm-gray/10 pb-2 mb-2">
                  <strong className="text-sm text-ink font-serif-display">{c.name}</strong>
                  <span className="text-[10px] font-mono text-warm-gray/60">{c.date}</span>
                </div>
                <p className="text-sm text-ink leading-relaxed">{c.body}</p>
                <span className="inline-block mt-2 text-[9px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded uppercase font-bold">
                  Active Member
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
