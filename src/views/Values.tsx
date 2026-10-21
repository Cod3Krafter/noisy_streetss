"use client";

import { useEffect } from "react";
import WhoWeAre from "./WhoWeAre";

export default function Values() {
  useEffect(() => {
    const id = setTimeout(() => {
      document.getElementById("values-commitments")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, []);

  return <WhoWeAre />;
}
