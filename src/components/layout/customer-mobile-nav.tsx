"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ShoppingBag, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function CustomerMobileNav({
  cartCount = 0,
  onCartClick,
}: {
  cartCount?: number;
  onCartClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to check active paths
  const isMenu = !pathname.endsWith("/order-status");
  const isOrders = pathname.endsWith("/order-status");

  const handleNavigation = (path: string) => {
    // Trim current trailing slash or statuses to navigate cleanly
    const basePath = pathname.replace(/\/order-status$/, "");
    if (path === "menu") {
      router.push(basePath);
    } else if (path === "orders") {
      router.push(`${basePath}/order-status`);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md border-t border-border bg-background/95 backdrop-blur-md px-6 py-2 shadow-lg select-none">
      <div className="flex items-center justify-around h-12">
        {/* Menu Tab */}
        <button
          onClick={() => handleNavigation("menu")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer focus:outline-hidden transition-all duration-150 h-full w-14",
            isMenu ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span>Menu</span>
        </button>

        {/* Cart Tab (Triggers Drawer) */}
        <button
          onClick={onCartClick}
          className="relative flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer focus:outline-hidden text-muted-foreground hover:text-foreground h-full w-14 transition-all"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs animate-in zoom-in duration-200">
                {cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        {/* Orders Track Tab */}
        <button
          onClick={() => handleNavigation("orders")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer focus:outline-hidden transition-all duration-150 h-full w-14",
            isOrders ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ClipboardCheck className="h-5 w-5" />
          <span>My Orders</span>
        </button>
      </div>
    </div>
  );
}
