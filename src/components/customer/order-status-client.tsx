"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck, Clock, CheckCircle2, AlertCircle,
  IndianRupee, ChevronLeft, Receipt, Loader2, RefreshCw,
  HelpCircle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import { CustomerMobileNav } from "@/components/layout/customer-mobile-nav";
import { cn } from "@/lib/utils";
import { useSocket } from "@/lib/store/use-socket";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: number;
  status: "PENDING" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  specialNotes: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface BillData {
  id: string;
  billNumber: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: "PENDING" | "PAID";
}

interface OrdersResponse {
  orders: Order[];
  sessionStatus: "ACTIVE" | "BILL_REQUESTED" | "COMPLETED";
  bill?: BillData | null;
}

const STATUS_BADGES = {
  PENDING: { label: "Pending", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" },
  PREPARING: { label: "Preparing", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
  READY: { label: "Ready to Serve", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" },
  SERVED: { label: "Served", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" },
  COMPLETED: { label: "Paid", bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20" },
  CANCELLED: { label: "Cancelled", bg: "bg-destructive/10 text-destructive border border-destructive/20" },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$", AED: "د.إ",
};

export function OrderStatusClient({
  slug,
  tableId,
}: {
  slug: string;
  tableId: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessionStatus, setSessionStatus] = useState<"ACTIVE" | "BILL_REQUESTED" | "COMPLETED">("ACTIVE");
  const [bill, setBill] = useState<BillData | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billRequestLoading, setBillRequestLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const provider = process.env.NEXT_PUBLIC_REALTIME_PROVIDER || "SSE";

  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const token = localStorage.getItem(`qrd_session_${tableId}`);
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // First fetch to get currency from session bootstrap
      const sessionRes = await fetch(`/api/customer/${slug}/${tableId}/session?token=${token}`);
      if (sessionRes.ok) {
        const sessionJson = await sessionRes.json();
        const cur = sessionJson?.restaurant?.currency || "INR";
        setCurrencySymbol(CURRENCY_SYMBOLS[cur] ?? cur);
        if (sessionJson?.restaurant?.id) {
          setRestaurantId(sessionJson.restaurant.id);
        }
      }

      const res = await fetch(`/api/customer/${slug}/${tableId}/orders?token=${token}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setOrders(json.orders || []);
      setSessionStatus(json.sessionStatus || "ACTIVE");
      setBill(json.bill || null);
    } catch {
      toast.error("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, tableId]);

  // Connect to Socket.IO room for this table
  const { socket, connected: socketConnected } = useSocket(
    provider === "SOCKETIO" ? restaurantId : null,
    "customer",
    tableId
  );

  // Listen to order updates
  useEffect(() => {
    if (provider !== "SOCKETIO" || !socket) return;

    const handleOrderUpdated = (updatedOrder: any) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id);
        if (!exists) return prev;

        if (updatedOrder.status === "READY") {
          toast.success(`Your order #${updatedOrder.orderNumber} is ready to serve!`);
        } else {
          toast.info(`Order #${updatedOrder.orderNumber} status is now ${updatedOrder.status.toLowerCase()}`);
        }

        return prev.map((o) => (o.id === updatedOrder.id ? {
          ...o,
          status: updatedOrder.status,
          items: updatedOrder.items,
        } : o));
      });
    };

    socket.on("order_updated", handleOrderUpdated);

    return () => {
      socket.off("order_updated", handleOrderUpdated);
    };
  }, [socket, provider]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fallback Polling if socket link is inactive
  useEffect(() => {
    if (provider === "SOCKETIO" && socketConnected) return;

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchOrders, provider, socketConnected]);

  const handleRequestBill = async () => {
    setBillRequestLoading(true);
    try {
      const sessionToken = localStorage.getItem(`qrd_session_${tableId}`);
      if (!sessionToken) {
        toast.error("Session token not found.");
        return;
      }
      const res = await fetch(`/api/customer/${slug}/${tableId}/bill-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to request bill");
      } else {
        toast.success(data.message || "Bill request sent successfully!");
        setSessionStatus("BILL_REQUESTED");
      }
    } catch {
      toast.error("Failed to request bill");
    } finally {
      setBillRequestLoading(false);
    }
  };

  // 1. Calculate running total of all ACTIVE (non-cancelled) orders
  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const runningTotal = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  // Handle case where there are no orders placed yet
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-4 text-center px-4 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-border">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">No orders yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
            You haven&apos;t placed any orders in this session. Head back to the menu to order!
          </p>
        </div>
        <Link href={`/r/${slug}/t/${tableId}`}>
          <Button variant="primary" size="sm" className="cursor-pointer">
            Browse Menu
          </Button>
        </Link>
        <CustomerMobileNav cartCount={0} onCartClick={() => router.push(`/r/${slug}/t/${tableId}`)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2 select-none">
      {/* Top Title & Refresh */}
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Link href={`/r/${slug}/t/${tableId}`}>
            <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary cursor-pointer">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Order Status</h1>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary cursor-pointer text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4.5 w-4.5", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Session Running Cost Card */}
      <Card className="border border-border/80 bg-card overflow-hidden rounded-2xl shadow-xs">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Session Running Total
              </p>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mt-1">
                {currencySymbol}{runningTotal.toFixed(2)}
              </h2>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                sessionStatus === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : sessionStatus === "BILL_REQUESTED"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  sessionStatus === "ACTIVE"
                    ? "bg-emerald-500"
                    : sessionStatus === "BILL_REQUESTED"
                    ? "bg-amber-500"
                    : "bg-slate-500"
                )}
              />
              {sessionStatus === "ACTIVE"
                ? "Active Dining"
                : sessionStatus === "BILL_REQUESTED"
                ? "Bill Requested"
                : "Session Completed"}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/40 pt-3 flex gap-1 items-start">
            <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
            <span>
              All orders placed at this table belong to this session. You will pay a single aggregated bill at checkout.
            </span>
          </p>

          {/* Quick Invoice Display or Request Bill Action */}
          {bill ? (
            <div className="rounded-xl bg-muted/40 border border-border/60 p-4 mt-1 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                  Invoice {bill.billNumber}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                  bill.paymentStatus === "PAID"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-600"
                )}>
                  {bill.paymentStatus}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({bill.taxRate}%)</span>
                  <span>{currencySymbol}{bill.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-foreground font-bold border-t border-border/40 pt-1.5">
                  <span>Grand Total</span>
                  <span>{currencySymbol}{bill.grandTotal.toFixed(2)}</span>
                </div>
              </div>
              {bill.paymentStatus === "PENDING" && (
                <p className="text-[10px] text-amber-500 font-medium text-center">
                  Please complete the payment at the counter.
                </p>
              )}
            </div>
          ) : (
            sessionStatus === "ACTIVE" && (
              <Button
                variant="primary"
                onClick={handleRequestBill}
                isLoading={billRequestLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 hover:shadow-none focus-visible:ring-emerald-500 text-white rounded-xl text-xs font-semibold h-10 mt-1 cursor-pointer"
              >
                Request Bill & Check Out
              </Button>
            )
          )}
        </CardContent>
      </Card>

      {/* Orders Timeline / List */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider text-muted-foreground/80">
          Order Timeline
        </h3>

        {orders.map((order) => {
          const badge = STATUS_BADGES[order.status] ?? STATUS_BADGES.PENDING;
          return (
            <Card key={order.id} className="border border-border/60 hover:border-border transition-colors rounded-2xl bg-card overflow-hidden">
              <CardContent className="p-4 flex flex-col gap-3">
                {/* Order header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Order #{order.orderNumber}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", badge.bg)}>
                    {badge.label}
                  </span>
                </div>

                {/* Items */}
                <div className="rounded-xl bg-muted/30 border border-border/40 divide-y divide-border/30 overflow-hidden">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs">
                      <span className="text-foreground">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-medium text-foreground">
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Special notes */}
                {order.specialNotes && (
                  <div className="text-[11px] text-amber-600 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 flex gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Note: {order.specialNotes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="h-10" />

      {/* Persistent Nav */}
      <CustomerMobileNav
        cartCount={0}
        onCartClick={() => router.push(`/r/${slug}/t/${tableId}`)}
      />
    </div>
  );
}
