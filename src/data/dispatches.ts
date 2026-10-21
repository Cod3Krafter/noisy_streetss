export type Dispatch = {
  id: string;
  title: string;
  subtitle: string;
  kicker: string;
  readTime: string;
  type: "Original Essay" | "Book Extract";
  filterCategory: "Publishing" | "Cultural" | "Design" | "Excerpts";
  author: string;
  image: string;
  featured?: boolean;
  body?: string;
  publishedDate?: string;
};

export const dispatches: Dispatch[] = [
  {
    id: "print-in-the-storm",
    title: "How We Print in the Storm",
    subtitle: '"The Material Realities of Presswork in Lagos"',
    kicker: "Publishing / Behind the Leaves",
    readTime: "10 min read",
    type: "Original Essay",
    filterCategory: "Publishing",
    author: "Modupe Daramola",
    image: "/images/unsplash/unsplash-1500648767791-00dcc994a43e.jpg",
    featured: true,
    publishedDate: "May 12, 2026",
    body: "An examination of why printing books in Lagos is a heroic, defiant act of industrial craftsmanship—navigating fluctuating currency, generator hums, and the stubborn beauty of heavy ink. To publish a book in Nigeria is to engage in a physical battle with the elements. We do not operate in a world of seamless print-on-demand APIs or sterile European paper mills. Here, a book is an organic negotiation with diesel engines, humidity, and the price of ink rollers. When the mains voltage drops at 2:00 PM in our somatic factory in Shomolu, the great Heidelberg offset presses do not merely pause. They sigh. If our printer, Silas, is not fast enough to clear the cylinders, the ink begins to skin under the dense tropical heat, leaving a permanently flawed haze upon the leaves of poetry. Yet this friction is exactly why our books hold their weight. Our text-first designs are engineered to survive these limitations. We select heavy-grained paper that can take the high density of linseed inks, giving our books that rich, tactile scent that you smell when you open our parcels. We refuse to let African literature reside solely on digital readers or as high-priced imports printed in Cornwall. By keeping our production rooted in Lagos soil, our physical books carry the literal weight, tension, and sweat of the streets they document.",
  },
  {
    id: "lagos-verandah",
    title: "The Architecture of the Lagos Verandah",
    subtitle: '"A Study in Social Space and Editorial Solitude"',
    kicker: "Architecture • Cultural Study",
    readTime: "12 min read",
    type: "Original Essay",
    filterCategory: "Cultural",
    author: "Benedict",
    image: "/images/unsplash/unsplash-1519167758481-83f550bb49b3.jpg",
  },
  {
    id: "cheetah-print-cliche",
    title: "Beyond the Cheetah Print Cliché",
    subtitle: '"Forging a Genuine Modern African Graphic Language"',
    kicker: "Design Criticism",
    readTime: "15 min read",
    type: "Original Essay",
    filterCategory: "Design",
    author: "Funmi",
    image: "/images/unsplash/unsplash-1544005313-94ddf0286df2.jpg",
  },
  {
    id: "cartographer-excerpt",
    title: "The Cartographer of Sandbars",
    subtitle: '"Chapter Excerpt from Noisy Press Releases"',
    kicker: "Literature • Fiction",
    readTime: "16 min read",
    type: "Book Extract",
    filterCategory: "Excerpts",
    author: "Modupe",
    image: "/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg",
  },
  {
    id: "post-oil-excerpt",
    title: "Post-Oil Ecologies",
    subtitle: '"Chapter Excerpt from Noisy Press Releases"',
    kicker: "Literature • Experimental",
    readTime: "13 min read",
    type: "Book Extract",
    filterCategory: "Excerpts",
    author: "Dr.",
    image: "/images/unsplash/unsplash-1610116306796-6fea9f4fae38.jpg",
  },
  {
    id: "cocoa-port-excerpt",
    title: "Syllables of the Cocoa Port",
    subtitle: '"Chapter Excerpt from Noisy Press Releases"',
    kicker: "Literature • Poetry",
    readTime: "6 min read",
    type: "Book Extract",
    filterCategory: "Excerpts",
    author: "Adeoluwa",
    image: "/images/unsplash/unsplash-1544947950-fa07a98d237f.jpg",
  },
  {
    id: "yoruba-avant-garde-excerpt",
    title: "Echoes of the Yoruba Avant-Garde",
    subtitle: '"Chapter Excerpt from Noisy Press Releases"',
    kicker: "Literature • Anthology",
    readTime: "19 min read",
    type: "Book Extract",
    filterCategory: "Excerpts",
    author: "Funmilayo",
    image: "/images/unsplash/unsplash-1598488035139-bdbb2231ce04.jpg",
  },
];
