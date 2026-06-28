"use client";

import { useAuthStore } from "@/lib/store/use-auth-store";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: {
    id: string;
    type: 'ORDER' | 'BILL' | 'SESSION' | 'WAITER';
    title: string;
    time: string | Date;
    status: string;
    table: string;
    total?: number;
  }[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const { restaurant } = useAuthStore();
  const currency = restaurant?.currency || "INR";

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card p-6 h-full min-h-[300px]">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No recent activity.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 h-full">
      <h3 className="font-semibold text-foreground mb-6">Recent Activity</h3>
      <div className="relative flex flex-col gap-6 before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-border">
        {activities.map((activity) => {
          let dotColor = "bg-primary";
          if (activity.type === 'BILL') dotColor = activity.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500';
          else if (activity.type === 'WAITER') dotColor = "bg-rose-500";
          else if (activity.type === 'SESSION') dotColor = activity.status === 'COMPLETED' ? "bg-muted-foreground" : "bg-sky-500";

          return (
            <div key={activity.id} className="relative flex items-start gap-4">
              <div className={`mt-1.5 h-5 w-5 shrink-0 rounded-full border-4 border-card ${dotColor} z-10`} />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{activity.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Table: {activity.table}</span>
                  {activity.total !== undefined && (
                    <span className="text-xs font-semibold text-foreground">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(activity.total)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
