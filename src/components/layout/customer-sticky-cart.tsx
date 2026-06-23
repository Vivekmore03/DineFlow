"use client";

import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StickyCartProps {
  itemCount: number;
  subtotal: number;
  onClick: () => void;
}

export function CustomerStickyCart({ itemCount, subtotal, onClick }: StickyCartProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-18 left-0 right-0 z-20 mx-auto w-full max-w-md px-4 select-none animate-in slide-in-from-bottom-6 fade-in duration-300">
      <button
        onClick={onClick}
        className="flex items-center justify-between w-full h-12 bg-linear-to-b from-primary to-[hsl(var(--primary)/0.95)] hover:shadow-lg active:scale-[0.99] text-primary-foreground px-4 rounded-xl shadow-md cursor-pointer transition-all duration-150"
      >
        {/* Left: Summary */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-xs font-bold leading-none">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-[10px] text-white/80 font-medium mt-1">
              Subtotal: {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          <span>View Cart</span>
          <ArrowRight className="h-4 w-4 animate-pulse" />
        </div>
      </button>
    </div>
  );
}
