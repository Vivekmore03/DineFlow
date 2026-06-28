"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { getDashboardAnalytics } from "@/app/actions/analytics";
import { EVENTS } from "@/lib/events";
import { useSocket } from "@/lib/store/use-socket";
import { KpiCards } from "./kpi-cards";
import { RevenueChart } from "./revenue-chart";
import { KitchenStatus } from "./kitchen-status";
import { TopItems } from "./top-items";
import { ActivityFeed } from "./activity-feed";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

export function DashboardClient({ restaurantId }: { restaurantId: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent restaurantId={restaurantId} />
    </QueryClientProvider>
  );
}

function DashboardContent({ restaurantId }: { restaurantId: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics', restaurantId],
    queryFn: () => getDashboardAnalytics(restaurantId),
    refetchInterval: 60000,
  });

  const { socket } = useSocket(restaurantId, "staff");

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      refetch();
    };

    socket.on(EVENTS.ORDER_CREATED, handleRefresh);
    socket.on(EVENTS.ORDER_UPDATED, handleRefresh);
    socket.on(EVENTS.WAITER_CALL, handleRefresh);
    socket.on(EVENTS.BILL_REQUEST, handleRefresh);
    socket.on(EVENTS.BILL_GENERATED, handleRefresh);
    socket.on(EVENTS.BILL_PAID, handleRefresh);
    socket.on(EVENTS.SESSION_UPDATED, handleRefresh);

    return () => {
      socket.off(EVENTS.ORDER_CREATED, handleRefresh);
      socket.off(EVENTS.ORDER_UPDATED, handleRefresh);
      socket.off(EVENTS.WAITER_CALL, handleRefresh);
      socket.off(EVENTS.BILL_REQUEST, handleRefresh);
      socket.off(EVENTS.BILL_GENERATED, handleRefresh);
      socket.off(EVENTS.BILL_PAID, handleRefresh);
      socket.off(EVENTS.SESSION_UPDATED, handleRefresh);
    };
  }, [socket, refetch]);

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <KpiCards kpis={data.kpis} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RevenueChart data={data.revenueAnalytics.dailyRevenueTrend} />
          <KitchenStatus kitchenAnalytics={data.kitchenAnalytics} />
        </div>
        <div className="flex flex-col gap-6">
          <TopItems items={data.topSellingItems} />
          <ActivityFeed activities={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}
