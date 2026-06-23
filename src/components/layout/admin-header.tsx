"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsPopover } from "./notifications-popover";
import { UserMenu } from "./user-menu";
import { AdminSidebar } from "./admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 select-none">
      {/* Left side: Hamburger (mobile only) + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer focus:outline-hidden md:hidden"
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationsPopover />
        <div className="h-4 w-px bg-border/60" />
        <UserMenu />
      </div>

      {/* Mobile Drawer Slide-out Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-xs animate-in slide-in-from-left duration-200">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex-1 cursor-pointer focus:outline-hidden"
            aria-label="Dismiss sidebar"
          />
        </div>
      )}
    </header>
  );
}
