"use client";

import { useState } from "react";
import { Mail, Building2, Send } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";

type TabId = "general" | "partner" | "support";

const tabs: {
  id: TabId;
  label: string;
  kicker: string;
  heading: string;
  body: string;
  formTitle: string;
  fields: { label: string; placeholder: string }[];
  selectLabel: string;
  selectOptions: string[];
  messageLabel: string;
  messagePlaceholder: string;
  buttonLabel: string;
}[] = [
  {
    id: "general",
    label: "General Contact",
    kicker: "Main Communications Office",
    heading: "Let's start the exchange.",
    body: "Have inquiries regarding your ordered copies, submissions processes, advisory cycles, or recording bookings? Write our logistics bureau. We coordinate all mail in Lagos.",
    formTitle: "Corporate Inquiry Form",
    fields: [
      { label: "Full Name *", placeholder: "e.g. Adewale Obi" },
      { label: "Email Address *", placeholder: "adewale@domain.com" },
    ],
    selectLabel: "Subject Division *",
    selectOptions: ["General / Advisory", "Publishing / Manuscripts", "Studio Sessions", "Press / Recognition", "Support / Donation"],
    messageLabel: "Your Message *",
    messagePlaceholder: "Detail your requirements explicitly here...",
    buttonLabel: "Transmit Communication",
  },
  {
    id: "partner",
    label: "Partner With Us",
    kicker: "Brand & Media Desk",
    heading: "Let's build together.",
    body: "Interested in brand collaborations, event sponsorship, or media placement across our print, studio, and podcast channels? Our partnerships desk reviews every brief personally.",
    formTitle: "Partnership Proposal Form",
    fields: [
      { label: "Company / Organization *", placeholder: "e.g. Indigo Gbagada Press" },
      { label: "Contact Email *", placeholder: "partnerships@domain.com" },
    ],
    selectLabel: "Partnership Type *",
    selectOptions: ["Event Sponsorship", "Media Placement", "Bulk Book Orders", "Brand Collaboration"],
    messageLabel: "Proposal Details *",
    messagePlaceholder: "Outline the scope, timeline, and budget for your proposal...",
    buttonLabel: "Submit Partnership Brief",
  },
  {
    id: "support",
    label: "Support / Donate",
    kicker: "Patron Circle Desk",
    heading: "Become a sovereign patron.",
    body: "Join our local and global patron circle. Contributions in NGN or USD directly fund subsidized studio rentals, free public book clubs, and priority editorial reviews for emerging writers.",
    formTitle: "Patron Enrollment Form",
    fields: [
      { label: "Full Name *", placeholder: "e.g. Chioma Nwosu" },
      { label: "Email Address *", placeholder: "chioma@domain.com" },
    ],
    selectLabel: "Contribution Tier *",
    selectOptions: ["₦5,000 / month", "₦15,000 / month", "₦50,000 / month", "Custom Amount"],
    messageLabel: "Note to the Council",
    messagePlaceholder: "Anything you'd like the council to know...",
    buttonLabel: "Confirm Patron Enrollment",
  },
];

export default function Contact({ initialTab = "general" }: { initialTab?: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const tab = tabs.find((t) => t.id === activeTab)!;

  return (
    <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <SectionEyebrow>Engagement Portal • General, Partners &amp; Supporters</SectionEyebrow>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3">
          Keep the streets noisy.
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed mt-4">
          Whether you want to send a manuscript question, align commercial
          sponsorships, or join our cultural patron circle, we have
          dedicated desks to secure your integration.
        </p>
      </div>

      <div className="flex justify-center mt-8">
        <div className="inline-flex bg-white border border-warm-gray/20 rounded-2xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider font-mono transition-editorial ${
                activeTab === t.id ? "bg-accent text-white" : "text-ink hover:text-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 mt-12">
        <div className="lg:col-span-5 bg-paper-muted rounded-3xl p-6 sm:p-8">
          <SectionEyebrow>{tab.kicker}</SectionEyebrow>
          <h3 className="font-serif-display text-2xl font-bold text-ink mt-2">{tab.heading}</h3>
          <p className="text-sm text-warm-gray leading-relaxed mt-3">{tab.body}</p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-accent" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold">
                  Email Communication
                </span>
                <strong className="text-sm text-ink">contact@noisystreetss.com</strong>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-accent" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold">
                  Lagos Headquarters
                </span>
                <strong className="text-sm text-ink">15, Abdul-Bakare Crescent, Surulere, Lagos, Nigeria</strong>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-mono text-warm-gray/60 uppercase mt-6 pt-4 border-t border-warm-gray/15">
            Typical reply duration: under 48 hours
          </p>
        </div>

        <div className="lg:col-span-7 bg-white border border-warm-gray/15 rounded-3xl p-6 sm:p-8">
          <h4 className="font-serif-display text-xl font-bold text-ink">{tab.formTitle}</h4>
          <p className="text-xs text-warm-gray mt-1">
            Please provide standard credentials. Fields marked with (*) are required.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {tab.fields.map((f) => (
                <label key={f.label} className="block">
                  <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold mb-1">
                    {f.label}
                  </span>
                  <input
                    value={f.label.startsWith("Full") || f.label.startsWith("Company") ? form.name : form.email}
                    onChange={(e) =>
                      f.label.startsWith("Full") || f.label.startsWith("Company")
                        ? setForm((s) => ({ ...s, name: e.target.value }))
                        : setForm((s) => ({ ...s, email: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-warm-gray/25 bg-white text-xs focus:outline-none focus:border-accent"
                  />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold mb-1">
                {tab.selectLabel}
              </span>
              <select
                value={form.subject}
                onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-warm-gray/25 bg-white text-xs focus:outline-none focus:border-accent"
              >
                {tab.selectOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold mb-1">
                {tab.messageLabel}
              </span>
              <textarea
                value={form.message}
                onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                placeholder={tab.messagePlaceholder}
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-warm-gray/25 bg-white text-xs focus:outline-none focus:border-accent resize-none"
              />
            </label>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              {tab.buttonLabel}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
