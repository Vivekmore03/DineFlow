"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShoppingCart, X, Minus, Plus, Trash2, ChevronDown,
  CheckCircle2, Loader2, StickyNote, ArrowRight
} from "lucide-react";
import { useCart } from "@/providers/cart-context";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  slug: string;
  tableId: string;
  tableName: string;
  sessionToken: string;
  currencySymbol: string;
}

type DrawerState = "closed" | "mini" | "full";

interface PlacedOrder {
  id: string;
  orderNumber: number;
  totalAmount: number;
  items: { name: string; quantity: number; price: number }[];
}

export function CartDrawer({
  slug, tableId, tableName, sessionToken, currencySymbol,
}: CartDrawerProps) {
  const { items, totalItems, totalAmount, increment, decrement, clearCart } = useCart();
  const [drawerState, setDrawerState] = useState<DrawerState>("closed");
  const [specialNotes, setSpecialNotes] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsPlacing(true);
    try {
      const res = await fetch(`/api/customer/${slug}/${tableId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          specialNotes: specialNotes.trim() || undefined,
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to place order");
        return;
      }

      const data = await res.json();
      setPlacedOrder(data.order);
      clearCart();
      setSpecialNotes("");
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const handleDismissSuccess = () => {
    setPlacedOrder(null);
    setDrawerState("closed");
  };

  // ─── Floating Cart Pill (always visible when items in cart) ──────────
  if (totalItems === 0 && drawerState === "closed") return null;

  return (
    <>
      {/* ── Backdrop ── */}
      {drawerState === "full" && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDrawerState("closed")}
        />
      )}

      {/* ── Cart Pill / Drawer ── */}
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 transition-all duration-300 ease-in-out",
          drawerState === "full" ? "bottom-0" : "bottom-4 px-4"
        )}
      >
        {drawerState !== "full" ? (
          /* ── Floating Cart Pill ── */
          <button
            onClick={() => setDrawerState("full")}
            className="w-full flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-4 py-3.5 shadow-lg shadow-primary/25 hover:bg-primary/95 active:scale-[0.98] transition-all duration-200 cursor-pointer animate-in slide-in-from-bottom-4 fade-in"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">
                {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold">{currencySymbol}{totalAmount.toFixed(2)}</span>
              <ArrowRight className="h-4 w-4 opacity-70" />
            </div>
          </button>
        ) : (
          /* ── Full Drawer ── */
          <div className="bg-card rounded-t-3xl border-t border-x border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[80dvh] flex flex-col">
            {/* Drawer Handle */}
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div>
                <h3 className="text-base font-bold text-foreground">Your Order</h3>
                <p className="text-xs text-muted-foreground">{tableName}</p>
              </div>
              <button
                onClick={() => setDrawerState("closed")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* ── Success State ── */}
            {placedOrder && (
              <div className="flex flex-col items-center gap-4 px-6 py-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Order Placed! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order #{placedOrder.orderNumber} · {currencySymbol}{placedOrder.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="w-full rounded-xl bg-muted/40 border border-border/60 divide-y divide-border/40 text-left">
                  {placedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-xs text-foreground">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your order is being prepared. Please wait! 🍳
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDismissSuccess}
                  className="w-full cursor-pointer"
                >
                  Continue Browsing
                </Button>
              </div>
            )}

            {/* ── Cart Items ── */}
            {!placedOrder && (
              <>
                <div className="overflow-y-auto flex-1 divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-3 px-5 py-3.5">
                      {/* Thumbnail */}
                      {item.image && (
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {currencySymbol}{item.price.toFixed(2)} each
                        </p>
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => decrement(item.menuItemId)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-all active:scale-90 cursor-pointer border border-border/60"
                        >
                          {item.quantity === 1
                            ? <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                        </button>
                        <span className="text-sm font-bold text-foreground w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => increment(item.menuItemId)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90 cursor-pointer shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {/* Line total */}
                      <span className="text-sm font-semibold text-foreground w-14 text-right shrink-0">
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Special notes */}
                <div className="px-5 pt-3 pb-1">
                  <div className="flex items-start gap-2 rounded-xl bg-muted/40 border border-border/60 px-3 py-2.5">
                    <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <textarea
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Add a note (allergies, preferences…)"
                      rows={2}
                      maxLength={300}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pt-3 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      {currencySymbol}{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handlePlaceOrder}
                    isLoading={isPlacing}
                    disabled={isPlacing || items.length === 0}
                    className="w-full h-12 text-sm font-semibold cursor-pointer rounded-xl gap-2"
                  >
                    {!isPlacing && (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Place Order · {currencySymbol}{totalAmount.toFixed(2)}
                      </>
                    )}
                    {isPlacing && "Placing order…"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
