"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "cyberlearn_theme";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
}

function getStoredTheme(defaultTheme: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return defaultTheme;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === "dark" || saved === "light" || saved === "system") {
      return saved;
    }
  } catch {}
  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme(defaultTheme));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initial = getStoredTheme(defaultTheme);
    return initial === "system" ? getSystemTheme() : initial;
  });

  // Ensure DOM is synced on initial client execution
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  // Handle setting theme explicitly
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}

    const resolved: ResolvedTheme =
      newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
  }, []);

  // Quick 1-click toggle between dark and light
  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Listen to system preference changes when in 'system' mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (theme === "system") {
        const sysResolved = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(sysResolved);
        applyThemeToDOM(sysResolved);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  // Listen for storage changes across tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as ThemeMode;
        setThemeState(newTheme);
        const resolved: ResolvedTheme =
          newTheme === "system" ? getSystemTheme() : newTheme;
        setResolvedTheme(resolved);
        applyThemeToDOM(resolved);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const emptySubscribe = () => () => {};

export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Inline script to prevent Flash of Unstyled Theme (FOUC) during initial HTML parse
 */
export const themeInitScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem('${STORAGE_KEY}');
    var resolved = 'dark';
    if (storedTheme === 'light' || storedTheme === 'dark') {
      resolved = storedTheme;
    } else if (storedTheme === 'system' || !storedTheme) {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(resolved);
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`;
