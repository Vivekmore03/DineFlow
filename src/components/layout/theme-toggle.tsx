"use client";

import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full h-8 w-8"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4.5 w-4.5 transition-all duration-300 animate-in spin-in-12" />
      ) : (
        <Sun className="h-4.5 w-4.5 transition-all duration-300 animate-in spin-in-12" />
      )}
    </Button>
  );
}
