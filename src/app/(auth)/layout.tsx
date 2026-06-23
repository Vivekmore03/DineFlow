import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 lg:px-8 border-b border-border bg-background/50 backdrop-blur-xs select-none">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="h-4.5 w-4.5" />
          </div>
          <span className="font-semibold text-sm leading-none text-foreground tracking-tight">
            QR Dine
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main card box */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border bg-background/10">
        <p>&copy; {new Date().getFullYear()} QR Dine. All rights reserved. Professional restaurant management software.</p>
      </footer>
    </div>
  );
}
