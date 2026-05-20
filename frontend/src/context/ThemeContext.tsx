"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { themeConfig } from "../config/theme";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This code will only run on the client side
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "light"; // Default to light theme

    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("theme", theme);
      const root = document.documentElement;
      const config = themeConfig[theme];
      
      // Apply theme class
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      
      // Set CSS variables from theme config
      root.style.setProperty("--theme-background", config.background);
      root.style.setProperty("--theme-background-secondary", config.backgroundSecondary);
      root.style.setProperty("--theme-background-tertiary", config.backgroundTertiary);
      root.style.setProperty("--theme-text-primary", config.textPrimary);
      root.style.setProperty("--theme-text-secondary", config.textSecondary);
      root.style.setProperty("--theme-text-tertiary", config.textTertiary);
      root.style.setProperty("--theme-border", config.border);
      root.style.setProperty("--theme-border-secondary", config.borderSecondary);
      root.style.setProperty("--theme-surface", config.surface);
      root.style.setProperty("--theme-surface-hover", config.surfaceHover);
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
