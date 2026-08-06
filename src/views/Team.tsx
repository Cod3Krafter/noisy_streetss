"use client";

import { useEffect } from "react";
import WhoWeAre from "./WhoWeAre";

export default function Team() {
  useEffect(() => {
    const id = setTimeout(() => {
      document.getElementById("core-council")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, []);

  return <WhoWeAre />;
}
