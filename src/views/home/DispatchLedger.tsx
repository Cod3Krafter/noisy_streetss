import SectionEyebrow from "@/components/SectionEyebrow";
import ArticleCard from "@/components/ArticleCard";
import { blogPosts } from "@/data/blogPosts";

export default function DispatchLedger() {
  return (
    <section className="px-6 max-w-7xl mx-auto">
      <div className="border-b border-warm-gray/20 pb-4 mb-10 flex justify-between items-end">
        <div>
          <SectionEyebrow>Dispatch Ledger</SectionEyebrow>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
            Featured Stories &amp; Speculations
          </h2>
        </div>
        <span className="text-xs font-mono text-warm-gray/60 hidden sm:block">
          Volume V Issue II
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
