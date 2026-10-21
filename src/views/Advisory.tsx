"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  Truck,
  Palette,
  Calendar,
  TrendingUp,
  BarChart3,
  Quote,
  Send,
} from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";

const pillars = [
  {
    icon: Users,
    title: "Writer & Publisher Strategy",
    tag: "Author Platforms & Market Structuring",
    body: "Personalized advisory to position monographs, establish royalty structures, and build sustainable independent print platforms across West Africa.",
  },
  {
    icon: Truck,
    title: "Book Distribution & Inventory",
    tag: "Pristine Lagos & International Logistics",
    body: "A direct-to-retail fulfillment system overcoming regional bottlenecks, managing warehouse states, and connecting to global bookstores.",
  },
  {
    icon: Palette,
    title: "Design Services",
    tag: "Premium Typographic Craftsmanship",
    body: "Archival cover jackets, letterpress layout, unbleached paper selections, and bespoke book design systems that capture physical souls.",
  },
  {
    icon: Calendar,
    title: "Literary Event Programming",
    tag: "Curated Cultural Convenings",
    body: "Organizing intimate courtyard reading fellowships, high-concept writing masterclasses, and our signature boutique literary events.",
  },
  {
    icon: TrendingUp,
    title: "Financial Planning",
    tag: "Independent Capital Architectures",
    body: "Connecting creators with global grant parameters, optimizing offset production budgets, and planning long-term editorial security.",
  },
  {
    icon: BarChart3,
    title: "Industry Intelligence Reports",
    tag: "Rigorous Market Intelligence Data",
    body: "Providing empirical research on bookstore densities, purchasing velocity indexes, and regional logistics costs across the continent.",
  },
];

const timeline = [
  { n: "01", tag: "// Debut", title: "Structural Diagnostic", body: "We map your manuscript scope, author platform potential, or institutional vision against current West African market logistics." },
  { n: "02", tag: "// Form", title: "Material Proofing", body: "Our design curators select fine-art type scales, unbleached bookleaf boards, and establish physical proofing grids." },
  { n: "03", tag: "// Launch", title: "Logistical Cleansing", body: "We resolve distribution roadblocks, managing safe regional storage and routing inventory maps straight to retail shelves." },
  { n: "04", tag: "// Circle", title: "Strategic Seeding", body: "Cultivating reception loops through our courtyard salons, private patron circles, and independent reading initiatives." },
];

const strategists = [
  {
    name: "Modupe Daramola",
    role: "Founder & Lead Strategist",
    image: "/images/unsplash/unsplash-1507003211169-0a1dd7228f2d.jpg",
    bio: "Modupe is a visual geographer, typographer, and lead strategist. Having spent a decade mapping Bight of Benin shipping corridors, she coordinates our heavy press offset lines in Shomolu and structures custom distribution pipelines for independent platforms.",
  },
  {
    name: "Benedict Onwudinjo",
    role: "Projects Officer & Curator",
    image: "/images/unsplash/unsplash-1472099645785-5658abf4ff4e.jpg",
    bio: "Benedict coordinates our regional freight, courier schedules, and inventory controls. Drawing from years supervising custom cargo clearance workflows at Apapa Port, he clears complex African supply chain transit roadblocks.",
  },
];

const testimonials = [
  {
    quote: "Noisy Advisory is the first consultancy in West Africa that understands book logistical networks as a structural necessity rather than an afterthought. They cleared our backlog and matched print quality with pristine global standards.",
    name: "Ayobami Olorunfemi",
    role: "Author of 'The Saltwater Shadows' / Lead Fellow",
  },
  {
    quote: "Modupe and her staff solved a forty-year distribution nightmare. Our prints are now safely stocked in Lagos, Accra, and London with live inventory tracking and zero transit bottlenecks.",
    name: "Oluwatamilore A.",
    role: "Founder, Gbagada Literary Collective",
  },
  {
    quote: "Their intelligence reports and direct-to-retail book-club systems turned what was once a highly speculative venture into a predictable, robust publishing model.",
    name: "The Lagos Literary Review",
    role: "Spring Editorial Audit, June 2025",
  },
];

export default function Advisory() {
  const [form, setForm] = useState({ name: "", org: "", email: "", dimension: "Writer & Publisher Strategy", brief: "" });

  return (
    <main className="pt-32 pb-24">
      <section className="px-6 max-w-7xl mx-auto">
        <SectionEyebrow>○ Noisy Advisory Desk</SectionEyebrow>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3 max-w-3xl leading-[1.15]">
          Distribution and promoting African stories.
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed max-w-2xl mt-5">
          We operate as a world-class strategic advisory partner connecting
          creators, publishers, and cultural operators to sustainable
          printing structures and seamless distribution channels.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          {["Authors", "Publishers", "Literary Institutions"].map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-warm-gray/25 text-xs font-semibold text-ink"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {t}
            </span>
          ))}
        </div>

        <div className="mt-10 bg-white border border-warm-gray/15 rounded-3xl p-6 sm:p-10 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-accent font-bold uppercase">
              The Distribution Deficit
            </span>
            <h3 className="font-serif-display text-2xl font-bold text-ink mt-2">
              The Unbridged Canyon
            </h3>
          </div>
          <div className="md:col-span-8 border-l-2 border-accent/30 pl-6">
            <Quote className="w-6 h-6 text-accent/40 mb-2" aria-hidden="true" />
            <p className="font-serif-body italic text-ink text-sm sm:text-base leading-relaxed">
              &quot;African markets produce an abundant, cascading volume of
              brilliant stories, yet we lack consistent, independent
              distribution infrastructure. Noisy Advisory bridges this
              canyon—bringing your manuscript from the mechanical press lines
              of Shomolu directly to shelves in Lagos, Accra, London, and
              Brooklyn.&quot;
            </p>
            <span className="block text-[10px] font-mono text-accent uppercase font-bold mt-3">
              — Modupe Daramola, Founder / Lead Strategist
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto mt-24">
        <div className="flex justify-between items-end border-b border-warm-gray/20 pb-6 mb-10">
          <div>
            <SectionEyebrow>Intervention Vectors</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              Expertise &amp; Service Pillars
            </h2>
          </div>
          <span className="text-xs font-mono text-warm-gray hidden sm:block">
            Six Complementary Systems
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-white border border-warm-gray/15 rounded-3xl p-6 flex flex-col gap-4 hover:border-accent/40 transition-editorial group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-serif-display font-semibold text-ink">{p.title}</h3>
                  <span className="block text-[9px] font-mono text-accent uppercase font-bold mt-1">
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs text-warm-gray leading-relaxed">{p.body}</p>
                <span className="text-[9px] font-mono text-warm-gray/50 uppercase tracking-widest mt-auto">
                  Consultancy Core
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto mt-24">
        <div className="bg-paper-muted rounded-3xl p-6 sm:p-12">
          <SectionEyebrow>Cohort Cycle Timeline</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-2 max-w-lg">
            How We Translate Manuscripts into Physical Realities
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
            {timeline.map((t) => (
              <div key={t.n}>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif-display text-4xl font-bold text-warm-gray/20">{t.n}</span>
                  <span className="text-[10px] font-mono text-accent font-bold uppercase">{t.tag}</span>
                </div>
                <h3 className="font-serif-display font-semibold text-ink mt-2">{t.title}</h3>
                <p className="text-xs text-warm-gray leading-relaxed mt-1.5">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto mt-24">
        <SectionEyebrow>Leadership</SectionEyebrow>
        <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1 mb-10">
          Consulting Strategists
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {strategists.map((s) => (
            <div
              key={s.name}
              className="bg-white border border-warm-gray/15 rounded-3xl p-5 flex gap-5"
            >
              <div className="w-20 h-24 relative rounded-2xl overflow-hidden shrink-0 grayscale">
                <Image src={s.image} alt={s.name} fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-accent uppercase font-bold">{s.role}</span>
                  <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </span>
                </div>
                <h3 className="font-serif-display font-bold text-ink mt-1">{s.name}</h3>
                <p className="text-xs text-warm-gray leading-relaxed mt-1.5">{s.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto mt-24">
        <SectionEyebrow>Cornet Soundings</SectionEyebrow>
        <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1 mb-10">
          Ecosystem Testimonials
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-paper-muted rounded-3xl p-6 flex flex-col gap-4">
              <Quote className="w-6 h-6 text-accent/40" aria-hidden="true" />
              <p className="font-serif-body italic text-ink text-sm leading-relaxed">
                &quot;{t.quote}&quot;
              </p>
              <div className="mt-auto pt-2">
                <h4 className="font-serif-display font-bold text-ink text-sm">{t.name}</h4>
                <p className="text-xs text-warm-gray">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 max-w-2xl mx-auto mt-24">
        <div className="bg-success text-white rounded-3xl p-6 sm:p-10 shadow-xl">
          <span className="text-[9px] font-mono tracking-widest text-tan uppercase font-bold">
            ✓ Priority Author Cohort Queue
          </span>
          <h3 className="font-serif-display text-2xl font-bold text-white mt-2">
            Open a Cohort Engagement
          </h3>
          <p className="text-xs text-white/85 leading-relaxed mt-3">
            Apply for strategic consulting slots. We offer discounted project
            structures and fast-track priority coordinates for independent
            artists and emerging author collectives currently in active
            development.
          </p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-[9px] font-mono text-white/70 uppercase font-bold mb-1">
                  Director / Author Name *
                </span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Chimera Cole"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white"
                />
              </label>
              <label className="block">
                <span className="block text-[9px] font-mono text-white/70 uppercase font-bold mb-1">
                  Organization Name
                </span>
                <input
                  value={form.org}
                  onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
                  placeholder="e.g. Indigo Gbagada Press"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white"
                />
              </label>
            </div>
            <label className="block">
              <span className="block text-[9px] font-mono text-white/70 uppercase font-bold mb-1">
                Secure Contact Email *
              </span>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="address@domain.com"
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white"
              />
            </label>
            <label className="block">
              <span className="block text-[9px] font-mono text-white/70 uppercase font-bold mb-1">
                Primary Dimension of Enquiry
              </span>
              <select
                value={form.dimension}
                onChange={(e) => setForm((f) => ({ ...f, dimension: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white focus:outline-none focus:border-white"
              >
                {pillars.map((p) => (
                  <option key={p.title}>{p.title}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[9px] font-mono text-white/70 uppercase font-bold mb-1">
                Manuscript Details &amp; Brief *
              </span>
              <textarea
                value={form.brief}
                onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
                placeholder="Kindly summarize your physical printing scope or list current distribution challenges you wish to audit with us..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white resize-none"
              />
            </label>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-success font-bold text-xs uppercase tracking-widest hover:bg-tan transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              Submit Strategic Enquiry
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
