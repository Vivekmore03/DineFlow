import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionsManager } from "@/components/sessions/sessions-manager";

export const metadata = {
  title: "Active Sessions — QR Dine",
  description: "Monitor occupied tables and checkout requests",
};

export default async function SessionsPage() {
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
      <SessionsManager
        restaurantId={user.restaurantId}
        currency={restaurant.currency}
      />
    </div>
  );
}
