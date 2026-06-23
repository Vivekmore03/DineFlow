"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Minus, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { useCart } from "@/providers/cart-context";
import { cn } from "@/lib/utils";

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

interface CustomerMenuProps {
  menu: CategoryData[];
  currencySymbol: string;
}

// ─── Item Card ─────────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  currencySymbol,
}: {
  item: MenuItemData;
  currencySymbol: string;
}) {
  const { addItem, increment, decrement, getQuantity } = useCart();
  const qty = getQuantity(item.id);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image: item.image });
    setTimeout(() => setIsAdding(false), 400);
  };

  return (
    <div className="flex gap-3 py-3.5 border-b border-border/60 last:border-0 group">
      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-foreground">
            {currencySymbol}{item.price.toFixed(2)}
          </span>

          {/* Quantity control */}
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer",
                isAdding
                  ? "bg-primary text-primary-foreground border-primary scale-95"
                  : "border-primary text-primary hover:bg-primary/8 active:scale-95"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => decrement(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all active:scale-90 cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-sm font-bold text-foreground w-4 text-center">{qty}</span>
              <button
                onClick={() => increment(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90 cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border/40">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <UtensilsCrossed className="h-7 w-7 text-muted-foreground/25" />
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm">
            {qty}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Menu Component ──────────────────────────────────────────────────
export function CustomerMenu({ menu, currencySymbol }: CustomerMenuProps) {
  const [activeCategory, setActiveCategory] = useState(menu[0]?.id ?? "");
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isManualScrollRef = useRef(false);

  // ── Sticky category tab nav ──────────────────────────────────────────
  const scrollToCategory = (catId: string) => {
    const el = categoryRefs.current[catId];
    if (!el) return;
    isManualScrollRef.current = true;
    setActiveCategory(catId);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isManualScrollRef.current = false; }, 800);
  };

  // Intersection observer to update active pill on scroll
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    menu.forEach((cat) => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isManualScrollRef.current) {
            setActiveCategory(cat.id);
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [menu]);

  if (menu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 border border-border">
          <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Menu coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">No items are available right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── Category Pills (sticky inside the scrollable main) ── */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border/60">
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Sections ── */}
      <div className="flex flex-col gap-0 mt-3">
        {menu.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
            className="mb-6"
          >
            <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <span>{cat.name}</span>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {cat.items.length}
              </span>
            </h2>
            <div className="rounded-xl bg-card border border-border/60 px-3 divide-y divide-border/40 overflow-hidden">
              {cat.items.map((item) => (
                <MenuItemCard key={item.id} item={item} currencySymbol={currencySymbol} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
