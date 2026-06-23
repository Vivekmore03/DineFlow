"use client";

import { useRouter } from "next/navigation";
import { UtensilsCrossed, Volume2, VolumeX, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { toast } from "@/components/ui/toast";
import { useKitchenStore } from "@/lib/store/use-kitchen-store";

export function KitchenNavigation() {
  const router = useRouter();
  const { audioEnabled, setAudioEnabled, sseConnected } = useKitchenStore();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Successfully logged out");
        router.refresh();
        router.push("/login");
      } else {
        toast.error("Logout failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Logout failed");
    }
  };

  const toggleAudio = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    toast.info(
      nextVal ? "Audio notifications enabled" : "Audio notifications muted"
    );
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-6 select-none shadow-xs">
      {/* Brand & Kitchen Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-none text-foreground tracking-tight">
            Spice Garden
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
              Kitchen Console
            </span>
            <div className="flex h-1.5 w-1.5 relative">
              {sseConnected === "connected" && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </>
              )}
              {sseConnected === "connecting" && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </>
              )}
              {sseConnected === "disconnected" && (
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive animate-pulse"></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audio alerts controls, theme, refresh, and logout */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAudio}
          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full h-8 w-8"
          title={audioEnabled ? "Mute alert audio" : "Enable alert audio"}
        >
          {audioEnabled ? (
            <Volume2 className="h-4.5 w-4.5" />
          ) : (
            <VolumeX className="h-4.5 w-4.5 text-destructive" />
          )}
        </Button>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            router.refresh();
            toast.success("Queue refreshed");
          }}
          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full h-8 w-8"
          title="Refresh queue"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </Button>

        <div className="h-4 w-px bg-border/60" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-xs font-semibold h-8 cursor-pointer text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exit Console</span>
        </Button>
      </div>
    </header>
  );
}
