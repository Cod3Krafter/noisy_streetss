import type { LucideIcon } from "lucide-react";
import {
  House,
  BookOpen,
  Briefcase,
  MicVocal,
  Rss,
  Radio,
  ShoppingBag,
  Info,
  Handshake,
  Bookmark,
  Layers,
} from "lucide-react";

export type ViewId =
  | "home"
  | "publishing"
  | "advisory"
  | "studio"
  | "blog"
  | "podcast"
  | "shop"
  | "who-we-are"
  | "team"
  | "press"
  | "values"
  | "contact"
  | "partner"
  | "support-donate"
  | "book-club"
  | "tiers";

export type PrimaryNavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon;
};

export const primaryNav: PrimaryNavItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "publishing", label: "Publishing", icon: BookOpen },
  { id: "advisory", label: "Advisory", icon: Briefcase },
  { id: "studio", label: "Studio", icon: MicVocal },
  { id: "blog", label: "Blog & Essays", icon: Rss },
  { id: "podcast", label: "Podcast", icon: Radio },
  { id: "shop", label: "Shop", icon: ShoppingBag },
];

export type MoreNavGroup = {
  heading: string;
  icon: LucideIcon;
  items: { id: ViewId; label: string; description: string }[];
};

export const moreNavGroups: MoreNavGroup[] = [
  {
    heading: "About Noisy Streetss",
    icon: Info,
    items: [
      { id: "who-we-are", label: "Who We Are", description: "Our founding mission, history & 4 arms" },
      { id: "team", label: "Team", description: "Meet the core council portrait gallery" },
      { id: "press", label: "Press & Recognition", description: "Bespoke awards and journal reviews" },
      { id: "values", label: "Values & Commitments", description: "Our procedural editorial anchors" },
    ],
  },
  {
    heading: "Contact & Support",
    icon: Handshake,
    items: [
      { id: "contact", label: "General Contact", description: "Inbox query routing desk" },
      { id: "partner", label: "Partner With Us", description: "Brands, event sponsorship, media deals" },
      { id: "support-donate", label: "Support Us / Donate", description: "Local and global patron systems NGN/USD" },
    ],
  },
];

export const moreNavExtra: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "book-club", label: "Book Club", icon: Bookmark },
  { id: "tiers", label: "Tiers", icon: Layers },
];

export const allNavLabels: Record<ViewId, string> = {
  home: "Home",
  publishing: "Publishing",
  advisory: "Advisory",
  studio: "Studio",
  blog: "Blog & Essays",
  podcast: "Podcast",
  shop: "Shop",
  "who-we-are": "Who We Are",
  team: "Team",
  press: "Press & Recognition",
  values: "Values & Commitments",
  contact: "General Contact",
  partner: "Partner With Us",
  "support-donate": "Support Us / Donate",
  "book-club": "Book Club",
  tiers: "Tiers",
};

export const footerOperationalArms: { id: ViewId; label: string; dotClassName: string }[] = [
  { id: "advisory", label: "Editorial Advisory", dotClassName: "bg-emerald-500" },
  { id: "publishing", label: "Publishing & Letters", dotClassName: "bg-amber-500" },
  { id: "studio", label: "Acoustic Studio", dotClassName: "bg-blue-500" },
  { id: "podcast", label: "Broadcast Podcast", dotClassName: "bg-rose-500" },
  { id: "shop", label: "Boutique Merch Shop", dotClassName: "bg-indigo-500" },
  { id: "blog", label: "Dispatch Blog", dotClassName: "bg-accent" },
  { id: "tiers", label: "Patrons Membership", dotClassName: "bg-teal-500" },
];
