import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

export function ThemeProvider({ children }) {
  const initTheme = useThemeStore((s) => s.initTheme);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (useThemeStore.getState().theme === "system") {
        useThemeStore.getState().initTheme();
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  return children;
}
