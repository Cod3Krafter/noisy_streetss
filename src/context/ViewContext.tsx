"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ViewId } from "@/lib/navigation";

type ViewContextType = {
  view: ViewId;
  setView: (view: ViewId) => void;
};

const ViewContext = createContext<ViewContextType | null>(null);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewId>("home");

  const setView = useCallback((next: ViewId) => {
    setViewState(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within ViewProvider");
  return ctx;
}
