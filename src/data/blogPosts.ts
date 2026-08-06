export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  readTime: string;
  image: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "saltwater-cartographer",
    title: "The Saltwater Cartographer: Mapping Memories of Coastal Lagos",
    excerpt: "How shifting sandbars and rising tides reshape community history.",
    tag: "Fiction",
    date: "May 20, 2026",
    readTime: "8 min read",
    image: "/images/unsplash/unsplash-1543002588-bfa74002ed7e.jpg",
  },
  {
    id: "sovereign-pulp",
    title: "Sovereign Pulp: The Heidelberg Press & Industrial Resilience",
    excerpt: "Silas Adeniji on offset press line engineering inside Shomolu.",
    tag: "Advisory Dispatch",
    date: "May 14, 2026",
    readTime: "12 min read",
    image: "/images/unsplash/unsplash-1512820790803-83ca734da794.jpg",
  },
  {
    id: "acoustic-silence",
    title: "Acoustic Silence with Silas: Recording in the Dynamic City",
    excerpt: "Fostering contemplative audio booths in private residential quarters.",
    tag: "Podcast",
    date: "May 08, 2026",
    readTime: "45 min listen",
    image: "/images/unsplash/unsplash-1590602847861-f357a9332bbc.jpg",
  },
];
