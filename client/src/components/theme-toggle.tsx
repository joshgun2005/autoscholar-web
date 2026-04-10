import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover-elevate active-elevate-2"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" data-testid="icon-sun" />
      ) : (
        <Moon className="h-[18px] w-[18px]" data-testid="icon-moon" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
