import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeColor } from "./theme-provider";

const colorOptions: { value: ThemeColor; label: string; color: string }[] = [
  { value: "blue", label: "Bleu", color: "hsl(210, 100%, 50%)" },
  { value: "green", label: "Vert", color: "hsl(142, 76%, 45%)" },
  { value: "purple", label: "Violet", color: "hsl(270, 90%, 60%)" },
  { value: "red", label: "Rouge", color: "hsl(0, 84%, 60%)" },
  { value: "orange", label: "Orange", color: "hsl(38, 92%, 60%)" },
  { value: "cyan", label: "Cyan", color: "hsl(199, 89%, 55%)" },
];

export function ThemeColorPicker() {
  const { themeColor, setThemeColor } = useTheme();

  const handleColorChange = (color: ThemeColor) => {
    try {
      setThemeColor(color);
    } catch (error) {
      console.error("Failed to set theme color:", error);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-theme-color"
          className="hover-elevate active-elevate-2 rounded-2xl hover:bg-primary/10 transition-all duration-300"
        >
          <Palette className="h-5 w-5" />
          <span className="sr-only">Choisir la couleur du thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" sideOffset={5}>
        {colorOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleColorChange(option.value)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-border"
              style={{ backgroundColor: option.color }}
            />
            <span className="flex-1">{option.label}</span>
            {themeColor === option.value && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
