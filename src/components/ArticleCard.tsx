import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/data/blogPosts";

export default function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <div className="bg-white/40 border border-warm-gray/10 hover:border-accent/40 rounded-3xl p-5 flex flex-col justify-between group transition-editorial shadow-sm hover:shadow-md hover:-translate-y-1">
      <div className="space-y-4">
        <div className="aspect-16/10 w-full rounded-2xl overflow-hidden relative bg-slate-100 border border-warm-gray/10">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500"
          />
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-ink text-paper font-mono text-[9px] font-bold uppercase tracking-wider">
            {post.tag}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2 items-center text-[10px] font-mono text-warm-gray/70">
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-ink tracking-tight leading-tight group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-xs text-warm-gray leading-relaxed font-sans-ui line-clamp-2 italic">
            {post.excerpt}
          </p>
        </div>
      </div>
      <div className="pt-4 border-t border-warm-gray/10 mt-6 flex justify-end">
        <button className="text-xs font-bold uppercase tracking-wider font-mono text-accent group-hover:text-info flex items-center gap-1.5 transition-colors">
          <span>Examine Leaflet</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
