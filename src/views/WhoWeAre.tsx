import Image from "next/image";
import { BookOpen, Briefcase, Mic, Users2, Award } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";
import { coreCouncil } from "@/data/team";

const arms = [
  { n: "01", icon: BookOpen, title: "Publishing House", body: "Full-scale literary cataloging, premium typesetting, manual bookbinding, offset printing, and direct distribution to independent bookstores." },
  { n: "02", icon: Briefcase, title: "Advisory Firm", body: "Strategy consultation, institutional grant alignment, manuscript feasibility audits, and custom brand designs for emerging publishers." },
  { n: "03", icon: Mic, title: "Noisy Studio", body: "A state-of-the-art acoustic recording and multi-cam broadcasting deck where we record our high-fidelity pod-casts and interview archives." },
  { n: "04", icon: Users2, title: "Noisy Book Club", body: "Active community frameworks connecting diaspora readers with Lagos authors via monthly meetings, custom courtyard chats, and reading initiatives." },
];

const values = [
  { title: "African Stories First", body: "We reject standard commercial constraints that force African literature to satisfy exotic overseas filters. We construct brave, unapologetic narratives that explore internal metropolitan truths, chemical realities, port dynamics, and real Lagosian systems." },
  { title: "Anti-AI-Slop Craftsmanship", body: "Every font pairing, margin layout grid, and tactile cover cloth we select is a deliberate human choice. We reject heavy default digital templates and lazy structural grids, insisting on custom, classic typography that respects the intellectual posture of literature." },
  { title: "Structural Equity", body: "We redistribute our consultancy fees and physical studio profits back to our community. We fund priority editorial review sessions for emerging writers, organize free public book clubs, and offer subsidized acoustic rentals to voice local narratives." },
];

const press = [
  { outlet: "The Republic", title: "A Critical Cultural Sovereign", quote: "Noisy Streetss is a vital, self-sustaining force in West African arts—reclaiming press manufacturing as a defiant act of design sovereignty.", tag: "Editorial Survey 2026" },
  { outlet: "Lagos Review", title: "Structural Book Excellence", quote: "By marrying high-contrast Freight display serifs with robust local printing, Noisy Streetss honors the true tactile weight of the African word.", tag: "Creative Hub of the Year" },
  { outlet: "Granta Magazine", title: "Pioneering Independent Model", quote: "An outstanding full-stack model proving how literature, bespoke consultancies, pod-casting, and printing can thrive collaboratively without donor dependencies.", tag: "Cultural Selection" },
  { outlet: "The Guardian (NG)", title: "The Sound of Shomolu Press", quote: "Standing in sharp contrast to cheap foreign imports, Noisy Streetss's heavy-grain physical leaves carry the sweat and boisterous heartbeat of Lagos streets.", tag: "Literary Leaf Re-Award" },
];

export default function WhoWeAre() {
  return (
    <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <SectionEyebrow>◐ About Noisy Streetss • Editorial Profile &amp; Story</SectionEyebrow>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3 leading-tight">
          A Lagos literature press &amp; sovereignty.
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed mt-4">
          Operating a book-printing factory, commercial consultancy, and
          high-fidelity video/audio studio fields to construct self-funded
          pipelines for independent African literature.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 mt-16">
        <div>
          <SectionEyebrow>The Story &amp; Convictions</SectionEyebrow>
          <h2 className="font-serif-display text-2xl font-bold text-ink mt-1 mb-4">Our Founding Mission</h2>
          <div className="space-y-4 text-sm text-warm-gray leading-relaxed">
            <p>
              &quot;Noisy Streetss was established in Lagos in the spring of
              2024 to tackle systemic structural dependencies in African
              publishing. For decades, African writers and deep thinkers
              produced magnificent manuscripts only to face a crushing
              paradox: they had to rely on distant European publishing
              houses to edit their thoughts, and imported British or Asian
              mills to physically print their pages.
            </p>
            <p>
              We chose to break this paradigm on Lagos soil. By operating our
              own offset press factory in Shomolu—powered by somatic offset
              machinery and hand-binders—and integrating a professional
              commercial advisory firm and recording spaces, our business
              streams directly fund the physical crafting of pristine local
              literature.
            </p>
            <p>
              We do not believe a book is a mere digital PDF file; a book is
              an organic crop. It must be harvested, dry-pressed, typeset
              with structural authority, bound with precision, and layered
              on a mahogany shelf to outlast centuries of noise.
            </p>
          </div>
          <blockquote className="mt-6 bg-accent/10 border-l-4 border-accent rounded-r-xl px-5 py-4">
            <p className="font-serif-body italic text-ink text-sm">
              &quot;Your voices hold weight. Our mission is to give that
              weight a beautiful physical container that can survive the
              storm and carry your stories down generations.&quot;
            </p>
            <span className="block text-[10px] font-mono text-accent uppercase font-bold mt-2">
              — Modupe Daramola, Founder
            </span>
          </blockquote>
        </div>

        <div>
          <SectionEyebrow>The Structural Cooperative</SectionEyebrow>
          <h3 className="font-serif-display text-2xl font-bold text-ink mt-1 mb-2">The Four Corporate Arms</h3>
          <p className="text-sm text-warm-gray leading-relaxed mb-6">
            We operate across four interlocked, plain-language divisions
            that secure our commercial autonomy and amplify creative works.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {arms.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.n} className="bg-white border border-warm-gray/15 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono text-warm-gray/60">{a.n}</span>
                    <Icon className="w-4 h-4 text-accent" aria-hidden="true" />
                  </div>
                  <h4 className="font-serif-display font-semibold text-ink text-sm">{a.title}</h4>
                  <p className="text-xs text-warm-gray leading-relaxed mt-1.5">{a.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section id="values-commitments" className="mt-24 scroll-mt-28">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <SectionEyebrow>Our Doctrinal Anchors</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
            Values &amp; Editorial Commitments
          </h2>
          <p className="text-sm text-warm-gray mt-2">
            We adhere strictly to these structural ethics. They govern our
            publishing priorities and our physical pressroom outputs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-white border border-warm-gray/15 rounded-3xl p-6">
              <h4 className="font-serif-display font-semibold text-ink">{v.title}</h4>
              <p className="text-xs text-warm-gray leading-relaxed mt-2">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="core-council" className="mt-24 scroll-mt-28">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <SectionEyebrow>Editorial Portrait Gallery</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">Meet the Core Council</h2>
          <p className="text-sm text-warm-gray mt-2">
            The dedicated directors supervising daily pressroom &amp; advisory operations
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {coreCouncil.map((m) => (
            <div key={m.id} className="bg-white border border-warm-gray/15 rounded-3xl p-6 flex gap-5">
              <div className="w-20 h-24 relative rounded-2xl overflow-hidden shrink-0">
                <Image src={m.image} alt={m.name} fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-warm-gray/60 uppercase">{m.location}</span>
                <h3 className="font-serif-display font-bold text-ink mt-0.5">{m.name}</h3>
                <span className="inline-block text-[9px] font-mono text-accent uppercase font-bold bg-accent/10 px-2 py-0.5 rounded mt-1">
                  {m.role}
                </span>
                <p className="text-xs text-warm-gray leading-relaxed mt-2">{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="press-mentions" className="mt-24 bg-white border border-warm-gray/15 rounded-3xl p-6 sm:p-10 scroll-mt-28">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <SectionEyebrow>Critical Recognition</SectionEyebrow>
          <h4 className="font-serif-display text-xl sm:text-2xl font-bold text-ink mt-1">Press Mentions &amp; Awards</h4>
          <p className="text-sm text-warm-gray mt-2">
            Our structures, designs, and models reviewed by leading historical journals and literary hubs.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {press.map((p) => (
            <div key={p.outlet} className="border-l-2 border-accent pl-4">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-warm-gray uppercase font-bold">
                <Award className="w-3 h-3 text-accent" aria-hidden="true" />
                {p.outlet}
              </div>
              <h5 className="font-serif-display font-bold text-ink text-sm mt-2">{p.title}</h5>
              <p className="font-serif-body italic text-xs text-warm-gray leading-relaxed mt-2">
                &quot;{p.quote}&quot;
              </p>
              <div className="flex items-center gap-2 mt-3 text-[9px] font-mono uppercase">
                <span className="text-emerald-600 font-bold">Status: Approved</span>
              </div>
              <span className="inline-block mt-1 text-[8px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded uppercase">
                {p.tag}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
