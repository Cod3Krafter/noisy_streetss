import type { ComponentType } from "react";
import type { ViewId } from "@/lib/navigation";
import Home from "./Home";
import Publishing from "./Publishing";
import Advisory from "./Advisory";
import Studio from "./Studio";
import Blog from "./Blog";
import Podcast from "./Podcast";
import Shop from "./Shop";
import WhoWeAre from "./WhoWeAre";
import Team from "./Team";
import Press from "./Press";
import Values from "./Values";
import Contact from "./Contact";
import Partner from "./Partner";
import SupportDonate from "./SupportDonate";
import BookClub from "./BookClub";
import Tiers from "./Tiers";

export const viewRegistry: Record<ViewId, ComponentType> = {
  home: Home,
  publishing: Publishing,
  advisory: Advisory,
  studio: Studio,
  blog: Blog,
  podcast: Podcast,
  shop: Shop,
  "who-we-are": WhoWeAre,
  team: Team,
  press: Press,
  values: Values,
  contact: Contact,
  partner: Partner,
  "support-donate": SupportDonate,
  "book-club": BookClub,
  tiers: Tiers,
};
