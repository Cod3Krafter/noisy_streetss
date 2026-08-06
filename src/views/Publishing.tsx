"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Heart, ArrowRight, Search } from "lucide-react";
import { useView } from "@/context/ViewContext";
import SectionEyebrow from "@/components/SectionEyebrow";
import { books, type Book } from "@/data/books";

const formatNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

const genreFilters = ["All", "Fiction", "Poetry", "Anthology", "Experimental"] as const;

const laureates = [
  {
    id: "modupe-daramola",
    name: "Modupe Daramola",
    location: "Lagos, Nigeria",
    image: "/images/unsplash/unsplash-1507003211169-0a1dd7228f2d.jpg",
    bio: "Modupe Daramola is the Founder & Lead Strategist of Noisy Streetss. She is a cartographer, literary advisory consultant, and book designer based in Lagos. Her writing focuses on urban planning, land rights, and maritime histories of the Bight of Benin.",
    prize: '"Founder, Noisy Streetss Literary & Media Studio"',
  },
  {
    id: "chika-alabi",
    name: "Dr. Chika Alabi",
    location: "Port Harcourt, Nigeria",
    image: "/images/unsplash/unsplash-1519167758481-83f550bb49b3.jpg",
    bio: "Dr. Chika Alabi is an environmental scientist and essayist. Her work traces the intersection of post-colonial infrastructure and environmental systems in coastal West Africa. She holds a doctorate in Hydrobiology from the University of Ibadan.",
    prize: '"Senior Fellow, Ecological Action Network Nigeria"',
  },
  {
    id: "adeoluwa-saro-wewa",
    name: "Adeoluwa Saro-Wewa",
    location: "Apapa, Lagos",
    image: "/images/unsplash/unsplash-1472099645785-5658abf4ff4e.jpg",
    bio: "Adeoluwa Saro-Wewa is a poet and harbor clerk based in Apapa. His work captures the tactile, industrial noise of Nigerian ports, the maritime lore of West African sailors, and the music of Lagos street traders.",
    prize: '"Recipient of the Ibadan Poetry Prize"',
  },
];

const archiveVolumes = [
  { volume: "Volume V", works: "14 Works", title: "Mechanical Linseed & Shomolu Rhythms", date: "October 2025" },
  { volume: "Volume IV", works: "11 Works", title: "River Silts and Hydro-Realism Dispatches", date: "January 2025" },
  { volume: "Volume III", works: "16 Works", title: "Verandahs of Lagos & Colonial Dust Grids", date: "May 2024" },
  { volume: "Volume II", works: "9 Works", title: "Bight of Benin Maritime Navigation Sagas", date: "November 2023" },
];

const guidelines = [
  {
    title: "Prose & Style Directives",
    body: "We advocate for deep visual pacing, atmospheric descriptions, and geographical texture. We firmly decline corporate marketing idioms, AI-generated manuscripts, or simple cheetah-print clichés. Paired typefaces and heavy spatial architectures are highly appreciated.",
  },
  {
    title: "Anonymity & Blind Audit",
    body: "All submissions undergo complete double-blind editorial peer review. Remove your actual name, postal markers, or bibliography entries from your attached manuscript block. Your real name should only exist in the intake user forms.",
  },
  {
    title: "Word Length & Formatting",
    body: "For first round intakes, do not submit your complete book. Paste an immersive excerpt of up to 1,500 words into the Submission Workshop desk. Ensure paragraphs are clearly distinguished with uniform indent spacing.",
  },
  {
    title: "Royalty Structures & Output",
    body: "We operate on an independent cooperative model. Selected authors receive a guaranteed 40% net royalty payout on all physical paperback offset copies and 60% on e-book prints. We register ISBN catalogs in both Lagos and European databases.",
  },
];

function BookCard({
  book,
  saved,
  onToggleSave,
}: {
  book: Book;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="bg-white border border-warm-gray/15 rounded-3xl overflow-hidden flex flex-col group transition-editorial hover:shadow-lg">
      <div className="aspect-4/5 w-full relative bg-slate-100 cursor-pointer">
        <Image
          src={book.image}
          alt={book.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-2 left-2 bg-ink text-paper text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded shadow">
          {book.category}
        </span>
        {book.editorsChoice && (
          <span className="absolute top-2 right-2 bg-accent text-paper text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded shadow">
            Editors&apos; Choice
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col justify-between grow">
        <div className="space-y-1.5">
          <h4 className="font-serif-display font-semibold text-sm text-ink leading-tight cursor-pointer hover:text-info transition-colors line-clamp-1">
            {book.title}
          </h4>
          <p className="text-[10px] font-serif-body italic text-warm-gray">by {book.author}</p>
          <p className="text-[10px] text-warm-gray font-sans-ui line-clamp-3 leading-relaxed">
            {book.synopsis}
          </p>
        </div>
        <div className="pt-3 mt-3 border-t border-warm-gray/10 flex items-center justify-between">
          <div>
            <span className="block font-mono font-bold text-xs text-ink">
              {formatNaira(book.priceNGN)}
            </span>
            <span className="block text-[8px] text-slate-400 font-mono">{book.publishDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSave}
              aria-label="Save to reading shelf"
              className={`p-1.5 rounded-lg transition-colors ${saved ? "text-accent" : "text-warm-gray/50 hover:text-accent"}`}
            >
              <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider bg-ink hover:bg-accent text-white transition-colors"
            >
              Excerpt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Publishing() {
  const { setView } = useView();
  const [genre, setGenre] = useState<(typeof genreFilters)[number]>("All");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", email: "", title: "", genre: "Fiction", prose: "" });

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesGenre = genre === "All" || b.category === genre;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      return matchesGenre && matchesSearch;
    });
  }, [genre, search]);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="pt-32 pb-24">
      {/* Hero */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <SectionEyebrow>§ Cooperative Publishing House</SectionEyebrow>
            <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold text-ink leading-[1.15]">
              &quot;We are a publishing house committed to publishing new
              African writers, both on the continent and in the diaspora.&quot;
            </h1>
            <div className="bg-accent/10 border-l-4 border-accent rounded-r-xl px-5 py-4 max-w-md">
              <p className="font-serif-body italic text-ink text-sm">
                &quot;You can make our House, your Home.&quot;
              </p>
              <span className="block text-[9px] font-mono tracking-widest text-accent uppercase font-bold mt-1">
                — Noisy Streetss Literary Cooperative
              </span>
            </div>
            <p className="text-sm text-warm-gray leading-relaxed max-w-xl">
              We engineer beautiful printed artifacts made of premium
              unbleached cellulose fiber, bypassing foreign supply structures
              to design, print, and distribute directly from the streets of
              Lagos to bookshelf destinations worldwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#catalog"
                className="px-6 py-3 rounded-xl bg-ink text-paper text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Navigate Catalogue
              </a>
              <a
                href="#submissions"
                className="px-6 py-3 rounded-xl border border-warm-gray/30 text-ink text-xs font-bold uppercase tracking-widest hover:border-accent hover:text-accent transition-colors"
              >
                Active Calls for Work
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 relative h-80">
            <div className="absolute inset-0 rounded-3xl overflow-hidden border border-warm-gray/15 shadow-xl rotate-2">
              <Image
                src="/images/unsplash/unsplash-1544005313-94ddf0286df2.jpg"
                alt="Tactile raw printed cards and typewriter"
                fill
                sizes="40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="px-6 max-w-7xl mx-auto mt-24">
        <div className="border-b border-warm-gray/20 pb-6 mb-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <SectionEyebrow>The Editions</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              Published Books &amp; Anthologies
            </h2>
            <p className="text-sm text-warm-gray mt-2 max-w-xl">
              Explore small-batch pressings. Link to a title below to audit
              synopsis and read longform excerpts.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-warm-gray/50 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter title / author..."
              className="pl-9 pr-4 py-2 rounded-xl border border-warm-gray/25 bg-white text-xs font-sans-ui focus:outline-none focus:border-accent w-56"
            />
          </div>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          {genreFilters.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider font-mono transition-editorial border ${
                genre === g
                  ? "bg-accent text-paper border-accent"
                  : "bg-transparent text-ink border-warm-gray/25 hover:border-accent"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              saved={saved.has(book.id)}
              onToggleSave={() => toggleSave(book.id)}
            />
          ))}
        </div>
      </section>

      {/* Laureates */}
      <section className="px-6 max-w-7xl mx-auto mt-24">
        <div className="border-b border-warm-gray/20 pb-6 mb-10">
          <SectionEyebrow>Central Voices</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
            Laureate Author spotlights
          </h2>
          <p className="text-sm text-warm-gray mt-2 max-w-xl">
            Meet the environmental historians and poetic novelists
            representing the vanguard of modern Noisy Streetss literature.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {laureates.map((l) => (
            <div
              key={l.id}
              className="bg-white border border-warm-gray/15 rounded-3xl p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full overflow-hidden relative border border-warm-gray/15">
                  <Image src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />
                </div>
                <span className="block text-[9px] font-mono tracking-widest text-warm-gray uppercase font-bold">
                  {l.location}
                </span>
                <h3 className="font-serif-display text-lg font-bold text-ink">{l.name}</h3>
                <p className="text-xs text-warm-gray leading-relaxed">{l.bio}</p>
                <div className="pt-2">
                  <span className="block text-[9px] font-mono text-accent uppercase font-bold">
                    Prize of Distinction:
                  </span>
                  <p className="text-xs font-serif-body italic text-ink">{l.prize}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-warm-gray/10">
                <span className="text-[9px] font-mono text-warm-gray/60 uppercase tracking-widest">
                  Laureate Corner
                </span>
                <button
                  type="button"
                  className="text-[10px] font-bold uppercase tracking-wider font-mono text-accent flex items-center gap-1"
                >
                  Explore work
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submissions */}
      <section id="submissions" className="bg-ink text-paper py-20 px-6 mt-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-5">
            <span className="inline-block bg-accent text-white font-mono text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              Active Calls for Work
            </span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              Volume VI Theme: Maritime Archives &amp; Coastal Poetics
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Our active submission queue evaluates novel excerpts, hybrid
              longform prose, and cohesive lyric poetry tracing the shoreline
              communities, lagoon dredging vectors, or sandbar architectures
              of West Africa. We require web-native prose entries directly
              processed through our interactive desk below.
            </p>
            <div className="flex gap-8 pt-2">
              <div>
                <span className="block text-[9px] font-mono text-accent uppercase font-bold">
                  Submissions Deadline
                </span>
                <span className="block text-sm text-white font-semibold mt-1">August 30, 2026</span>
              </div>
              <div>
                <span className="block text-[9px] font-mono text-accent uppercase font-bold">
                  Maximum Snippet Word Count
                </span>
                <span className="block text-sm text-white font-semibold mt-1">1,500 Words Excerpt</span>
              </div>
            </div>
            <p className="font-serif-body italic text-slate-400 text-xs pt-2">
              &quot;We perform double-blind critiques. Authors receive
              immediately calculated structural feedback regarding their
              readability parameters, narrative tone, and prose strengths.&quot;
            </p>
          </div>
          <div className="lg:col-span-6 bg-black/40 border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-serif-display text-lg font-semibold text-white">
                The Submission Workshop
              </h3>
              <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> FAST TRACK PROCESSING
              </span>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Author Name / Pen Name *
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Tari Oro"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Director Email *
                  </span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="tari@domain.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Manuscript Title *
                  </span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. The Brass Buoy"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold mb-1">
                    Classified Genre / Frame
                  </span>
                  <select
                    value={form.genre}
                    onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option>Fiction</option>
                    <option>Poetry</option>
                    <option>Anthology</option>
                    <option>Experimental</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <div className="flex justify-between mb-1">
                  <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold">
                    Manuscript Prose Paragraph *
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {form.prose.trim() ? form.prose.trim().split(/\s+/).length : 0} / 1,500 words
                  </span>
                </div>
                <textarea
                  value={form.prose}
                  onChange={(e) => setForm((f) => ({ ...f, prose: e.target.value }))}
                  placeholder="Begin weaving your prose draft right here. Unfold original narrative chapters..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
                />
              </label>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent hover:bg-white hover:text-black text-white font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Dispatch Draft To Committee
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16">
          <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-mono tracking-[0.3em] text-accent font-bold uppercase">
                The Repository
              </span>
              <h3 className="font-serif-display text-xl font-bold text-white mt-1">
                Past Issues &amp; Volume Archive
              </h3>
            </div>
            <span className="text-[9px] font-mono text-slate-500 hidden sm:block">
              Accessed via Accommodation Envelope
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {archiveVolumes.map((v) => (
              <div
                key={v.volume}
                className="bg-black/30 border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase">
                    <span>{v.volume}</span>
                    <span>{v.works}</span>
                  </div>
                  <h4 className="font-serif-display text-sm font-semibold text-white mt-2 leading-snug">
                    {v.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{v.date}</p>
                </div>
                <button className="text-[9px] font-bold font-mono uppercase tracking-wider text-accent text-left">
                  Browse Retrospective
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="px-6 max-w-4xl mx-auto mt-24 text-center">
        <span className="inline-block text-accent font-serif-display text-4xl mb-2">§</span>
        <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink">
          Official Submission Guidelines
        </h2>
        <p className="text-[10px] font-mono tracking-widest text-warm-gray uppercase mt-2">
          Web-Native Editorial Protocols — No Hidden Downloads
        </p>
        <div className="bg-white border border-warm-gray/15 rounded-3xl p-6 sm:p-10 mt-8 text-left">
          <div className="grid sm:grid-cols-2 gap-8">
            {guidelines.map((g) => (
              <div key={g.title}>
                <h4 className="font-serif-display font-semibold text-ink mb-2">{g.title}</h4>
                <p className="text-xs text-warm-gray leading-relaxed">{g.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-warm-gray/10">
            <div>
              <span className="block text-[9px] font-mono text-accent uppercase font-bold">
                Enquiry Questions?
              </span>
              <p className="text-xs text-warm-gray mt-1">
                Have specific questions regarding offset parameters or
                translation grant coordinates?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("contact")}
              className="px-5 py-2.5 rounded-xl bg-ink text-paper text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shrink-0"
            >
              Contact Desk
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
