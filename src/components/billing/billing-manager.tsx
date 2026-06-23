"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Receipt, Search, RefreshCw, Eye, Printer, CheckCircle2,
  Calendar, CreditCard, Loader2, ArrowLeft, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import { EmptyStateComponent } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BillData {
  id: string;
  billNumber: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: "PENDING" | "PAID";
  createdAt: string;
  items: BillItem[];
  sessionId: string;
  session: {
    table: {
      name: string;
      number: number;
    };
  };
}

interface BillingManagerProps {
  restaurantId: string;
  currency: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$", AED: "د.إ",
};

export function BillingManager({ restaurantId, currency }: BillingManagerProps) {
  const [bills, setBills] = useState<BillData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const printRef = useRef<HTMLDivElement>(null);

  const fetchBills = useCallback(async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/bills`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBills(data.bills || []);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleMarkPaid = async (bill: BillData) => {
    setIsClosing(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/sessions/${bill.sessionId}/close`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to mark bill as paid");
      } else {
        toast.success(`Bill ${bill.billNumber} marked as paid successfully!`);
        fetchBills();
        setSelectedBill(null);
      }
    } catch {
      toast.error("An error occurred while confirming payment");
    } finally {
      setIsClosing(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${selectedBill?.billNumber}</title>
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
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filtered = bills.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      b.session.table.name.toLowerCase().includes(q) ||
      b.paymentStatus.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing Tracker</h1>
          <p className="text-sm text-muted-foreground">
            View, audit, print, and process payments for all generated guest invoices.
          </p>
        </div>

        <button
          onClick={() => fetchBills(true)}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border hover:bg-secondary cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4.5 w-4.5 text-muted-foreground", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Bills</p>
          <p className="text-2xl font-bold text-foreground mt-1.5">{bills.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid Invoices</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1.5">
            {bills.filter((b) => b.paymentStatus === "PAID").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unpaid / Pending</p>
          <p className="text-2xl font-bold text-amber-500 mt-1.5">
            {bills.filter((b) => b.paymentStatus === "PENDING").length}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices..."
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty States */}
      {!isLoading && bills.length === 0 && (
        <EmptyStateComponent
          icon={Receipt}
          title="No bills generated yet"
          description="Invoices appear here once generated from the Active Sessions tab."
        />
      )}

      {!isLoading && bills.length > 0 && filtered.length === 0 && (
        <EmptyStateComponent
          icon={Search}
          title="No invoices found"
          description={`No invoices match "${search}".`}
        />
      )}

      {/* Bills Data Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1.5fr_1.5fr_1fr_1.2fr] gap-4 px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill Number</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Grand Total</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</p>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((bill) => (
              <div
                key={bill.id}
                className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1.5fr_1.5fr_1fr_1.2fr] gap-4 items-center px-5 py-4 hover:bg-muted/10 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{bill.billNumber}</p>
                  <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{bill.session.table.name}</p>
                </div>

                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-foreground">{bill.session.table.name}</span>
                </div>

                <div className="text-right sm:pr-2">
                  <span className="text-sm font-bold text-foreground">
                    {currencySymbol}{bill.grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                    bill.paymentStatus === "PAID"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    {bill.paymentStatus}
                  </span>
                </div>

                <div className="flex justify-end gap-2 col-span-2 sm:col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBill(bill)}
                    className="h-8 cursor-pointer text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline ml-1">View</span>
                  </Button>

                  {bill.paymentStatus === "PENDING" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMarkPaid(bill)}
                      isLoading={isClosing && selectedBill?.id === bill.id}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs"
                    >
                      Paid
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      <Dialog open={!!selectedBill} onOpenChange={(o) => { if (!o) setSelectedBill(null); }}>
        <DialogContent className="max-w-sm bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Receipt className="h-5 w-5 text-primary" />
              Tax Invoice
            </DialogTitle>
            <DialogDescription>
              Details for invoice {selectedBill?.billNumber}.
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4">
              {/* Receipt formatting for screen/print */}
              <div
                ref={printRef}
                className="bg-muted/10 border border-border/80 rounded-xl p-5 space-y-4 font-mono text-xs text-foreground bg-card"
              >
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="flex justify-center mb-1">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">QR DINE RESTAURANT</h3>
                  <p className="text-[10px] text-muted-foreground">{selectedBill.session.table.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Date: {new Date(selectedBill.createdAt).toLocaleDateString()} {new Date(selectedBill.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="border-t border-dashed border-border/60 my-2" />

                {/* Items Table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-dashed border-border/60 font-bold">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1">{item.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">{currencySymbol}{item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-border/60 my-2" />

                {/* Total */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{selectedBill.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({selectedBill.taxRate}%)</span>
                    <span>{currencySymbol}{selectedBill.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-foreground border-t border-dashed border-border/60 pt-2 mt-1">
                    <span>Grand Total</span>
                    <span>{currencySymbol}{selectedBill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-border/60 my-2" />

                <div className="text-center text-[10px] text-muted-foreground">
                  <p>Thank you for dining with us!</p>
                  <p className="mt-0.5">Payment Status: {selectedBill.paymentStatus}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex-1 cursor-pointer text-xs gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>

                {selectedBill.paymentStatus === "PENDING" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMarkPaid(selectedBill)}
                    isLoading={isClosing}
                    className="flex-1 cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Record Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
