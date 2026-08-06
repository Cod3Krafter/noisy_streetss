export type MerchItem = {
  id: string;
  title: string;
  author?: string;
  category: "Books" | "Stationery";
  description: string;
  image: string;
  priceNGN: number;
  priceUSDLabel: string;
  pages?: number;
  genre?: string;
};

export const merch: MerchItem[] = [
  {
    id: "cartographer-hardback",
    title: "The Cartographer of Sandbars (Hardback)",
    author: "Modupe Daramola",
    category: "Books",
    description:
      "LTD first edition. Heavy linen binder, gold-foil cover lettering, dynamic lagoon map insert printed on recycled deckle cotton leaves.",
    image: "/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg",
    priceNGN: 15000,
    priceUSDLabel: "$18 USD",
    pages: 310,
    genre: "Fiction",
  },
  {
    id: "post-oil-paperback",
    title: "Post-Oil Ecologies (Paperback)",
    author: "Dr. Chika Alabi",
    category: "Books",
    description:
      "Soft-cover matte finish, charcoal interior inks, fold-out Niger Delta botanical map illustration plate.",
    image: "/images/unsplash/unsplash-1610116306796-6fea9f4fae38.jpg",
    priceNGN: 14000,
    priceUSDLabel: "$16 USD",
    pages: 245,
    genre: "Experimental",
  },
  {
    id: "noisy-tote-bag",
    title: "Official Noisy Canvas Tote Bag",
    category: "Stationery",
    description:
      'Heavy 16oz West African cotton canvas. Hand-painted typographic quote: "YOU CAN MAKE OUR HOUSE, YOUR HOME." Screen-printed deep indigo ink.',
    image: "/images/unsplash/unsplash-1544816155-12df9643f363.jpg",
    priceNGN: 12000,
    priceUSDLabel: "$15 USD",
  },
  {
    id: "shomolu-sketchbook",
    title: "The Shomolu Hardbound Sketchbook",
    category: "Stationery",
    description:
      "Handbound in our Lagos workshop. Contains 160 pages of heavy 150gsm sugarcane drawing sheets, lay-flat linen spine, terracotta bookmark tab.",
    image: "/images/unsplash/unsplash-1512820790803-83ca734da794.jpg",
    priceNGN: 10000,
    priceUSDLabel: "$12 USD",
  },
];
