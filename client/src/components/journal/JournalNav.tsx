import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GraduationCap, Library, BookOpen, FlaskConical, Cpu, GitBranch, Menu, Radio, Code2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Journal", path: "/journal", icon: Library, desc: "Published papers" },
  { label: "Live Paper", path: "/live-paper", icon: Radio, desc: "Real-time sessions" },
  { label: "Documentation", path: "/docs", icon: BookOpen, desc: "Guides & reference" },
  { label: "API", path: "/api", icon: Code2, desc: "Developer access" },
  { label: "Methodology", path: "/methodology", icon: FlaskConical, desc: "Research process" },
  { label: "Agents", path: "/agents", icon: Cpu, desc: "AI agent system" },
  { label: "Repository", path: "/repository", icon: GitBranch, desc: "Open source code" },
];

export function JournalNav() {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex h-16 sm:h-[68px] items-center justify-between">
          {/* Logo */}
          <button onClick={() => setLocation("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-primary/[0.06] flex items-center justify-center">
              <GraduationCap className="h-[18px] w-[18px] text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] sm:text-[17px] font-display font-bold text-foreground leading-tight tracking-[-0.02em]">
                AutoScholar
              </span>
              <span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-[0.2em] -mt-0.5">
                Journal
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <div className="hidden sm:flex items-center gap-0.5">
              {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setLocation(path)} className="h-9 px-3.5 rounded-xl hover:bg-primary/5 transition-all duration-200 gap-2 text-[12px] font-semibold">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{label}</p></TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Mobile nav — premium dropdown */}
            <div className="flex sm:hidden">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <Menu className="h-[18px] w-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px] z-[100]">
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  {NAV_ITEMS.map(({ label, path, icon: Icon, desc }, idx) => (
                    <DropdownMenuItem key={path} onSelect={() => setLocation(path)} className="cursor-pointer">
                      <Icon className="h-[18px] w-[18px]" />
                      <div className="flex flex-col gap-0.5">
                        <span>{label}</span>
                        <span className="text-[11px] text-muted-foreground/50 font-normal">{desc}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="h-5 w-px bg-border/25 mx-1 sm:mx-2" />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
