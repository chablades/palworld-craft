"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_ELEMENT_THEME,
  ELEMENT_THEME_STORAGE_KEY,
  isElementThemeId,
  type ElementThemeId,
} from "@/lib/themes";

type ElementThemeContextValue = {
  elementTheme: ElementThemeId;
  setElementTheme: (id: ElementThemeId) => void;
};

const ElementThemeContext = createContext<ElementThemeContextValue | null>(null);

export function useElementTheme() {
  const ctx = useContext(ElementThemeContext);
  if (!ctx) {
    throw new Error("useElementTheme must be used within ThemeProvider");
  }
  return ctx;
}

function applyElementTheme(id: ElementThemeId) {
  document.documentElement.setAttribute("data-theme", id);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [elementTheme, setElementThemeState] = useState<ElementThemeId>(DEFAULT_ELEMENT_THEME);

  useEffect(() => {
    const stored = window.localStorage.getItem(ELEMENT_THEME_STORAGE_KEY);
    const initial =
      stored && isElementThemeId(stored) ? stored : DEFAULT_ELEMENT_THEME;
    setElementThemeState(initial);
    applyElementTheme(initial);
  }, []);

  const setElementTheme = useCallback((id: ElementThemeId) => {
    setElementThemeState(id);
    applyElementTheme(id);
    window.localStorage.setItem(ELEMENT_THEME_STORAGE_KEY, id);
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ElementThemeContext.Provider value={{ elementTheme, setElementTheme }}>
        {children}
      </ElementThemeContext.Provider>
    </NextThemesProvider>
  );
}
