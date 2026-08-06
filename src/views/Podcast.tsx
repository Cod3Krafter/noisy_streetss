"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Music2, Apple, Clock } from "lucide-react";
import SectionEyebrow from "@/components/SectionEyebrow";
import PodcastPlayer from "@/components/podcast/PodcastPlayer";
import { YoutubeIcon } from "@/components/icons/social";

const shows = [
  {
    id: "noisy-originals",
    title: "Noisy Originals",
    tag: "Street Affairs",
    host: "Host: Modupe Daramola & Silas Uden",
    body: "Boutique documentary audio series capturing the lives of Shomolu's offset printers, street traders, and alternative maritime realities along the Lagos lagoons.",
    image: "/images/unsplash/unsplash-1516450360452-9312f5e86fc7.jpg",
  },
  {
    id: "literary-exchange",
    title: "Literary Exchange",
    tag: "Editorial & Essays",
    host: "Host: Adeoluwa Saro-Wewa",
    body: "Formidable conversations and searing interviews with non-conformist writers, bookmakers, and environmental poets from West Africa and the global black diaspora.",
    image: "/images/unsplash/unsplash-1544005313-94ddf0286df2.jpg",
  },
  {
    id: "verandah-field-records",
    title: "Lagos Verandah Field Records",
    tag: "Sound Archaeology",
    host: "Host: Noisy Studio Curators",
    body: "A raw acoustic archaeology map. Capturing rain storms on zinc roofs, street generator humming hums, ferry engine rattles, and local printing press syncopations.",
    image: "/images/unsplash/unsplash-1532012197267-da84d127e765.jpg",
  },
];

const videos = [
  {
    id: "heidelberg-presses",
    title: "Laying Ink in Shomolu: The Mechanical Heidelberg Offset Presses",
    tag: "Street Documentary",
    duration: "22:15",
    body: "Step inside the industrial printing heart of Lagos. Watch Silas and operators configure cold-metal presses under heavy yellow lighting.",
    image: "/images/unsplash/unsplash-1500648767791-00dcc994a43e.jpg",
  },
  {
    id: "noisy-rave",
    title: "Noisy Rave Lagos: Experimental Literature meets Live Grime 2026",
    tag: "Cultural Archive",
    duration: "14:20",
    body: "A visual documentation of our latest evening bookclub showcase, blending heavy electronic bass drums with live poetry reading.",
    image: "/images/unsplash/unsplash-1598488035139-bdbb2231ce04.jpg",
  },
];

const archive = [
  { title: "Laying Ink in Shomolu: The Lagos Printers", franchise: "Noisy Originals", date: "May 16, 2026", duration: "48 mins", active: true },
  { title: "The Cartographer's Eye with Modupe Daramola", franchise: "Noisy Originals", date: "May 10, 2026", duration: "35 mins", active: false },
  { title: "Writing Niger Delta Ecologies with Dr. Alabi", franchise: "Literary Exchange", date: "April 20, 2026", duration: "52 mins", active: false },
];

export default function Podcast() {
  const [activeVideo, setActiveVideo] = useState<(typeof videos)[number] | null>(null);
  const [theaterPlaying, setTheaterPlaying] = useState(false);

  return (
    <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <SectionEyebrow>Noisy Broadcast Grid</SectionEyebrow>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-ink mt-3">
          Audio to read <span className="text-accent italic">actively</span>.
        </h1>
        <p className="text-sm text-warm-gray leading-relaxed mt-4">
          Experimental live dialogues, original storytelling, and raw
          soundscapes produced inside Shomolu&apos;s isolation booths.
          Designed for focused, immersive streaming.
        </p>
      </div>

      {/* Spotlight */}
      <div className="mt-16 bg-ink-600 rounded-3xl overflow-hidden grid md:grid-cols-2 border border-warm-gray/20">
        <div className="relative aspect-4/3 md:aspect-auto">
          <span className="absolute top-3 left-3 z-10 bg-accent text-white text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded tracking-widest">
            Spotlight Station
          </span>
          <Image
            src="/images/unsplash/unsplash-1500648767791-00dcc994a43e.jpg"
            alt="Laying Ink in Shomolu: The Lagos Printers"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/80 to-transparent p-4">
            <span className="text-[8px] font-mono text-white/70 uppercase">Broadcast Deck</span>
            <p className="text-sm text-white font-semibold">Laying Ink in Shomolu: The Lagos Printers</p>
          </div>
        </div>
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <span className="text-[9px] font-mono text-accent uppercase font-bold tracking-widest">
            Noisy Originals • Spotlight Feature
          </span>
          <h2 className="font-serif-display text-2xl font-bold text-white mt-2 leading-tight">
            Laying Ink in Shomolu: The Lagos Printers
          </h2>
          <p className="font-serif-body italic text-slate-300 text-sm mt-3 leading-relaxed">
            &quot;We sit with Silas and three legendary offset press operators
            in Shomolu to discuss the history of Lagos street publishing,
            generator maintenance, and why paper smell still wins.&quot;
          </p>
          <div className="mt-5">
            <PodcastPlayer title="Laying Ink in Shomolu" />
          </div>
        </div>
      </div>

      {/* Shows */}
      <section className="mt-24">
        <div className="flex justify-between items-end border-b border-warm-gray/20 pb-6 mb-10 flex-wrap gap-4">
          <div>
            <SectionEyebrow>Noisy Channels &amp; Series</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">Our Studio Shows</h2>
          </div>
          <span className="text-xs font-mono text-warm-gray hidden sm:block max-w-xs text-right">
            Curated franchises representing Lagos intellectual grit.
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {shows.map((s) => (
            <div key={s.id} className="bg-white border border-warm-gray/15 rounded-3xl overflow-hidden">
              <div className="aspect-16/10 w-full relative">
                <Image src={s.image} alt={s.title} fill sizes="33vw" className="object-cover" />
                <span className="absolute top-2 left-2 bg-ink text-paper text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded">
                  {s.tag}
                </span>
              </div>
              <div className="p-5">
                <span className="block text-[9px] font-mono text-accent uppercase font-bold">{s.host}</span>
                <h3 className="font-serif-display font-bold text-ink mt-1">{s.title}</h3>
                <p className="text-xs text-warm-gray leading-relaxed mt-2">{s.body}</p>
                <span className="block text-[8px] font-mono text-warm-gray/50 uppercase mt-4 mb-2">
                  Sync Platform Deck
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <a href="https://open.spotify.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                    <Music2 className="w-3 h-3" aria-hidden="true" /> Spotify
                  </a>
                  <a href="https://apple.co/podcasts" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-[9px] font-bold">
                    <Apple className="w-3 h-3" aria-hidden="true" /> Apple
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[9px] font-bold">
                    <YoutubeIcon className="w-3 h-3" /> YouTube
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video theater */}
      <section className="mt-24 bg-paper-muted rounded-3xl p-6 sm:p-10">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <SectionEyebrow>Real YouTube Integration</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              Noisy Visual Compound
            </h2>
            <p className="text-sm text-warm-gray mt-2">
              Watch original film documentaries and recorded panels from our courtyard.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-white border border-warm-gray/20 text-[10px] font-mono font-bold text-ink">
            2 Live Documents Connected
          </span>
        </div>

        <div className="mt-8 aspect-video rounded-2xl bg-ink relative overflow-hidden flex items-center justify-center">
          {activeVideo ? (
            <>
              <Image src={activeVideo.image} alt={activeVideo.title} fill sizes="100vw" className="object-cover opacity-50" />
              <button
                type="button"
                onClick={() => setTheaterPlaying((p) => !p)}
                className="relative z-10 w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <Play className={`w-6 h-6 ml-1 ${theaterPlaying ? "fill-current" : ""}`} aria-hidden="true" />
              </button>
              <span className="absolute bottom-4 left-4 text-white text-sm font-serif-display font-semibold z-10">
                {theaterPlaying ? "Now Playing: " : ""}{activeVideo.title}
              </span>
            </>
          ) : (
            <div className="text-center px-6">
              <button
                type="button"
                onClick={() => setActiveVideo(videos[0])}
                className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center mx-auto shadow-xl hover:scale-105 transition-transform"
              >
                <Play className="w-6 h-6 ml-1" aria-hidden="true" />
              </button>
              <h3 className="font-serif-display text-lg font-bold text-white mt-4">
                Press Play to Enter Cinema Theater
              </h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                Select one of the high-fidelity video documents below to slide
                it directly into our live integrated streaming deck!
              </p>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          {videos.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setActiveVideo(v);
                setTheaterPlaying(false);
              }}
              className="text-left bg-white border border-warm-gray/15 rounded-2xl overflow-hidden hover:shadow-lg transition-editorial"
            >
              <div className="aspect-16/10 w-full relative">
                <Image src={v.image} alt={v.title} fill sizes="50vw" className="object-cover" />
                <span className="absolute top-2 left-2 bg-accent text-white text-[7px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded">
                  {v.tag}
                </span>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  {v.duration}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-serif-display font-semibold text-ink text-sm leading-snug">{v.title}</h4>
                <p className="text-xs text-warm-gray leading-relaxed mt-1.5 line-clamp-2">{v.body}</p>
                <span className="text-[9px] font-mono text-accent font-bold uppercase mt-2 inline-block">
                  Load to Master Theater
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Archive table */}
      <section className="mt-24">
        <div className="flex justify-between items-end border-b border-warm-gray/20 pb-6 mb-6 flex-wrap gap-4">
          <div>
            <SectionEyebrow>Broadcasting Index Logs</SectionEyebrow>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              Historical Episode Archive
            </h2>
            <p className="text-sm text-warm-gray mt-2">
              A chronological lookup index covering every raw feed taped at our Lagos compound.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-warm-gray/15 bg-white">
          <table className="w-full text-left text-xs min-w-160">
            <thead>
              <tr className="border-b border-warm-gray/15 text-[9px] font-mono uppercase text-warm-gray/70">
                <th className="px-4 py-3 font-bold">Show</th>
                <th className="px-4 py-3 font-bold">Episode</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {archive.map((row) => (
                <tr key={row.title} className="border-b border-warm-gray/10 last:border-0">
                  <td className="px-4 py-4">
                    <span className="text-[9px] font-mono text-accent font-bold uppercase">{row.franchise}</span>
                  </td>
                  <td className="px-4 py-4 font-serif-display font-semibold text-ink">{row.title}</td>
                  <td className="px-4 py-4 font-mono text-warm-gray">{row.date}</td>
                  <td className="px-4 py-4 font-mono text-warm-gray flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" /> {row.duration}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        row.active ? "bg-accent text-white" : "border border-warm-gray/25 text-ink"
                      }`}
                    >
                      {row.active ? "Active Deck" : "Inject Deck"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
