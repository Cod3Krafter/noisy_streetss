"use client";

import { useEffect } from "react";
import WhoWeAre from "./WhoWeAre";

export default function Press() {
  useEffect(() => {
    const id = setTimeout(() => {
      document.getElementById("press-mentions")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, []);

  return <WhoWeAre />;
}
