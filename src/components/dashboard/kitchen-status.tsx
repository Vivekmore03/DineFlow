"use client";

interface KitchenStatusProps {
  kitchenAnalytics: {
    pending: number;
    preparing: number;
    ready: number;
    served: number;
  };
}

export function KitchenStatus({ kitchenAnalytics }: KitchenStatusProps) {
  const statuses = [
    { label: "Pending", value: kitchenAnalytics.pending, color: "bg-rose-500", text: "text-rose-500" },
    { label: "Preparing", value: kitchenAnalytics.preparing, color: "bg-amber-500", text: "text-amber-500" },
    { label: "Ready", value: kitchenAnalytics.ready, color: "bg-emerald-500", text: "text-emerald-500" },
    { label: "Served", value: kitchenAnalytics.served, color: "bg-blue-500", text: "text-blue-500" },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6">
      <h3 className="font-semibold text-foreground mb-4">Live Kitchen Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuses.map((status) => (
          <div key={status.label} className="flex flex-col gap-2 p-4 rounded-lg bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${status.color} animate-pulse`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{status.label}</span>
            </div>
            <span className={`text-3xl font-bold tracking-tight ${status.text}`}>{status.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
