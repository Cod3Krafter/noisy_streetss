export type Book = {
  id: string;
  title: string;
  author: string;
  category: "Fiction" | "Poetry" | "Anthology" | "Experimental";
  description: string;
  synopsis: string;
  image: string;
  priceNGN: number;
  priceUSDLabel: string;
  isNewRelease?: boolean;
  editorsChoice?: boolean;
  pages?: number;
  publishDate: string;
};

export const books: Book[] = [
  {
    id: "cartographer-of-sandbars",
    title: "The Cartographer of Sandbars",
    author: "Modupe Daramola",
    category: "Fiction",
    description:
      "LTD first edition. Heavy linen binder, gold-foil cover lettering, dynamic lagoon map insert printed on recycled deckle cotton leaves.",
    synopsis:
      "Amidst the shifting sandbars of the Lagos Lagoon, an eccentric mapmaker races against real estate dredging crews to plot the memories of communities disappearing beneath modern concrete foundations.",
    image: "/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg",
    priceNGN: 12500,
    priceUSDLabel: "$18 USD",
    isNewRelease: true,
    editorsChoice: true,
    pages: 310,
    publishDate: "January 2026",
  },
  {
    id: "post-oil-ecologies",
    title: "Post-Oil Ecologies",
    author: "Dr. Chika Alabi",
    category: "Experimental",
    description:
      "Soft-cover matte finish, charcoal interior inks, fold-out Niger Delta botanical map illustration plate.",
    synopsis:
      "An hybrid exploration of Niger Delta creeks, documenting the stubborn resilience of vegetal systems, oil-drum furniture, and the local design dialects of youth taking back desecrated rivers.",
    image: "/images/unsplash/unsplash-1610116306796-6fea9f4fae38.jpg",
    priceNGN: 14000,
    priceUSDLabel: "$16 USD",
    editorsChoice: true,
    pages: 245,
    publishDate: "November 2025",
  },
  {
    id: "syllables-cocoa-port",
    title: "Syllables of the Cocoa Port",
    author: "Adeoluwa Saro-Wewa",
    category: "Poetry",
    description: "A collection tracing the rhythms of West African port towns.",
    synopsis:
      "A spectacular collection of poetry documenting the industrial rhythms of Apapa Wharf, cocoa storage dampness, and the deep, rich accent of lorry drivers navigating custom checkpoints.",
    image: "/images/unsplash/unsplash-1544947950-fa07a98d237f.jpg",
    priceNGN: 8000,
    priceUSDLabel: "$12 USD",
    isNewRelease: true,
    publishDate: "March 2026",
  },
  {
    id: "echoes-yoruba-avant-garde",
    title: "Echoes of the Yoruba Avant-Garde",
    author: "Funmilayo Benson",
    category: "Anthology",
    description: "An anthology of speculative and multi-genre Nigerian voices.",
    synopsis:
      "An expansive anthology showcasing speculative and multi-genre works by Nigerian writers who push boundaries, merging ancient spiritual systems with future Lagosian cybernetics.",
    image: "/images/unsplash/unsplash-1598488035139-bdbb2231ce04.jpg",
    priceNGN: 16000,
    priceUSDLabel: "$19 USD",
    publishDate: "September 2025",
  },
];
