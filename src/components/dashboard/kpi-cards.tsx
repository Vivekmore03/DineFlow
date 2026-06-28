"use client";

import { DollarSign, ShoppingBag, Users, UtensilsCrossed, FileClock, Table } from "lucide-react";
import { useAuthStore } from "@/lib/store/use-auth-store";

interface KpiCardsProps {
  kpis: {
    todayRevenue: number;
    todayOrders: number;
    activeTables: number;
    activeSessions: number;
    pendingOrders: number;
    pendingBillRequests: number;
    totalMenuItems: number;
  };
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const { restaurant } = useAuthStore();
  const currency = restaurant?.currency || "INR";

  const cards = [
    {
      title: "Today's Revenue",
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(kpis.todayRevenue),
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Today's Orders",
      value: kpis.todayOrders.toString(),
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Tables",
      value: kpis.activeTables.toString(),
      icon: Table,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Active Sessions",
      value: kpis.activeSessions.toString(),
      icon: Users,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Pending Orders",
      value: kpis.pendingOrders.toString(),
      icon: FileClock,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "Menu Items",
      value: kpis.totalMenuItems.toString(),
      icon: UtensilsCrossed,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-border/80 hover:shadow-xs transition-all duration-200 glow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-foreground tracking-tight">{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
