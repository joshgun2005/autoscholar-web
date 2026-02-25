import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

export type ThemeColor = "blue" | "green" | "purple" | "red" | "orange" | "cyan";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
  themeColor: "blue",
  setThemeColor: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const themeColorMap: Record<ThemeColor, { hue: number; sat: number }> = {
  blue: { hue: 210, sat: 100 },
  green: { hue: 142, sat: 76 },
  purple: { hue: 270, sat: 90 },
  red: { hue: 0, sat: 84 },
  orange: { hue: 38, sat: 92 },
  cyan: { hue: 199, sat: 89 },
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "stock-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    try {
      return (localStorage.getItem(`${storageKey}-color`) as ThemeColor) || "blue";
    } catch {
      return "blue";
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    const colorConfig = themeColorMap[themeColor];

    // Update primary color variables
    if (theme === "light") {
      root.style.setProperty("--primary", `${colorConfig.hue} ${colorConfig.sat}% 50%`);
      root.style.setProperty("--ring", `${colorConfig.hue} ${colorConfig.sat}% 50%`);
      root.style.setProperty("--sidebar-primary", `${colorConfig.hue} ${colorConfig.sat}% 50%`);
      root.style.setProperty("--sidebar-ring", `${colorConfig.hue} ${colorConfig.sat}% 50%`);
    } else {
      root.style.setProperty("--primary", `${colorConfig.hue} ${colorConfig.sat}% 50%`);
      root.style.setProperty("--ring", `${colorConfig.hue} ${colorConfig.sat}% 60%`);
      root.style.setProperty("--sidebar-primary", `${colorConfig.hue} ${colorConfig.sat}% 60%`);
      root.style.setProperty("--sidebar-ring", `${colorConfig.hue} ${colorConfig.sat}% 60%`);
    }
  }, [themeColor, theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(storageKey, theme);
        setThemeState(theme);
      } catch (error) {
        console.error("Failed to save theme:", error);
        setThemeState(theme);
      }
    },
    toggleTheme: () => {
      try {
        const newTheme = theme === "dark" ? "light" : "dark";
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);
      } catch (error) {
        console.error("Failed to toggle theme:", error);
        setThemeState(theme === "dark" ? "light" : "dark");
      }
    },
    themeColor,
    setThemeColor: (color: ThemeColor) => {
      try {
        localStorage.setItem(`${storageKey}-color`, color);
        setThemeColorState(color);
      } catch (error) {
        console.error("Failed to save theme color:", error);
        setThemeColorState(color);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
