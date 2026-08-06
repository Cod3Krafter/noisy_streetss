export type TeamMember = {
  id: string;
  name: string;
  role: string;
  location: string;
  image: string;
  bio: string;
};

export const coreCouncil: TeamMember[] = [
  {
    id: "modupe-daramola",
    name: "Modupe Daramola",
    role: "Founder & Lead Strategist",
    location: "Surulere / Marylebone based",
    image: "/images/unsplash/unsplash-1519167758481-83f550bb49b3.jpg",
    bio: "Modupe Daramola is the visionary force driving Noisy Streetss. A skilled cartographer and publications engineer, Modupe spent ten years mapping the shifting sandbars and maritime trade networks of the Bight of Benin. Her deep understanding of physical materials led her to return to Lagos to set up our independent offset press channels in Shomolu. She designs our core typography systems and lectures on structural publishing and book composition at Ibadan creative workshops.",
  },
  {
    id: "benedict-onwudinjo",
    name: "Benedict Onwudinjo",
    role: "Operations & Logistics Director",
    location: "Apapa Port / Surulere",
    image: "/images/unsplash/unsplash-1472099645785-5658abf4ff4e.jpg",
    bio: "Benedict Onwudinjo manages our complex logistical chains and distribution channels. Having previously served for a decade as a commercial customs clearing supervisor at Apapa Port, Benedict joined the Noisy Streetss council in 2025. He masterminded our friction-free shipping networks across the global diaspora and curates our physical book club gatherings and open courtyard coordinates in the Surulere headquarters.",
  },
  {
    id: "silas-oribhabor",
    name: "Silas Oribhabor",
    role: "Lead Press Craftsman & Master Printer",
    location: "Shomolu Pressroom",
    image: "/images/unsplash/unsplash-1507003211169-0a1dd7228f2d.jpg",
    bio: "Silas Oribhabor oversees our somatic manufacturing factory in Shomolu. Silas is a legendary press operator with forty years of manual offset press experience in Lagos. He runs our classic Heidelberg presses, calibrating ink viscosity, paper humidity, and blanket pressure by hand. Under his rigorous technical guidance, our physical books carry that dense, authentic ink texture that digital readers and cheap print-on-demand services cannot match.",
  },
  {
    id: "funmi-dada",
    name: "Funmi Dada",
    role: "Editorial Director & Lead Designer",
    location: "Yaba / Ikeja",
    image: "/images/unsplash/unsplash-1544005313-94ddf0286df2.jpg",
    bio: "Funmi Dada coordinates Noisy Streetss's literary cataloging, font pairings, and graphic identities. Previously designing for cultural collectives across Accra and London, Funmi returned to Lagos to direct our text-first aesthetic grids. She oversees layout production sheets, manages submissions pipelines, and works closely with our authors to translate complex manuscript narratives into magnificent, highly-symmetric physical forms.",
  },
];
