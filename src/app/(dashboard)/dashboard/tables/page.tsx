import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TablesManager } from "@/components/tables/tables-manager";

export const metadata = {
  title: "Tables — QR Dine",
  description: "Manage restaurant tables and QR codes",
};

export default async function TablesPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) redirect("/login");

  const user = await verifyAccessToken(accessToken);
  if (!user || user.role !== "OWNER" || !user.restaurantId) {
    redirect("/login?error=unauthorized");
  }

  // Fetch the restaurant slug server-side for QR URL generation
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: user.restaurantId },
    select: { slug: true },
  });

  if (!restaurant) redirect("/login");

  return (
    <div className="flex flex-col w-full">
      <TablesManager
        restaurantId={user.restaurantId}
        restaurantSlug={restaurant.slug}
      />
    </div>
  );
}
