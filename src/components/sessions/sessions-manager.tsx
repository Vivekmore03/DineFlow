"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ConciergeBell, Receipt, Clock, IndianRupee, ArrowRight,
  ClipboardList, CheckCircle2, RefreshCw, XCircle, Search,
  UtensilsCrossed, AlertTriangle, Eye, Loader2, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import { EmptyStateComponent } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TableInfo {
  id: string;
  name: string;
  number: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILL_REQUESTED";
}

interface OrderInfo {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface BillRequestInfo {
  id: string;
  status: string;
  createdAt: string;
}

interface BillInfo {
  id: string;
  billNumber: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: "PENDING" | "PAID";
}

interface SessionData {
  id: string;
  table: TableInfo;
  status: "ACTIVE" | "BILL_REQUESTED" | "COMPLETED";
  customerToken: string;
  createdAt: string;
  orders: OrderInfo[];
  bill: BillInfo | null;
  billRequests: BillRequestInfo[];
}

interface SessionsManagerProps {
  restaurantId: string;
  currency: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$", AED: "د.إ",
};

export function SessionsManager({ restaurantId, currency }: SessionsManagerProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Drawer states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action loaders
  const [billingLoading, setBillingLoading] = useState<Record<string, boolean>>({});
  const [closingLoading, setClosingLoading] = useState<Record<string, boolean>>({});
  const [printingLoading, setPrintingLoading] = useState<Record<string, boolean>>({});

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // ── Fetch Sessions ──────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sessions`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      toast.error("Failed to load dining sessions");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(false), 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // ── Fetch Single Session details for consolidation drawer ───────────────────
  const viewSessionDetails = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDetailLoading(true);
    setSessionDetail(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sessions/${sessionId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionDetail(data.session);
    } catch {
      toast.error("Failed to retrieve session details");
      setSelectedSessionId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Generate Bill ───────────────────────────────────────────────────────────
  const handleGenerateBill = async (sessionId: string) => {
    setBillingLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sessions/${sessionId}/bill`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to generate bill");
      } else {
        toast.success(`Bill generated successfully! Invoice #: ${data.bill.billNumber}`);
        fetchSessions();
        // If drawer is open, reload details
        if (selectedSessionId === sessionId) {
          viewSessionDetails(sessionId);
        }
      }
    } catch {
      toast.error("An error occurred while generating the bill");
    } finally {
      setBillingLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  // ── Close Session (Mark Paid) ───────────────────────────────────────────────
  const handleCloseSession = async (sessionId: string) => {
    setClosingLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sessions/${sessionId}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to close session");
      } else {
        toast.success("Payment recorded. Dining session completed and table freed!");
        setSelectedSessionId(null);
        fetchSessions();
      }
    } catch {
      toast.error("An error occurred while closing the session");
    } finally {
      setClosingLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  // ── Print Bill Helper ───────────────────────────────────────────────────────
  const printBill = (bill: any, tableName: string) => {
    const itemsHtml = bill.items.map((item: any) => `
      <tr>
        <td style="padding: 4px 0;">${item.name}</td>
        <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 4px 0;">${currencySymbol}${item.totalPrice.toFixed(2)}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${bill.billNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; font-size: 12px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .my-4 { margin-top: 15px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 4px 0; }
            .border-t { border-top: 1px dashed #000; }
            .border-b { border-bottom: 1px dashed #000; }
            .flex-row { display: flex; justify-content: space-between; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div style="max-width: 300px; margin: 0 auto;">
            <div class="text-center" style="margin-bottom: 10px;">
              <h3 class="font-bold" style="margin: 0; font-size: 14px;">QR DINE RESTAURANT</h3>
              <p style="margin: 2px 0 0 0; font-size: 10px;">${tableName}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px;">
                Date: ${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString()}
              </p>
              <p style="margin: 2px 0 0 0; font-size: 10px; font-weight: bold;">
                Bill No: ${bill.billNumber}
              </p>
            </div>
            
            <div class="border-t" style="margin: 8px 0;"></div>
            
            <table style="width: 100%; text-align: left; font-size: 11px;">
              <thead>
                <tr class="border-b" style="font-weight: bold;">
                  <th style="padding-bottom: 4px;">Item</th>
                  <th style="text-align: center; padding-bottom: 4px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 4px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="border-t" style="margin: 8px 0;"></div>
            
            <div style="font-size: 11px; line-height: 1.6;">
              <div class="flex-row">
                <span>Subtotal</span>
                <span>${currencySymbol}${bill.subtotal.toFixed(2)}</span>
              </div>
              <div class="flex-row">
                <span>GST (${bill.taxRate}%)</span>
                <span>${currencySymbol}${bill.taxAmount.toFixed(2)}</span>
              </div>
              <div class="flex-row font-bold" style="font-size: 12px; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px;">
                <span>Grand Total</span>
                <span>${currencySymbol}${bill.grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="border-t" style="margin: 12px 0 8px 0;"></div>
            
            <div class="text-center" style="font-size: 10px; color: #555;">
              <p style="margin: 0;">Thank you for dining with us!</p>
              <p style="margin: 2px 0 0 0;">Payment Status: ${bill.paymentStatus}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Fetch and Print Bill ─────────────────────────────────────────────────────
  const handlePrintSessionBill = async (sessionId: string, tableName: string) => {
    setPrintingLoading((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sessions/${sessionId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const session = data.session;
      
      if (session.bill) {
        printBill(session.bill, tableName);
        return;
      }
      
      // Generate Provisional Bill
      const activeOrders = session.orders.filter((o: any) => o.status !== "CANCELLED");
      if (activeOrders.length === 0) {
        toast.error("No active orders to print.");
        return;
      }

      const aggregated: Record<string, any> = {};
      let subtotal = 0;
      
      activeOrders.forEach((o: any) => {
        o.items.forEach((it: any) => {
          const key = `${it.name}_${it.price}`;
          if (aggregated[key]) {
            aggregated[key].quantity += it.quantity;
            aggregated[key].totalPrice += (it.quantity * it.price);
          } else {
            aggregated[key] = {
              name: it.name,
              quantity: it.quantity,
              unitPrice: it.price,
              totalPrice: (it.quantity * it.price)
            };
          }
          subtotal += (it.quantity * it.price);
        });
      });

      const items = Object.values(aggregated);
      const taxRate = session.restaurant?.taxRate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const grandTotal = subtotal + taxAmount;

      const provisionalBill = {
        billNumber: "PROVISIONAL",
        createdAt: new Date().toISOString(),
        paymentStatus: "UNPAID",
        subtotal,
        taxRate,
        taxAmount,
        grandTotal,
        items
      };

      printBill(provisionalBill, tableName);
    } catch {
      toast.error("An error occurred while loading bill details for printing");
    } finally {
      setPrintingLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  };

  // ── Filtered Sessions ───────────────────────────────────────────────────────
  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.table.name.toLowerCase().includes(q) ||
      s.bill?.billNumber?.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  // Calculate stats
  const totalOccupied = sessions.length;
  const billRequestsPending = sessions.filter((s) => s.status === "BILL_REQUESTED").length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Active Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Track occupied tables, manage active orders, consolidate tabs, and process guest invoices.
          </p>
        </div>

        <button
          onClick={() => fetchSessions(true)}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border hover:bg-secondary cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4.5 w-4.5 text-muted-foreground", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupied Tables</p>
          <p className="text-2xl font-bold text-foreground mt-1.5">{totalOccupied}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill Requests</p>
          <p className="text-2xl font-bold text-amber-500 mt-1.5">{billRequestsPending}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kitchen Queue</p>
          <p className="text-2xl font-bold text-sky-500 mt-1.5">
            {sessions.reduce((sum, s) => sum + s.orders.filter((o) => o.status !== "SERVED").length, 0)} orders
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Running Sum</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1.5">
            {currencySymbol}
            {sessions
              .reduce((sum, s) => sum + s.orders.reduce((total, o) => total + o.totalAmount, 0), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search occupied tables..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty States */}
      {!isLoading && sessions.length === 0 && (
        <EmptyStateComponent
          icon={UtensilsCrossed}
          title="No active sessions"
          description="All tables are currently available. Scanned tables will populate here."
        />
      )}

      {!isLoading && sessions.length > 0 && filtered.length === 0 && (
        <EmptyStateComponent
          icon={Search}
          title="No sessions found"
          description={`No active sessions match "${search}".`}
        />
      )}

      {/* Active Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((session) => {
            const hasBillRequest = session.status === "BILL_REQUESTED";
            const runningCost = session.orders.reduce((sum, o) => sum + o.totalAmount, 0);

            return (
              <Card
                key={session.id}
                className={cn(
                  "border bg-card shadow-xs transition-all duration-200 overflow-hidden relative flex flex-col justify-between group",
                  hasBillRequest
                    ? "border-amber-500/40 shadow-amber-500/5 glow-amber animate-pulse-slow"
                    : "border-border/80 hover:border-border"
                )}
              >
                <CardContent className="p-5 flex flex-col gap-4 flex-1">
                  {/* Card Header info */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold font-mono border",
                        hasBillRequest
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-primary/8 text-primary border-primary/20"
                      )}>
                        {session.table.number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm leading-none">
                          {session.table.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Scanned: {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                      hasBillRequest
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                      {hasBillRequest ? "Bill Requested" : "Dining"}
                    </span>
                  </div>

                  {/* Order snapshot summary */}
                  <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/40 py-3 my-1">
                    <div className="flex justify-between">
                      <span>Total Placed Orders</span>
                      <span className="font-medium text-foreground">{session.orders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Running Total</span>
                      <span className="font-bold text-foreground">
                        {currencySymbol}{runningCost.toFixed(2)}
                      </span>
                    </div>
                    {session.bill && (
                      <div className="flex justify-between text-emerald-500 font-semibold pt-1 border-t border-dashed border-border/40">
                        <span>Invoice Generated</span>
                        <span>{session.bill.billNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => viewSessionDetails(session.id)}
                        className="flex-1 text-xs gap-1 h-8.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintSessionBill(session.id, session.table.name)}
                        isLoading={printingLoading[session.id]}
                        className="flex-1 text-xs gap-1 h-8.5 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                      </Button>

                      {!session.bill ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGenerateBill(session.id)}
                          isLoading={billingLoading[session.id]}
                          className="flex-1 text-xs gap-1 h-8.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Create Bill
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleCloseSession(session.id)}
                          isLoading={closingLoading[session.id]}
                          className="flex-1 text-xs gap-1 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed session aggregation drawer */}
      <Drawer open={!!selectedSessionId} onOpenChange={(o) => { if (!o) setSelectedSessionId(null); }}>
        <DrawerContent className="max-w-md mx-auto bg-card border-t border-border">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 text-foreground">
              <ClipboardList className="h-5 w-5 text-primary" />
              Session Details — {sessionDetail?.table?.name || "Loading..."}
            </DrawerTitle>
            <DrawerDescription>
              Occupied table summary and invoice processing logs.
            </DrawerDescription>
          </DrawerHeader>

          {detailLoading && (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading details...</p>
            </div>
          )}

          {!detailLoading && sessionDetail && (
            <div className="px-5 py-2 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Aggregated Orders listing */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Consolidated Items
                </h4>
                <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border overflow-hidden">
                  {(() => {
                    const aggregated: Record<string, { name: string; qty: number; price: number }> = {};
                    sessionDetail.orders.filter((o: any) => o.status !== "CANCELLED").forEach((o: any) => {
                      o.items.forEach((it: any) => {
                        const key = `${it.name}_${it.price}`;
                        if (aggregated[key]) {
                          aggregated[key].qty += it.quantity;
                        } else {
                          aggregated[key] = { name: it.name, qty: it.quantity, price: it.price };
                        }
                      });
                    });

                    const rows = Object.values(aggregated);
                    if (rows.length === 0) {
                      return <p className="text-xs text-muted-foreground p-3 text-center">No items ordered yet.</p>;
                    }

                    return rows.map((row: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-xs text-foreground">
                        <span>
                          {row.qty}× {row.name}
                        </span>
                        <span className="font-semibold">
                          {currencySymbol}{(row.price * row.qty).toFixed(2)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Order history timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Order Timeline
                </h4>
                <div className="space-y-2">
                  {sessionDetail.orders.map((o: any) => (
                    <div key={o.id} className="flex justify-between items-center text-xs p-3 rounded-lg border border-border/50 bg-muted/10">
                      <div>
                        <p className="font-semibold text-foreground">Order #{o.orderNumber}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(o.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{o.status}</span>
                        <p className="font-bold text-foreground mt-0.5">{currencySymbol}{o.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Bill Section */}
              {sessionDetail.bill && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Receipt className="h-4 w-4" />
                      Invoice {sessionDetail.bill.billNumber}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded uppercase">
                      {sessionDetail.bill.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground border-t border-emerald-500/15 pt-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{currencySymbol}{sessionDetail.bill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes (GST {sessionDetail.bill.taxRate}%)</span>
                      <span>{currencySymbol}{sessionDetail.bill.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-foreground font-bold border-t border-emerald-500/15 pt-1.5">
                      <span>Grand Total</span>
                      <span>{currencySymbol}{sessionDetail.bill.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DrawerFooter className="mx-5 mb-5 mt-2 gap-2 flex-row border-t border-border/40 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSessionId(null)}
              className="flex-1 cursor-pointer text-xs"
            >
              Close Panel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintSessionBill(sessionDetail!.id, sessionDetail!.table.name)}
              className="flex-1 cursor-pointer text-xs gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Print Bill
            </Button>

            {!sessionDetail?.bill ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleGenerateBill(sessionDetail!.id)}
                isLoading={billingLoading[sessionDetail?.id]}
                disabled={!sessionDetail || sessionDetail.orders.filter((o: any) => o.status !== "CANCELLED").length === 0}
                className="flex-1 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
              >
                <Receipt className="h-4 w-4" />
                Generate Invoice
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCloseSession(sessionDetail!.id)}
                isLoading={closingLoading[sessionDetail?.id]}
                className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete Payment
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
