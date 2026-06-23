"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ClipboardList,
  Users,
  Receipt,
  Settings,
  HelpCircle,
  ConciergeBell,
} from "lucide-react";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { cn } from "@/lib/utils";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: SidebarItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: ClipboardList },
  { name: "Menu Management", href: "/dashboard/menu", icon: UtensilsCrossed },
  { name: "Table & QRs", href: "/dashboard/tables", icon: QrCode },
  { name: "Active Sessions", href: "/dashboard/sessions", icon: ConciergeBell },
  { name: "Billing Tracker", href: "/dashboard/billing", icon: Receipt },
  { name: "Staff Management", href: "/dashboard/staff", icon: Users },
];

const secondaryNavItems: SidebarItem[] = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function AdminSidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const pathname = usePathname();
  const { restaurant, fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Generate initials for the logo avatar
  const getInitials = (name?: string) => {
    if (!name) return "QD";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(restaurant?.name);
  const restaurantName = restaurant?.name || "Loading...";

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-64 bg-card border-r border-border select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-b from-primary to-[hsl(var(--primary)/0.9)] text-primary-foreground shadow-xs">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-none text-foreground tracking-tight">
            QR Dine
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">
            SaaS Console
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Operations
          </div>
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary/8 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            System
          </div>
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary/8 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border-l-2 border-transparent"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Footer Details */}
      <div className="p-4 border-t border-border/80 bg-muted/20">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary border border-border/60 text-muted-foreground text-xs font-semibold">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate leading-none">
              {restaurantName}
            </span>
            <span className="text-[10px] text-muted-foreground truncate mt-1">
              Active Tenant
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

