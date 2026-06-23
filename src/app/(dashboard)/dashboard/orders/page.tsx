import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrdersManager } from "@/components/orders/orders-manager";

export const metadata = {
  title: "Orders Dashboard — QR Dine",
  description: "Monitor and manage restaurant cooking queue",
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) redirect("/login");

  const user = await verifyAccessToken(accessToken);
  if (!user || !user.restaurantId) {
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
      <OrdersManager
        restaurantId={user.restaurantId}
        currency={restaurant.currency}
        isKitchenView={user.role === "KITCHEN_STAFF"}
      />
    </div>
  );
}
