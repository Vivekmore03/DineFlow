import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MenuManager } from "@/components/menu/menu-manager";

export const metadata = {
  title: "Menu — QR Dine",
  description: "Manage restaurant menu categories and items",
};

export default async function MenuPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) redirect("/login");

  const user = await verifyAccessToken(accessToken);
  if (!user || user.role !== "OWNER" || !user.restaurantId) {
    redirect("/login?error=unauthorized");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: user.restaurantId },
    select: { currency: true },
  });

  return (
    <div className="w-full">
      <MenuManager
        restaurantId={user.restaurantId}
        currency={restaurant?.currency ?? "INR"}
      />
    </div>
  );
}
