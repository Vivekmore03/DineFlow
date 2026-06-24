"use client";

import { useState, useEffect, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ConciergeBell, Receipt, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { useSocket } from "@/lib/store/use-socket";
import { useKitchenStore } from "@/lib/store/use-kitchen-store";
import { toast } from "@/components/ui/toast";

interface AlertItem {
  id: string;
  type: "waiter" | "bill";
  table: string;
  time: string;
  status: "pending" | "resolved";
}

// Sound synthesizer for popover notifications
const playChimeAlert = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  } catch (_) {}
};

export function NotificationsPopover() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const { restaurant } = useAuthStore();
  const restaurantId = restaurant?.id;
  
  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER || "SSE";

  // Connect to Socket.IO if active
  const { socket } = useSocket(
    provider === "SOCKETIO" ? (restaurantId ?? null) : null,
    "staff"
  );

  const addAlert = (type: "waiter" | "bill", table: string, id: string) => {
    if (seenIdsRef.current.has(id)) return;
    seenIdsRef.current.add(id);

    const newAlert: AlertItem = {
      id,
      type,
      table,
      time: "Just now",
      status: "pending",
    };

    toast.info(`[Real-time] New ${type === "waiter" ? "waiter call" : "bill request"} from ${table}!`);
    
    const audioEnabled = useKitchenStore.getState().audioEnabled;
    if (audioEnabled) {
      playChimeAlert();
    }

    setAlerts((prev) => [newAlert, ...prev]);
  };

  // 1. Socket.IO Alerts Listener
  useEffect(() => {
    if (provider !== "SOCKETIO" || !socket) return;

    const handleWaiterCall = (data: any) => {
      addAlert("waiter", data.table.name, data.id);
    };

    const handleBillRequest = (data: any) => {
      addAlert("bill", data.table.name, data.id);
    };

    socket.on("waiter_call", handleWaiterCall);
    socket.on("bill_request", handleBillRequest);

    return () => {
      socket.off("waiter_call", handleWaiterCall);
      socket.off("bill_request", handleBillRequest);
    };
  }, [socket, provider]);

  // 2. SSE Alerts Listener
  useEffect(() => {
    if (provider !== "SSE" || !restaurantId) return;

    const eventSource = new EventSource(`/api/restaurants/${restaurantId}/orders/sse`);

    eventSource.addEventListener("waiter_call", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        addAlert("waiter", data.table.name, data.id);
      } catch (err) {
        console.error("Failed to parse waiter_call SSE", err);
      }
    });

    eventSource.addEventListener("bill_request", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        addAlert("bill", data.table.name, data.id);
      } catch (err) {
        console.error("Failed to parse bill_request SSE", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [restaurantId, provider]);

  const activeCount = alerts.filter((a) => a.status === "pending").length;

  const handleResolve = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer focus:outline-hidden transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {activeCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 max-h-[400px] overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg glass-panel animate-in fade-in-50 slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 mb-2">
            <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
              Alerts Queue
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {activeCount} active
            </span>
          </div>

          {activeCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 stroke-1.25 mb-2 text-muted-foreground/60" />
              <p className="text-xs font-medium">All clear! No pending calls</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-2.5 rounded-md hover:bg-secondary/40 border border-transparent transition-colors group"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      alert.type === "waiter"
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-500"
                        : "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                    )}
                  >
                    {alert.type === "waiter" ? (
                      <ConciergeBell className="h-4 w-4" />
                    ) : (
                      <Receipt className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground">
                        {alert.table}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {alert.type === "waiter"
                        ? "Calling for assistance"
                        : "Requesting final bill"}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleResolve(alert.id, e)}
                    className="flex h-5 w-5 items-center justify-center rounded-md border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors shadow-xs"
                    title="Acknowledge alert"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
