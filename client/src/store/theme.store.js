import { create } from "zustand";
import { persist } from "zustand/middleware";

/** @typedef {"light" | "dark" | "system"} ThemeMode */

function applyTheme(mode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: /** @type {ThemeMode} */ ("system"),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      initTheme: () => {
        applyTheme(get().theme);
      },
      toggleTheme: () => {
        const current = get().theme;
        const next = current === "dark" ? "light" : current === "light" ? "system" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
    }),
    { name: "ecoxchange-theme" },
  ),
);
