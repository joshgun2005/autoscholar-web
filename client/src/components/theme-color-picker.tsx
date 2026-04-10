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
  { value: "blue", label: "Institutional Blue", color: "hsl(224, 50%, 38%)" },
  { value: "green", label: "Oxford Green", color: "hsl(158, 64%, 28%)" },
  { value: "purple", label: "Royal Purple", color: "hsl(268, 60%, 48%)" },
  { value: "red", label: "Crimson", color: "hsl(0, 65%, 48%)" },
  { value: "orange", label: "Copper", color: "hsl(25, 80%, 48%)" },
  { value: "cyan", label: "Teal", color: "hsl(205, 82%, 36%)" },
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
          className="hover-elevate active-elevate-2 rounded-lg hover:bg-muted/50 transition-all duration-200"
        >
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Choose theme color</span>
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
              className="w-4 h-4 rounded-full border border-border/50"
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
