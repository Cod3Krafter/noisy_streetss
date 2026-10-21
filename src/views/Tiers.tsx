"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";

const plans = [
  {
    id: "free-leaflet",
    label: "Free Leaflet",
    priceNGN: 0,
    period: "forever",
    body: "Sensing the Lagos lit-streets vibe. Immediate access to public blog archives and digital podcast lists.",
    features: [
      "Weekly newsletter dispatch (Noisy Streets Digest)",
      "Standard access to public podcast archives",
      "Guest Book Club registration",
      "Standard shop purchase capability",
    ],
    active: false,
  },
  {
    id: "active-reader",
    label: "Active Reader",
    priceNGN: 10000,
    period: "month",
    body: "Our standard tier for active readers aiming to own, annotate and engage physical literature.",
    features: [
      "Everything in Free Leaflet plus:",
      "1x Physical Noisy Book of the Month mailed to your door",
      "Priority RSVP booking for Surulere courtyard readings",
      "10% direct bookstore discount on physical ink editions",
      "Exclusive access to private Discord literary threads",
    ],
    active: true,
  },
  {
    id: "patron-cooperative",
    label: "Patron Co-operative",
    priceNGN: 50000,
    period: "month",
    body: "A heavy cultural sponsorship tier supporting our Shomolu presses and subsidized workspace access.",
    features: [
      "Everything in Active Reader plus:",
      "All new printed paper copies sent globally free of shipping cost",
      "Subsidized 4 hours of Noisy Studio audio recording slots per month",
      "1-on-1 Quarterly Advisory consult with Modupe Daramola",
      "Custom engraved timber reader plate on our courtyard wall",
    ],
    active: false,
  },
];

const formatNaira = (n: number) => (n === 0 ? "₦0" : "₦" + n.toLocaleString("en-NG"));

export default function Tiers() {
  const [selected, setSelected] = useState("active-reader");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const selectedPlan = plans.find((p) => p.id === selected)!;

  return (
    <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <SectionEyebrow>Noisy Streetss Membership Co-operative</SectionEyebrow>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3">
          Join the Lit Coalition
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed mt-4">
          Support our offset print presses, claim monthly physical book
          packages, and leverage subsidized audio recording setups.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-14 items-start">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelected(plan.id)}
            className={`text-left bg-white rounded-3xl p-6 flex flex-col justify-between h-full border-2 transition-editorial relative ${
              selected === plan.id ? "border-accent shadow-lg" : "border-warm-gray/15 hover:border-accent/40"
            }`}
          >
            {plan.active && (
              <span className="absolute top-4 right-4 bg-accent text-white text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded">
                Active Choice
              </span>
            )}
            <div>
              <span className="text-[9px] font-mono text-warm-gray uppercase font-bold">Cooperative Plan</span>
              <h3 className="font-serif-display text-2xl font-bold text-ink mt-1">{plan.label}</h3>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="font-serif-display text-3xl font-bold text-ink">{formatNaira(plan.priceNGN)}</span>
                <span className="text-xs text-warm-gray">/ {plan.period}</span>
              </div>
              <p className="text-xs text-warm-gray leading-relaxed mt-3 pb-4 border-b border-warm-gray/10">
                {plan.body}
              </p>
              <ul className="space-y-2.5 mt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-ink">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className={`w-full mt-6 py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider ${
                selected === plan.id ? "bg-ink text-white" : "bg-paper-muted text-ink"
              }`}
            >
              Configure {plan.label}
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto mt-14 bg-ink rounded-3xl p-6 sm:p-10 text-white">
        <span className="text-[9px] font-mono text-accent uppercase font-bold">Secure Signup</span>
        <h3 className="font-serif-display text-2xl font-bold text-white mt-1">Deploy your Subscription</h3>
        <p className="text-sm text-slate-300 mt-2">
          Register your literary parameters into our active Lagos subscriber registry.
        </p>
        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-6">
          <div>
            <span className="block text-[9px] font-mono text-white/50 uppercase">Selected plan tier:</span>
            <span className="text-sm font-semibold text-white">{selectedPlan.label}</span>
          </div>
          <span className="text-accent font-mono text-sm font-bold">
            {formatNaira(selectedPlan.priceNGN)} / {selectedPlan.period}
          </span>
        </div>
        <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="block">
            <span className="block text-[9px] font-mono text-white/60 uppercase font-bold mb-1">
              Subscriber Legal Name *
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Silas Adeniji"
              className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="block text-[9px] font-mono text-white/60 uppercase font-bold mb-1">
              Secure Contact Email *
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="silas@domain.com"
              className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs uppercase tracking-widest transition-colors"
          >
            Configure Subscriber Profile
          </button>
        </form>
      </div>
    </main>
  );
}
