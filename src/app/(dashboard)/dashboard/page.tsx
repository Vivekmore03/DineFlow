import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = {
  title: "Dashboard Overview — QR Dine",
  description: "QR Dine restaurant management dashboard",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) redirect("/login");

  const user = await verifyAccessToken(accessToken);
  if (!user) redirect("/login");

  if (user.role === "KITCHEN_STAFF") redirect("/kitchen");

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: user.userId },
  });

  if (!restaurant) redirect("/setup");

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Live analytics and insights for {restaurant.name}.
        </p>
      </div>

      <DashboardClient restaurantId={restaurant.id} />
    </div>
  );
}
