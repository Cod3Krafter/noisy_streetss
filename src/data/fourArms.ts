export type Pillar = {
  id: "advisory" | "publishing" | "studio" | "podcast";
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  bg: string;
  badgeText: string;
  badgeClass: string;
};

export const pillars: Pillar[] = [
  {
    id: "advisory",
    label: "Pillar I",
    title: "Editorial Advisory",
    description:
      "Professional book strategy, publishing consulting, translation audits, and distribution ledger designs for West African sovereign writers.",
    ctaLabel: "Advisory Hub",
    bg: "bg-success",
    badgeText: "Pillar I",
    badgeClass: "bg-black/20 text-tan",
  },
  {
    id: "publishing",
    label: "Pillar II",
    title: "Print Publishing",
    description:
      "Offset printing on premium unbleached cellulose fibers. We publish long-form stories and historical prose that resist fleeting digital distraction.",
    ctaLabel: "Browse Catalog",
    bg: "bg-accent",
    badgeText: "Pillar II",
    badgeClass: "bg-black/20 text-paper",
  },
  {
    id: "studio",
    label: "Pillar III",
    title: "Acoustic Studio",
    description:
      "Dry-tuned, wood-paneled recording suites in Lagos Compound. Rental operations configured for vocal tracking, sound scoring, and visual tapes.",
    ctaLabel: "Book Services",
    bg: "bg-info",
    badgeText: "Pillar III",
    badgeClass: "bg-white/10 text-slate-200",
  },
  {
    id: "podcast",
    label: "Pillar IV",
    title: "Broadcast Podcast",
    description:
      "Documentary stories, mechanic rhythms, and dialogues from West African coastal operators. Stream online on standard networks or our clean portals.",
    ctaLabel: "Listen Broadcast",
    bg: "bg-amber-600",
    badgeText: "Pillar IV",
    badgeClass: "bg-black/10 text-paper",
  },
];

export type HeroArm = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export const heroArms: HeroArm[] = [
  {
    eyebrow: "We are",
    title: "Noisy Streetss Press",
    subtitle: "Offsetting independent literature from print press lines in Shomolu.",
  },
  {
    eyebrow: "We conduct",
    title: "Strategic Advisory Services",
    subtitle: "Empowering African writers with publishing consulting, audits & strategy.",
  },
  {
    eyebrow: "We operate",
    title: "Acoustic Recording Studio",
    subtitle: "Dry-tuned Lagos suites for vocal tracking, sound scoring, and visual tapes.",
  },
  {
    eyebrow: "We broadcast",
    title: "Documentary Podcast Network",
    subtitle: "Coastal dialogues and mechanic rhythms streamed from West Africa.",
  },
];
