"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList, Search, RefreshCw, Clock, ArrowRight,
  AlertCircle, Wifi, WifiOff, Check, ChevronDown, CheckCircle2,
  XCircle, Play, Ban
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import { EmptyStateComponent } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useKitchenStore } from "@/lib/store/use-kitchen-store";
import { useSocket } from "@/lib/store/use-socket";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  id: string;
  orderNumber: number;
  status: "PENDING" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  specialNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  session: {
    table: {
      name: string;
      number: number;
    };
  };
}

interface OrdersManagerProps {
  restaurantId: string;
  currency: string;
  isKitchenView?: boolean;
}

const STATUS_CONFIGS = {
  PENDING: {
    label: "Pending",
    nextLabel: "Start Preparing",
    nextStatus: "PREPARING",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    glow: "shadow-md shadow-amber-500/5 border-amber-500/40",
    icon: AlertCircle
  },
  PREPARING: {
    label: "Preparing",
    nextLabel: "Mark Ready",
    nextStatus: "READY",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    glow: "shadow-md shadow-blue-500/5 border-blue-500/40",
    icon: Play
  },
  READY: {
    label: "Ready to Serve",
    nextLabel: "Mark Served",
    nextStatus: "SERVED",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    glow: "shadow-md shadow-emerald-500/5 border-emerald-500/40 animate-pulse",
    icon: CheckCircle2
  },
  SERVED: {
    label: "Served",
    nextLabel: "Complete",
    nextStatus: "COMPLETED",
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    glow: "shadow-md shadow-indigo-500/5 border-indigo-500/20",
    icon: Check
  },
  COMPLETED: {
    label: "Completed",
    nextLabel: null,
    nextStatus: null,
    color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    glow: "opacity-60 border-border",
    icon: CheckCircle2
  },
  CANCELLED: {
    label: "Cancelled",
    nextLabel: null,
    nextStatus: null,
    color: "text-destructive bg-destructive/10 border-destructive/20",
    glow: "opacity-60 border-destructive/20",
    icon: XCircle
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$", AED: "د.إ",
};

// Play synthesized major-third chime chord (A5 and C#6)
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1109.73, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
    gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.47);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.warn("Chime blocked by browser user interaction rules:", err);
  }
};

export function OrdersManager({ restaurantId, currency, isKitchenView = false }: OrdersManagerProps) {
  const { audioEnabled, sseConnected, setSseConnected } = useKitchenStore();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // Read environment variable to decide realtime provider (default to SSE)
  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER || "SSE";

  const ordersRef = useRef<OrderData[]>([]);
  ordersRef.current = orders;

  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/orders`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      toast.error("Failed to load orders queue");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  // Establish Socket.IO connection if selected
  const { socket } = useSocket(
    provider === "SOCKETIO" ? restaurantId : null,
    "staff"
  );

  // 1. Socket.IO Listeners Setup
  useEffect(() => {
    if (provider !== "SOCKETIO" || !socket) return;

    const handleOrderCreated = (newOrder: OrderData) => {
      const exists = ordersRef.current.some((o) => o.id === newOrder.id);
      if (exists) return;

      setOrders((prev) => [newOrder, ...prev]);

      if (audioEnabled) {
        playNotificationChime();
      }
      toast.info(`[Socket.IO] New Order #${newOrder.orderNumber} placed for ${newOrder.session.table.name}!`);
    };

    const handleOrderUpdated = (updatedOrder: OrderData) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (!exists) return [updatedOrder, ...prev];
        return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      });
      toast.success(`[Socket.IO] Order #${updatedOrder.orderNumber} is now ${updatedOrder.status.toLowerCase()}`);
    };

    socket.on("order_created", handleOrderCreated);
    socket.on("order_updated", handleOrderUpdated);

    return () => {
      socket.off("order_created", handleOrderCreated);
      socket.off("order_updated", handleOrderUpdated);
    };
  }, [socket, provider, audioEnabled]);

  // 2. Server-Sent Events (SSE) Listener Setup
  useEffect(() => {
    if (provider !== "SSE") return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connectSSE() {
      if (eventSource) {
        eventSource.close();
      }
      setSseConnected("connecting");

      eventSource = new EventSource(`/api/restaurants/${restaurantId}/orders/sse`);

      eventSource.addEventListener("connected", () => {
        setSseConnected("connected");
      });

      eventSource.addEventListener("order_created", (event: MessageEvent) => {
        try {
          const newOrder = JSON.parse(event.data) as OrderData;
          const exists = ordersRef.current.some((o) => o.id === newOrder.id);
          if (exists) return;

          setOrders((prev) => [newOrder, ...prev]);

          if (audioEnabled) {
            playNotificationChime();
          }
          toast.info(`[SSE] New Order #${newOrder.orderNumber} placed for ${newOrder.session.table.name}!`);
        } catch (err) {
          console.error("Failed to parse order_created SSE payload", err);
        }
      });

      eventSource.addEventListener("order_updated", (event: MessageEvent) => {
        try {
          const updatedOrder = JSON.parse(event.data) as OrderData;
          setOrders((prev) => {
            const exists = prev.some((o) => o.id === updatedOrder.id);
            if (!exists) return [updatedOrder, ...prev];
            return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
          });
          toast.success(`[SSE] Order #${updatedOrder.orderNumber} status is now ${updatedOrder.status.toLowerCase()}`);
        } catch (err) {
          console.error("Failed to parse order_updated SSE payload", err);
        }
      });

      eventSource.onerror = (e) => {
        console.warn("SSE stream interrupted. Reconnecting in 5s...", e);
        setSseConnected("disconnected");
        eventSource?.close();

        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
    };
  }, [restaurantId, setSseConnected, audioEnabled, provider]);

  // Initial orders fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fallback Polling if connection is down
  useEffect(() => {
    if (sseConnected === "connected") return;

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchOrders, sseConnected]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update order status");
      } else {
        const data = await res.json();
        if (data.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
          );
        }
      }
    } catch {
      toast.error("An error occurred while updating the order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    handleUpdateStatus(orderId, "CANCELLED");
  };

  const filtered = orders.filter((o) => {
    if (statusFilter === "ACTIVE") {
      if (["COMPLETED", "CANCELLED"].includes(o.status)) return false;
    } else if (statusFilter !== "ALL" && o.status !== statusFilter) {
      return false;
    }

    const q = search.toLowerCase();
    return (
      String(o.orderNumber).includes(q) ||
      o.session.table.name.toLowerCase().includes(q) ||
      o.items.some((it) => it.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Real-time Status Banner */}
      {sseConnected !== "connected" && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse shrink-0">
          {sseConnected === "connecting" ? (
            <>
              <Wifi className="h-4 w-4 shrink-0 animate-bounce" />
              <span>Connecting to real-time {provider} stream...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>Real-time link down. Operating in auto-polling fallback mode (refreshes every 15s). Reconnecting...</span>
            </>
          )}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-5 shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            {isKitchenView ? "Kitchen Queue" : "Orders Tracker"}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/60 font-mono tracking-wider uppercase font-bold">
              {provider} MODE
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {isKitchenView
              ? "Live incoming ticket board for preparation, staging, and service statuses."
              : "Monitor kitchen progress, cook durations, and complete guest orders."}
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border hover:bg-secondary cursor-pointer transition-all disabled:opacity-50"
          title="Manual refresh"
        >
          <RefreshCw className={cn("h-4 w-4 text-muted-foreground", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0 select-none">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, tables, items..."
            className="pl-9.5 bg-card border-border/80 h-9.5 text-xs rounded-xl focus-visible:ring-1"
          />
        </div>

        {/* Status Filters */}
        <div className="flex rounded-xl border border-border/85 bg-card/60 p-1 overflow-x-auto gap-0.5 max-w-full">
          {[
            { label: "Active Queue", value: "ACTIVE" },
            { label: "Pending", value: "PENDING" },
            { label: "Preparing", value: "PREPARING" },
            { label: "Ready", value: "READY" },
            { label: "Served", value: "SERVED" },
            { label: "All Tickets", value: "ALL" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Scroll Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-6">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="py-12 border border-dashed border-border/70 rounded-2xl bg-card/20">
            <EmptyStateComponent
              icon={ClipboardList}
              title="No tickets active"
              description="New orders placed by tables will stream directly to this dashboard."
            />
          </div>
        )}

        {!isLoading && orders.length > 0 && filtered.length === 0 && (
          <div className="py-12 border border-dashed border-border/70 rounded-2xl bg-card/20">
            <EmptyStateComponent
              icon={Search}
              title="No matching tickets"
              description="Try adjusting your status filter or search parameters."
            />
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
            {filtered.map((order) => {
              const config = STATUS_CONFIGS[order.status];
              const timeCreated = new Date(order.createdAt).getTime();
              const timeUpdated = new Date(order.updatedAt).getTime();
              
              const minutesAgo = Math.floor((Date.now() - timeCreated) / 60000);
              const durationInStatus = Math.floor((Date.now() - timeUpdated) / 60000);

              const StatusIcon = config.icon;

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "glass-panel border rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-md",
                    config.glow
                  )}
                >
                  {/* Status accent top stripe */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    order.status === "PENDING" && "bg-amber-500",
                    order.status === "PREPARING" && "bg-blue-500",
                    order.status === "READY" && "bg-emerald-500",
                    order.status === "SERVED" && "bg-indigo-500",
                    order.status === "COMPLETED" && "bg-slate-400",
                    order.status === "CANCELLED" && "bg-destructive"
                  )} />

                  <CardContent className="p-5 flex flex-col gap-4 flex-1">
                    {/* Header info */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/80 border border-border/60 text-xs font-black text-foreground font-mono">
                          #{order.orderNumber}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm leading-none tracking-tight">
                            {order.session.table.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                              {minutesAgo === 0 ? "Just now" : `${minutesAgo}m ago`}
                            </span>
                            {order.status !== "PENDING" && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                              <span className="text-[9px] text-muted-foreground/70 ml-1 pl-1 border-l border-border">
                                state: {durationInStatus}m
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border flex items-center gap-1 shrink-0",
                        config.color
                      )}>
                        <StatusIcon className="h-3 w-3 shrink-0" />
                        {config.label}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="rounded-xl border border-border/50 bg-muted/5 divide-y divide-border/40 overflow-hidden text-xs my-0.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center px-3.5 py-2.5 text-foreground">
                          <span className="font-medium flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                              {item.quantity}x
                            </span>
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {currencySymbol}{(item.price * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Special notes */}
                    {order.specialNotes && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 flex gap-2 leading-relaxed">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                        <div className="flex-1">
                          <span className="font-semibold block uppercase tracking-wider text-[8px] opacity-80 mb-0.5">Chef's Notes</span>
                          <span>"{order.specialNotes}"</span>
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/40 select-none">
                      {config.nextStatus && config.nextLabel && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, config.nextStatus!)}
                          isLoading={updatingId === order.id}
                          className="flex-1 h-8.5 text-xs font-semibold cursor-pointer shadow-xs rounded-xl"
                        >
                          {config.nextLabel}
                          <ArrowRight className="ml-1 h-3.5 w-3.5 shrink-0" />
                        </Button>
                      )}

                      {["PENDING", "PREPARING"].includes(order.status) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={updatingId === order.id}
                          className="h-8.5 text-xs font-semibold cursor-pointer border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-xl px-3"
                          title="Cancel Order"
                        >
                          <Ban className="h-3.5 w-3.5 shrink-0" />
                        </Button>
                      )}

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            disabled={updatingId === order.id}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 h-8.5 text-[10px] font-semibold border border-border bg-card hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition-all disabled:opacity-50"
                            title="Override status"
                          >
                            <span>Status</span>
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            sideOffset={5}
                            className="z-50 min-w-[140px] rounded-xl border border-border bg-card p-1 shadow-md animate-in fade-in-50 slide-in-from-top-1 duration-100"
                          >
                            <DropdownMenu.Label className="px-2 py-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                              Change Status
                            </DropdownMenu.Label>
                            <DropdownMenu.Separator className="h-px bg-border my-1" />
                            {Object.entries(STATUS_CONFIGS).map(([statusKey, statusVal]) => {
                              const ItemIcon = statusVal.icon;
                              return (
                                <DropdownMenu.Item
                                  key={statusKey}
                                  onClick={() => handleUpdateStatus(order.id, statusKey)}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg cursor-pointer text-foreground hover:bg-secondary/70 focus:outline-hidden",
                                    order.status === statusKey && "bg-primary/5 text-primary font-semibold"
                                  )}
                                >
                                  <ItemIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span>{statusVal.label}</span>
                                </DropdownMenu.Item>
                              );
                            })}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
