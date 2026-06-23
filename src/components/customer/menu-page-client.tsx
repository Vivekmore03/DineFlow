"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, WifiOff } from "lucide-react";
import { CartProvider } from "@/providers/cart-context";
import { CustomerMenu } from "@/components/customer/customer-menu";
import { CartDrawer } from "@/components/customer/cart-drawer";
import { RestaurantHeader } from "@/components/customer/restaurant-header";

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

interface CategoryData {
  id: string;
  name: string;
  items: MenuItemData[];
}

interface SessionData {
  restaurant: {
    id: string;
    name: string;
    logo: string | null;
    currency: string;
    taxRate: number;
  };
  table: {
    id: string;
    name: string;
    number: number;
  };
  session: {
    id: string;
    token: string;
  };
  menu: CategoryData[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", SGD: "S$", AED: "د.إ",
};

export function MenuPageClient({
  slug,
  tableId,
}: {
  slug: string;
  tableId: string;
}) {
  const [data, setData] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "not_found" | "ready">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = typeof window !== "undefined" ? localStorage.getItem(`qrd_session_${tableId}`) : null;
        const url = savedToken
          ? `/api/customer/${slug}/${tableId}/session?token=${savedToken}`
          : `/api/customer/${slug}/${tableId}/session`;

        const res = await fetch(url);
        if (res.status === 404) { setStatus("not_found"); return; }
        if (!res.ok) {
          const err = await res.json();
          setErrorMsg(err.error || "Something went wrong");
          setStatus("error");
          return;
        }
        const json: SessionData = await res.json();

        // Persist session token to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(`qrd_session_${tableId}`, json.session.token);
        }

        setData(json);
        setStatus("ready");
      } catch {
        setErrorMsg("Could not connect. Check your internet connection.");
        setStatus("error");
      }
    };
    bootstrap();
  }, [slug, tableId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Loading menu…</p>
          <p className="text-xs text-muted-foreground mt-1">Just a moment</p>
        </div>
      </div>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (status === "not_found") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 text-center px-4">
        <div className="text-4xl">🪑</div>
        <div>
          <p className="text-base font-bold text-foreground">Table not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This QR code may be outdated. Please ask your server for a new QR code.
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === "error" || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
          <WifiOff className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">Unable to load menu</p>
          <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
        </div>
        <button
          onClick={() => { setStatus("loading"); setErrorMsg(""); }}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currencySymbol = CURRENCY_SYMBOLS[data.restaurant.currency] ?? data.restaurant.currency;

  return (
    <CartProvider>
      {/* Restaurant header — full-width, outside padding */}
      <div className="-mx-4 -mt-4 mb-4">
        <RestaurantHeader
          name={data.restaurant.name}
          logo={data.restaurant.logo}
          tableName={data.table.name}
          tableNumber={data.table.number}
        />
      </div>

      {/* Menu */}
      <CustomerMenu menu={data.menu} currencySymbol={currencySymbol} />

      {/* Floating cart pill + drawer */}
      <CartDrawer
        slug={slug}
        tableId={tableId}
        tableName={data.table.name}
        sessionToken={data.session.token}
        currencySymbol={currencySymbol}
      />
    </CartProvider>
  );
}
