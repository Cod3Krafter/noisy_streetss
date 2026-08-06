import Hero from "./home/Hero";
import DispatchLedger from "./home/DispatchLedger";
import OperationalMatrix from "./home/OperationalMatrix";
import PublishingTeaser from "./home/PublishingTeaser";
import PodcastTeaser from "./home/PodcastTeaser";
import ShopTeaser from "./home/ShopTeaser";
import Newsletter from "./home/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="w-full space-y-24 pt-8 bg-paper overflow-hidden">
        <DispatchLedger />
        <OperationalMatrix />
        <PublishingTeaser />
        <PodcastTeaser />
        <ShopTeaser />
        <Newsletter />
      </div>
    </>
  );
}
