import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import Link from "next/link";
import { UtensilsCrossed, ArrowRight, Settings, QrCode, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard — QR Dine",
  description: "QR Dine restaurant management dashboard",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) redirect("/login");

  const user = await verifyAccessToken(accessToken);
  if (!user) redirect("/login");

  if (user.role === "KITCHEN_STAFF") redirect("/kitchen");

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Welcome Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back! 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Your restaurant dashboard is ready. Start managing tables, menu, and orders.
        </p>
      </div>

      {/* Quick-start cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Settings,
            color: "text-primary",
            bg: "bg-primary/8 border-primary/15",
            title: "Complete Setup",
            description: "Add your restaurant logo, address, and GST number to get started.",
            href: "/dashboard/settings",
            cta: "Go to Settings",
          },
          {
            icon: QrCode,
            color: "text-sky-500",
            bg: "bg-sky-500/8 border-sky-500/15",
            title: "Add Tables & QR Codes",
            description: "Create tables and generate unique QR codes for each.",
            href: "/dashboard/tables",
            cta: "Manage Tables",
          },
          {
            icon: ClipboardList,
            color: "text-amber-500",
            bg: "bg-amber-500/8 border-amber-500/15",
            title: "Build Your Menu",
            description: "Add categories and menu items with photos and pricing.",
            href: "/dashboard/menu",
            cta: "Build Menu",
          },
        ].map((card) => (
          <div
            key={card.href}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-xs transition-all duration-200 glow-card"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="font-semibold text-sm text-foreground">{card.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
            <Link href={card.href}>
              <Button variant="secondary" size="sm" className="w-full gap-2 cursor-pointer justify-between text-xs">
                {card.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Placeholder stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Tables", value: "—", desc: "Configure in Tables" },
          { label: "Menu Items", value: "—", desc: "Add items in Menu" },
          { label: "Today's Orders", value: "—", desc: "No orders yet" },
          { label: "Active Sessions", value: "—", desc: "No active diners" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4"
          >
            <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            <span className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</span>
            <span className="text-[10px] text-muted-foreground/70">{stat.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
