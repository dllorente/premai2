"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ViewMode = "app" | "web";

const ViewModeContext = createContext<{ mode: ViewMode; toggle: () => void }>({
  mode: "app",
  toggle: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("app");

  useEffect(() => {
    const saved = localStorage.getItem("viewMode") as ViewMode | null;
    if (saved === "web" || saved === "app") setMode(saved);
  }, []);

  function toggle() {
    setMode((m) => {
      const next = m === "app" ? "web" : "app";
      localStorage.setItem("viewMode", next);
      return next;
    });
  }

  return (
    <ViewModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => useContext(ViewModeContext);
