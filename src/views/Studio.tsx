"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, HardDrive, Video as VideoIcon, Music2, Users } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";

type Tier = "hourly" | "half" | "full";

const services = [
  {
    id: "podcast",
    title: "Podcast Studio Rental",
    body: "Pre-configured wood-paneled isolation room. Accommodates 4 live dialogue spots. Features Shure SM7B dynamic sets, Rodecaster Pro console, and pristine local recording.",
    hourly: 15000,
    half: 50000,
    full: 90000,
    inclusions: "Host desk for 4, Shure microphones, assistant engineer, raw file backup dumps.",
  },
  {
    id: "video",
    title: "Video Production Studio",
    body: "Cinematic multi-cam lighting grid. Features robust Nanlite keys, 4K Lumix capture blocks, acoustic backing, and quick-toggle chroma green screens for virtual scenery.",
    hourly: 30000,
    half: 100000,
    full: 180000,
    inclusions: "Multi-cam 4K Lumix, Nanlite softboxes, chroma key screen, live direct feed.",
  },
  {
    id: "equipment",
    title: "Equipment Hire",
    body: "Bespoke off-site hardware dispatch. Rent standard handheld Zoom H6 field recorders, portable wireless lavalier clip transmitter arrays, directional boom kits, and high-lumen portable LED panel sets.",
    hourly: 10000,
    half: 35000,
    full: 60000,
    inclusions: "Off-site Zoom recorders, wireless lapel kits, portable battery LED lights.",
  },
  {
    id: "casting",
    title: "Casting & Audition Space",
    body: "High ceilings, waiting lounge setup, acoustic dampening, dual panel seats.",
    hourly: null,
    half: 40000,
    full: 75000,
    inclusions: "High ceilings, waiting lounge setup, acoustic dampening, dual panel seats.",
  },
];

const galleryFilters = ["All Angles", "Acoustic Gear", "Taping Sessions", "Lounges"] as const;

const gallery = [
  { id: "soundboard", title: "Our Custom Soundboard", body: "Focusrite Clarett interface paired with warm preamps and tactile faders.", category: "Acoustic Gear", image: "/images/unsplash/unsplash-1516450360452-9312f5e86fc7.jpg" },
  { id: "vocal-pod", title: "Vocal Isolation Pod", body: "Double-walled acoustic cedar slate paneling built for narratives.", category: "Acoustic Gear", image: "/images/unsplash/unsplash-1532012197267-da84d127e765.jpg" },
  { id: "multicam", title: "Multicam Live Show Record", body: "An active episode taping session under professional softbox key lighting.", category: "Taping Sessions", image: "/images/unsplash/unsplash-1598488035139-bdbb2231ce04.jpg" },
  { id: "tuning", title: "Acoustic Tuning Station", body: "Active monitoring headphones and premium Shure locker sets.", category: "Acoustic Gear", image: "/images/unsplash/unsplash-1534528741775-53994a69daeb.jpg" },
  { id: "green-room", title: "Green Room Discussion Lounge", body: "Sip Nigerian dark blend roast, read independent journals, and prep.", category: "Lounges", image: "/images/unsplash/unsplash-1573496359142-b8d87734a5a2.jpg" },
  { id: "post-edit", title: "Post-Editing Master Suite", body: "Precision mastering for global syndication on Spotify and Apple.", category: "Taping Sessions", image: "/images/unsplash/unsplash-1465847899084-d164df4dedc6.jpg" },
];

const guidelines = [
  { n: 1, title: "Fast External HDD/SSD Drives", body: "Formatted strictly in exFAT or APFS to ensure lightning-fast direct backups from our workstations." },
  { n: 2, title: "Class 10 Video SD Cards", body: "If recording video using our Lumix cinema blocks, bring SDXC Class 10 (U3, V30 or V60 speed class) cards." },
  { n: 3, title: "Specialized Instrument / MIDI Controllers", body: "Our interfaces support direct XLR/quarter-inch TRS patch line jacks. You are welcome to plug in your favorite synthesizers or custom controls." },
  { n: 4, title: "Guest Count Limitation", body: "Our podcast lounge is custom-tuned to seat up to 4 active guests and 1 producer inside the live recording isolation zone." },
];

const formatNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

export default function Studio() {
  const [galleryFilter, setGalleryFilter] = useState<(typeof galleryFilters)[number]>("All Angles");
  const [selectedService, setSelectedService] = useState(services[0].id);
  const [tier, setTier] = useState<Tier>("hourly");
  const [hours, setHours] = useState(2);

  const filteredGallery =
    galleryFilter === "All Angles" ? gallery : gallery.filter((g) => g.category === galleryFilter);

  const active = services.find((s) => s.id === selectedService)!;

  const total = useMemo(() => {
    if (tier === "hourly") return (active.hourly ?? 0) * hours;
    if (tier === "half") return active.half;
    return active.full;
  }, [active, tier, hours]);

  return (
    <main className="pb-24">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden bg-ink-600">
        <div className="absolute inset-0">
          <Image
            src="/images/unsplash/unsplash-1516450360452-9312f5e86fc7.jpg"
            alt="Noisy Recording Studio Master Setup"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink-100 via-ink-100/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 pt-40 w-full">
          <SectionEyebrow>◆ Boutique Lagos Production</SectionEyebrow>
          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] mt-3">
            Acoustic Rigour.
            <br />
            <span className="text-accent">Analog Warmth.</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mt-5 leading-relaxed">
            Designed by a literary company, optimized for podcasters, sound
            artists, and cinematic storytellers seeking pristine physical
            capture. A quiet sanctuary for high-fidelity audio structures and
            dynamic media execution in Lagos.
          </p>
          <div className="flex flex-wrap gap-4 mt-7">
            <a
              href="#booking"
              className="px-7 py-3.5 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-accent-hover transition-colors"
            >
              Initiate Booking Request
            </a>
            <a
              href="#rates"
              className="px-7 py-3.5 rounded-xl border border-white/25 text-white text-xs font-bold uppercase tracking-widest hover:border-white transition-colors"
            >
              Explore Services &amp; Rates
            </a>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="px-6 max-w-7xl mx-auto mt-24">
        <div className="flex justify-between items-end border-b border-warm-gray/20 pb-6 mb-10 flex-wrap gap-4">
          <div>
            <SectionEyebrow>Expert Initiatives</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">What We Offer</h2>
          </div>
          <span className="text-xs font-mono text-warm-gray max-w-xs text-right hidden sm:block">
            Four specialized services designed to amplify global standard outputs from West Africa.
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-warm-gray/15 rounded-3xl p-6 flex flex-col justify-between gap-4 hover:border-accent/40 transition-editorial"
            >
              <div>
                <h3 className="font-serif-display font-semibold text-ink">{s.title}</h3>
                <p className="text-xs text-warm-gray leading-relaxed mt-2">{s.body}</p>
                <div className="text-[10px] font-mono text-ink/80 space-y-1 mt-4">
                  {s.hourly && (
                    <div>
                      Hourly: <strong className="text-ink">{formatNaira(s.hourly)} / hr</strong>
                    </div>
                  )}
                  <div>
                    Half-Day: <strong className="text-ink">{formatNaira(s.half)}</strong>
                  </div>
                  <div>
                    Full-Day: <strong className="text-ink">{formatNaira(s.full)}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedService(s.id);
                  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 rounded-xl border border-warm-gray/25 text-xs font-bold uppercase tracking-wider hover:border-accent hover:text-accent transition-colors"
              >
                Select &amp; Configure
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Rates table */}
      <section id="rates" className="px-6 max-w-7xl mx-auto mt-24">
        <div className="text-center mb-10">
          <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink">
            Transparent Rates comparison
          </h3>
          <p className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold mt-2">
            Standard Rate Pillars &amp; Service Capabilities
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-warm-gray/15 bg-white">
          <table className="w-full text-left text-xs min-w-160">
            <thead>
              <tr className="border-b border-warm-gray/15 text-[9px] font-mono uppercase text-warm-gray/70">
                <th className="px-4 py-3 font-bold">Service</th>
                <th className="px-4 py-3 font-bold">Hourly</th>
                <th className="px-4 py-3 font-bold">Half-day</th>
                <th className="px-4 py-3 font-bold">Full-day</th>
                <th className="px-4 py-3 font-bold hidden md:table-cell">Core Inclusions</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-warm-gray/10 last:border-0">
                  <td className="px-4 py-4 font-serif-display font-semibold text-ink">{s.title}</td>
                  <td className="px-4 py-4 font-mono text-accent font-bold">{s.hourly ? formatNaira(s.hourly) : "—"}</td>
                  <td className="px-4 py-4 font-mono">{formatNaira(s.half)}</td>
                  <td className="px-4 py-4 font-mono">{formatNaira(s.full)}</td>
                  <td className="px-4 py-4 text-warm-gray hidden md:table-cell max-w-xs">{s.inclusions}</td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(s.id);
                        document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-[9px] font-bold font-mono uppercase text-accent whitespace-nowrap"
                    >
                      Book →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equipment + guidelines */}
      <section className="px-6 max-w-7xl mx-auto mt-24 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6">
          <SectionEyebrow>Lagos Facility Inventory</SectionEyebrow>
          <h3 className="font-serif-display text-2xl font-bold text-ink mt-1">Equipment &amp; Facilities Setup</h3>
          <p className="text-sm text-warm-gray leading-relaxed mt-3">
            At Noisy Streets, we invest in reliable, physical hardware that
            reduces digital artifacts. Clients receive calibrated acoustics
            and warm signal chains.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-white border border-warm-gray/15 rounded-2xl p-5">
              <Music2 className="w-5 h-5 text-accent mb-2" aria-hidden="true" />
              <h4 className="font-serif-display font-semibold text-ink text-sm">Pristine Locker Setup</h4>
              <p className="text-xs text-warm-gray leading-relaxed mt-1.5">
                Shure SM7B dynamics, Rode vocal condenser setups, shockmounted
                field mics, and high-frequency noise-rejecting pop-shields.
              </p>
            </div>
            <div className="bg-white border border-warm-gray/15 rounded-2xl p-5">
              <VideoIcon className="w-5 h-5 text-accent mb-2" aria-hidden="true" />
              <h4 className="font-serif-display font-semibold text-ink text-sm">Mixing &amp; DAWs</h4>
              <p className="text-xs text-warm-gray leading-relaxed mt-1.5">
                Focusrite Clarett 8Pre, Allen &amp; Heath analog consoles, and
                custom templates in Reaper, Logic Pro, and Audition.
              </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6 bg-ink text-white rounded-3xl p-6 sm:p-8">
          <span className="text-[9px] font-mono tracking-widest text-accent uppercase font-bold">
            Official Guidelines
          </span>
          <h4 className="font-serif-display text-lg font-semibold text-white mt-1">
            What Clients Can &amp; Should Bring
          </h4>
          <p className="text-xs text-slate-400 mt-2">
            Ensure a seamless production workflow by aligning with our space guidelines:
          </p>
          <ul className="space-y-4 mt-5">
            {guidelines.map((g) => (
              <li key={g.n} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
                  {g.n}
                </span>
                <div>
                  <span className="block text-xs font-semibold text-white">{g.title}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{g.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-6 max-w-7xl mx-auto mt-24">
        <div className="flex justify-between items-end border-b border-warm-gray/20 pb-6 mb-8 flex-wrap gap-4">
          <div>
            <SectionEyebrow>Workspace Memories</SectionEyebrow>
            <h3 className="font-serif-display text-2xl font-bold text-ink mt-1">Studio Gallery &amp; Spaces</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {galleryFilters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setGalleryFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono border transition-editorial ${
                  galleryFilter === f
                    ? "bg-ink text-paper border-ink"
                    : "bg-transparent text-ink border-warm-gray/25 hover:border-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((g) => (
            <div key={g.id} className="rounded-2xl overflow-hidden border border-warm-gray/15 bg-white group">
              <div className="aspect-4/3 w-full relative">
                <Image
                  src={g.image}
                  alt={g.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2 left-2 bg-ink text-paper text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded">
                  {g.category}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-serif-display font-semibold text-ink text-sm">{g.title}</h4>
                <p className="text-xs text-warm-gray mt-1 leading-relaxed">{g.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking calculator */}
      <section id="booking" className="px-6 max-w-2xl mx-auto mt-24 text-center">
        <SectionEyebrow>Interactive Dispatch Center</SectionEyebrow>
        <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-2">
          Secure Studio Coordination
        </h3>
        <p className="text-sm text-warm-gray mt-3 max-w-lg mx-auto">
          Adjust rate brackets, arrange dates under Lagos West Africa Time
          (WAT) slot rules, and request your custom quote voucher.
        </p>

        <div className="bg-white border border-warm-gray/15 rounded-3xl p-6 sm:p-8 mt-8 text-left">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-[9px] font-mono text-warm-gray uppercase font-bold tracking-widest">
              Booking Process Monitor
            </span>
          </div>
          <h4 className="font-serif-display text-lg font-bold text-ink mt-1">1. Select Your Booking Sector</h4>
          <p className="text-xs text-warm-gray mt-1">Please select the core physical category you wish to locate.</p>

          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedService(s.id)}
                className={`text-left px-4 py-3 rounded-xl border transition-editorial ${
                  selectedService === s.id
                    ? "border-accent bg-accent/5"
                    : "border-warm-gray/20 hover:border-accent/40"
                }`}
              >
                <span className="block text-[9px] font-mono text-warm-gray uppercase">Service Unit</span>
                <span className="block text-sm font-bold text-ink">{s.title}</span>
                <span className="block text-[10px] font-mono text-accent mt-1">
                  Starts {formatNaira(s.hourly ?? s.half)} / {s.hourly ? "hr" : "half-day"}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <span className="block text-[9px] font-mono text-warm-gray uppercase font-bold mb-2">
              Amortized Rate Multipliers
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["hourly", "half", "full"] as Tier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={t === "hourly" && !active.hourly}
                  onClick={() => setTier(t)}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono border transition-editorial disabled:opacity-30 disabled:cursor-not-allowed ${
                    tier === t ? "bg-accent text-white border-accent" : "border-warm-gray/25 text-ink"
                  }`}
                >
                  {t === "hourly" ? `Hourly (${formatNaira(active.hourly ?? 0)})` : t === "half" ? `Half-Day (${formatNaira(active.half)})` : `Full-Day (${formatNaira(active.full)})`}
                </button>
              ))}
            </div>
          </div>

          {tier === "hourly" && (
            <div className="mt-4 flex items-center gap-3">
              <Users className="w-4 h-4 text-warm-gray" aria-hidden="true" />
              <span className="text-xs text-warm-gray">Planned Duration</span>
              <input
                type="number"
                min={1}
                value={hours}
                onChange={(e) => setHours(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 rounded-lg border border-warm-gray/25 text-xs text-center"
              />
              <span className="text-xs text-warm-gray">Hours</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-warm-gray/15">
            <div>
              <span className="block text-[9px] font-mono text-warm-gray uppercase">Estimated Quote Total</span>
              <span className="block text-2xl font-serif-display font-bold text-accent">{formatNaira(total)}</span>
            </div>
            <button
              type="button"
              className="px-5 py-3 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              Proceed to Calendar
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
