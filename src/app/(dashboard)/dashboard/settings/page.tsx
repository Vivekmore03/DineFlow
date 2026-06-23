import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import { RestaurantSettingsForm } from "@/components/restaurant/restaurant-settings-form";

export const metadata = {
  title: "Restaurant Settings — QR Dine",
  description: "Manage your restaurant profile, logo, address, and tax configuration",
};

export default async function SettingsPage() {
  // Server-side auth check — read access token from cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const user = await verifyAccessToken(accessToken);
  if (!user || user.role !== "OWNER" || !user.restaurantId) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex justify-center w-full">
      <RestaurantSettingsForm restaurantId={user.restaurantId} />
    </div>
  );
}
