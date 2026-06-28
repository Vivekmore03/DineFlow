"use client";

import { useAuthStore } from "@/lib/store/use-auth-store";

interface TopItemsProps {
  items: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export function TopItems({ items }: TopItemsProps) {
  const { restaurant } = useAuthStore();
  const currency = restaurant?.currency || "INR";

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card p-6 h-full">
        <h3 className="font-semibold text-foreground mb-4">Top Selling Items</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No items sold yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 h-full">
      <h3 className="font-semibold text-foreground mb-6">Top Selling Items</h3>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.quantity} sold</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(item.revenue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
