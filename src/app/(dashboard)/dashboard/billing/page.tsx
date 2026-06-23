import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingManager } from "@/components/billing/billing-manager";

export const metadata = {
  title: "Billing Tracker — QR Dine",
  description: "View and process restaurant invoices",
};

export default async function BillingPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) redirect("/login");

  const user = await verifyAccessToken(accessToken);
  if (!user || user.role !== "OWNER" || !user.restaurantId) {
    redirect("/login?error=unauthorized");
  }

  // Fetch the restaurant currency server-side for display
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: user.restaurantId },
    select: { currency: true },
  });

  if (!restaurant) redirect("/login");

  return (
    <div className="flex flex-col w-full">
      <BillingManager
        restaurantId={user.restaurantId}
        currency={restaurant.currency}
      />
    </div>
  );
}
