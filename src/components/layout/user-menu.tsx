"use client";

import { useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/store/use-auth-store";

export function UserMenu() {
  const router = useRouter();
  const { user, fetchProfile, clearProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Successfully logged out");
        clearProfile();
        router.refresh();
        router.push("/login");
      } else {
        toast.error("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during logout");
    }
  };

  const displayName = user?.name || "Loading...";
  const displayEmail = user?.email || "Fetching profile...";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/80 text-foreground cursor-pointer focus:outline-hidden hover:brightness-105 active:scale-95 transition-all"
          aria-label="User account menu"
        >
          <User className="h-4.5 w-4.5 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-lg border border-border bg-card p-1.5 shadow-lg glass-panel animate-in fade-in-50 slide-in-from-top-2 duration-150"
        >
          {/* User Profile Summary */}
          <div className="flex flex-col px-2.5 py-2 border-b border-border/60 mb-1">
            <span className="font-semibold text-xs text-foreground leading-none">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1.5 font-medium truncate">
              {displayEmail}
            </span>
          </div>

          <DropdownMenu.Item
            onClick={() => router.push("/dashboard/settings")}
            className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md cursor-pointer outline-hidden select-none"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Restaurant Settings</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => router.push("/dashboard/staff")}
            className="flex items-center gap-2 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md cursor-pointer outline-hidden select-none"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Manage Staff</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border/60 my-1" />

          <DropdownMenu.Item
            onClick={handleLogout}
            className="flex items-center gap-2 px-2.5 py-2 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive/10 rounded-md cursor-pointer outline-hidden select-none"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

